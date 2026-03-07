import * as fs from 'fs';
import * as path from 'path';
import type { DesignToken, TokenCategory, TokenViolation, TokenSuggestion } from '../types';

const FORBIDDEN_FONTS = ['Inter', 'Roboto', 'System UI', 'Arial', 'Helvetica', 'sans-serif'];
const SPACING_PROPERTIES = ['padding', 'margin', 'gap', 'top', 'right', 'bottom', 'left', 'width', 'height', 'inset'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);

// ----------------------------------------------------------------
// File scanning entry points
// ----------------------------------------------------------------

export function scanFile(filePath: string, tokens: DesignToken[]): TokenViolation[] {
  const ext = path.extname(filePath).toLowerCase();
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  if (['.css', '.scss', '.sass'].includes(ext)) return scanCSS(filePath, content, tokens);
  if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) return scanTSX(filePath, content, tokens);
  return [];
}

export function scanDirectory(dirPath: string, tokens: DesignToken[]): TokenViolation[] {
  const violations: TokenViolation[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      violations.push(...scanDirectory(fullPath, tokens));
    } else if (entry.isFile()) {
      violations.push(...scanFile(fullPath, tokens));
    }
  }
  return violations;
}

// ----------------------------------------------------------------
// CSS scanner
// ----------------------------------------------------------------

