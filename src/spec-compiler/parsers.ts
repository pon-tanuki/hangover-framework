import * as fs from 'fs';
import type { DesignToken, TokenCategory, Component, ComponentManifest, ConventionsConfig } from '../types';

export function parseTokensCSS(filePath: string): DesignToken[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tokens: DesignToken[] = [];

  // Find all :root blocks (handles multiple :root blocks)
  const rootRegex = /:root\s*\{([^}]+)\}/gs;
  let match: RegExpExecArray | null;

  while ((match = rootRegex.exec(content)) !== null) {
    const block = match[1];
    for (const line of block.split('\n')) {
      // Skip comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith('/*') || trimmed.startsWith('//') || !trimmed) continue;

      const varMatch = trimmed.match(/^(--[\w-]+)\s*:\s*(.+?)\s*;/);
      if (varMatch) {
        const [, name, value] = varMatch;
        tokens.push({ name, value, category: categorize(name) });
      }
    }
  }

  return tokens;
}

function categorize(name: string): TokenCategory {
  if (name.startsWith('--color-')) return 'color';
  if (name.startsWith('--space-')) return 'spacing';
  if (name.startsWith('--font-')) return 'typography';
  if (name.startsWith('--radius-')) return 'radius';
  if (name.startsWith('--shadow-')) return 'shadow';
  if (name.startsWith('--z-')) return 'z-index';
  return 'other';
}

export function parseComponentsJSON(filePath: string): Component[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const manifest: ComponentManifest = JSON.parse(content);
  return manifest.components;
}

export function parseGuidelines(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function parseConventionsJSON(filePath: string): ConventionsConfig {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as ConventionsConfig;
}