function scanCSS(filePath: string, content: string, tokens: DesignToken[]): TokenViolation[] {
  const violations: TokenViolation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Skip blank lines and comment-only lines
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('//')) continue;

    // Strip inline comments before analysis (e.g. "color: #fff; /* use var(--x) */")
    const codePart = trimmed.split('/*')[0].trim();
    if (!codePart) continue;
    if (codePart.includes('var(--')) continue;

    const property = extractCSSProperty(codePart);

    // Check hex colors (only in code part, not comments)
    for (const match of codePart.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      const rawValue = match[0];
      const suggestions = matchColor(rawValue, tokens);
      violations.push({
        file: filePath, line: lineNum, rawValue, property,
        context: trimmed,
        suggestions,
        severity: suggestions.some(s => s.confidence >= 0.99) ? 'error' : 'warning',
      });
    }

    // Check raw px values on spacing-related properties
    if (SPACING_PROPERTIES.some(p => property.includes(p))) {
      for (const match of codePart.matchAll(/\b(\d+(?:\.\d+)?px)\b/g)) {
        const rawValue = match[1];
        if (rawValue === '0px') continue; // 0 is always acceptable
        const suggestions = matchSpacing(rawValue, tokens);
        if (suggestions.length > 0) {
          violations.push({
            file: filePath, line: lineNum, rawValue, property,
            context: trimmed,
            suggestions,
            severity: 'error',
          });
        }
      }
    }

    // Check forbidden font families
    for (const font of FORBIDDEN_FONTS) {
      if (property.includes('font-family') && codePart.includes(font)) {
        violations.push({
          file: filePath, line: lineNum, rawValue: font, property,
          context: trimmed,
          suggestions: matchTypography(tokens),
          severity: 'error',
        });
        break;
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// TSX/JSX scanner
// ----------------------------------------------------------------

function scanTSX(filePath: string, content: string, tokens: DesignToken[]): TokenViolation[] {
  const violations: TokenViolation[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    // Skip lines already using tokens
    if (trimmed.includes('var(--')) continue;

    // Hex colors in string literals (style props)
    for (const match of trimmed.matchAll(/'(#[0-9a-fA-F]{3,8})'|"(#[0-9a-fA-F]{3,8})"/g)) {
      const rawValue = (match[1] ?? match[2]);
      const suggestions = matchColor(rawValue, tokens);
      violations.push({
        file: filePath, line: lineNum, rawValue,
        property: inferPropertyFromLine(line, rawValue),
        context: trimmed.slice(0, 100),
        suggestions,
        severity: 'error',
      });
    }

    // Raw px string values in style props: '12px', "16px"
    for (const match of trimmed.matchAll(/'(\d+px)'|"(\d+px)"/g)) {
      const rawValue = (match[1] ?? match[2]);
      if (rawValue === '0px') continue;
      const property = inferPropertyFromLine(line, `'${match[1] ?? ''}'` || `"${match[2] ?? ''}"`);
      // Choose matcher based on property type
      const isTypography = /font.?size|fontSize/i.test(property);
      const suggestions = isTypography
        ? matchPxToken(rawValue, tokens, 'typography')
        : matchSpacing(rawValue, tokens);
      if (suggestions.length > 0) {
        violations.push({
          file: filePath, line: lineNum, rawValue, property,
          context: trimmed.slice(0, 100),
          suggestions,
          severity: 'warning',
        });
      }
    }

    // Forbidden fonts in string literals
    for (const font of FORBIDDEN_FONTS) {
      if ((line.includes(`'${font}'`) || line.includes(`"${font}"`)) && line.includes('font')) {
        violations.push({
          file: filePath, line: lineNum, rawValue: font,
          property: 'font-family',
          context: trimmed.slice(0, 100),
          suggestions: matchTypography(tokens),
          severity: 'error',
        });
        break;
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Token matching
// ----------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  let clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6 && clean.length !== 8) return null;
  clean = clean.slice(0, 6); // ignore alpha channel for distance calc
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  return Math.sqrt(
    (rgb1[0] - rgb2[0]) ** 2 +
    (rgb1[1] - rgb2[1]) ** 2 +
    (rgb1[2] - rgb2[2]) ** 2,
  );
}

function matchColor(rawHex: string, tokens: DesignToken[]): TokenSuggestion[] {
  const MAX_DIST = Math.sqrt(3 * 255 ** 2);
  return tokens
    .filter(t => t.category === 'color')
    .map(t => ({
      token: t.name,
      tokenValue: t.value,
      confidence: Math.max(0, 1 - colorDistance(rawHex, t.value) / MAX_DIST),
    }))
    .filter(s => s.confidence > 0.8)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function matchSpacing(rawPx: string, tokens: DesignToken[]): TokenSuggestion[] {
  const pxValue = parseFloat(rawPx);
  return tokens
    .filter(t => t.category === 'spacing')
    .map(t => {
      const tokenPx = parseFloat(t.value);
      const diff = Math.abs(pxValue - tokenPx);
      const confidence = diff === 0 ? 1 : diff <= 2 ? 0.75 : diff <= 4 ? 0.5 : 0;
      return { token: t.name, tokenValue: t.value, confidence };
    })
    .filter(s => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function matchPxToken(rawPx: string, tokens: DesignToken[], category: TokenCategory): TokenSuggestion[] {
  const pxValue = parseFloat(rawPx);
  return tokens
    .filter(t => t.category === category && t.value.endsWith('px'))
    .map(t => {
      const tokenPx = parseFloat(t.value);
      const diff = Math.abs(pxValue - tokenPx);
      const confidence = diff === 0 ? 1 : diff <= 1 ? 0.9 : diff <= 2 ? 0.75 : 0;
      return { token: t.name, tokenValue: t.value, confidence };
    })
    .filter(s => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function matchTypography(tokens: DesignToken[]): TokenSuggestion[] {
  return tokens
    .filter(t => t.category === 'typography' && t.name.includes('font-family'))
    .map(t => ({ token: t.name, tokenValue: t.value, confidence: 1 }));
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function extractCSSProperty(line: string): string {
  const match = line.match(/^([\w-]+)\s*:/);
  return match ? match[1] : 'unknown';
}

function inferPropertyFromLine(line: string, value: string): string {
  // Find the identifier immediately before this value: e.g. "fontSize: '14px'" → "fontSize"
  const idx = line.indexOf(value);
  if (idx >= 0) {
    const before = line.slice(0, idx);
    const match = before.match(/(\w+)\s*:\s*['"]?\s*$/);
    if (match) return match[1];
  }
  return 'style prop';
}
