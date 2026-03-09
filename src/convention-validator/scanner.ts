import * as fs from 'fs';
import * as path from 'path';
import type { ConventionsConfig, ConventionViolation, ConventionRule } from '../types';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);
const BACKEND_EXTS = new Set(['.ts', '.js', '.py', '.go', '.java']);

// ----------------------------------------------------------------
// Built-in rules
// ----------------------------------------------------------------

const RULE_API_NAMING_KEBAB: ConventionRule = {
  id: 'api-naming-kebab',
  category: 'api-naming',
  description: 'API route paths should use kebab-case',
  severity: 'error',
};

const RULE_RESPONSE_ENVELOPE: ConventionRule = {
  id: 'response-envelope',
  category: 'response-structure',
  description: 'API responses should use a consistent envelope structure',
  severity: 'warning',
};

const RULE_ERROR_HANDLING: ConventionRule = {
  id: 'error-handling-missing',
  category: 'error-handling',
  description: 'Route handlers should have error handling (try-catch or error middleware)',
  severity: 'warning',
};

const RULE_HARDCODED_SECRET: ConventionRule = {
  id: 'hardcoded-secret',
  category: 'security',
  description: 'Secrets should not be hardcoded in source files',
  severity: 'error',
};

const RULE_SQL_INJECTION: ConventionRule = {
  id: 'sql-injection-risk',
  category: 'security',
  description: 'SQL queries should use parameterized statements, not string interpolation',
  severity: 'error',
};

// ----------------------------------------------------------------
// Route detection patterns (framework-agnostic)
// ----------------------------------------------------------------

// Matches: app.get('/api/v1/user_list', ...), router.post("/api/getUsers", ...)
const ROUTE_PATTERN = /\.(get|post|put|patch|delete)\s*\(\s*['"`](\/[^'"`]+)['"`]/g;

// Matches: @app.get("/api/..."), @router.post("/api/...")
const PYTHON_ROUTE_PATTERN = /@(?:app|router)\.\w+\(\s*['"](\/?[^'"]+)['"]/g;

// ----------------------------------------------------------------
// Scanning
// ----------------------------------------------------------------

export function scanFile(filePath: string, config: ConventionsConfig): ConventionViolation[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const violations: ConventionViolation[] = [];
  const lines = content.split('\n');

  // API naming checks
  if (config.api?.naming === 'kebab-case') {
    violations.push(...checkApiNaming(filePath, content, lines));
  }

  // Response envelope checks
  if (config.api?.responseEnvelope) {
    violations.push(...checkResponseEnvelope(filePath, lines, config.api.responseEnvelope));
  }

  // Error handling checks
  if (config.errorHandling?.requireTryCatch) {
    violations.push(...checkErrorHandling(filePath, content, lines));
  }

  // Security checks
  violations.push(...checkHardcodedSecrets(filePath, lines));
  violations.push(...checkSqlInjection(filePath, lines));

  // Custom forbidden patterns from config
  if (config.security?.forbiddenPatterns) {
    violations.push(...checkForbiddenPatterns(filePath, lines, config.security.forbiddenPatterns));
  }

  return violations;
}

export function scanDirectory(dirPath: string, config: ConventionsConfig): ConventionViolation[] {
  const violations: ConventionViolation[] = [];
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
      violations.push(...scanDirectory(fullPath, config));
    } else if (entry.isFile() && BACKEND_EXTS.has(path.extname(entry.name).toLowerCase())) {
      violations.push(...scanFile(fullPath, config));
    }
  }
  return violations;
}

// ----------------------------------------------------------------
// Check: API naming (kebab-case)
// ----------------------------------------------------------------

function checkApiNaming(filePath: string, content: string, lines: string[]): ConventionViolation[] {
  const violations: ConventionViolation[] = [];

  const patterns = [ROUTE_PATTERN, PYTHON_ROUTE_PATTERN];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const routePath = match[match.length === 3 ? 2 : 1];
      // Check each path segment (skip version segments like v1, v2)
      const segments = routePath.split('/').filter(s => s && !/^v\d+$/.test(s) && !s.startsWith(':') && !s.startsWith('{'));
      for (const segment of segments) {
        if (segment !== segment.toLowerCase() || /[_A-Z]/.test(segment)) {
          const lineNum = getLineNumber(content, match.index);
          violations.push({
            file: filePath,
            line: lineNum,
            rule: RULE_API_NAMING_KEBAB,
            message: `Route segment "${segment}" is not kebab-case → "${toKebab(segment)}"`,
            context: lines[lineNum - 1]?.trim() ?? '',
            severity: 'error',
          });
        }
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Check: Response envelope
// ----------------------------------------------------------------

function checkResponseEnvelope(
  filePath: string,
  lines: string[],
  envelope: { success: string[]; error: string[] },
): ConventionViolation[] {
  const violations: ConventionViolation[] = [];

  // Detect res.json({ ... }) or return { ... } patterns with non-standard keys
  const responsePattern = /(?:res\.json|res\.send|return\s+Response\.json|jsonify)\s*\(\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!responsePattern.test(line)) continue;

    // Look ahead a few lines to capture the response object keys
    const block = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
    const keys = [...block.matchAll(/(\w+)\s*:/g)].map(m => m[1]);

    // If we found keys that look like a response, check if they match the envelope
    if (keys.length === 0) continue;

    const allExpected = [...envelope.success, ...envelope.error];
    const hasEnvelopeKey = keys.some(k => allExpected.includes(k));
    const hasNonEnvelopeKey = keys.some(k =>
      !allExpected.includes(k) && !['status', 'statusCode', 'ok'].includes(k),
    );

    // Only flag if the response has no envelope keys (completely non-standard)
    if (!hasEnvelopeKey && hasNonEnvelopeKey) {
      violations.push({
        file: filePath,
        line: i + 1,
        rule: RULE_RESPONSE_ENVELOPE,
        message: `Response does not use standard envelope keys (expected: ${envelope.success.join(', ')})`,
        context: lines[i].trim(),
        severity: 'warning',
      });
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Check: Error handling in route handlers
// ----------------------------------------------------------------

function checkErrorHandling(filePath: string, content: string, lines: string[]): ConventionViolation[] {
  const violations: ConventionViolation[] = [];

  // Find route handler definitions
  const handlerPattern = /\.(get|post|put|patch|delete)\s*\(\s*['"`][^'"`]+['"`]\s*,\s*(?:async\s+)?(?:function\s*)?\(/g;
  let match: RegExpExecArray | null;

  while ((match = handlerPattern.exec(content)) !== null) {
    const lineNum = getLineNumber(content, match.index);

    // Look ahead ~30 lines for try-catch or error middleware pattern
    const block = lines.slice(lineNum - 1, Math.min(lineNum + 30, lines.length)).join('\n');
    const hasTryCatch = /\btry\s*\{/.test(block);
    const hasErrorMiddleware = /next\s*\(\s*\w+\s*\)/.test(block); // next(err) pattern
    const hasCatchWrapper = /catchAsync|asyncHandler|tryCatch/.test(block);

    if (!hasTryCatch && !hasErrorMiddleware && !hasCatchWrapper) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: RULE_ERROR_HANDLING,
        message: `Route handler missing error handling (try-catch, next(err), or asyncHandler wrapper)`,
        context: lines[lineNum - 1]?.trim() ?? '',
        severity: 'warning',
      });
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Check: Hardcoded secrets
// ----------------------------------------------------------------

const SECRET_PATTERNS = [
  /(?:password|secret|api_?key|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  /(?:AWS_SECRET|PRIVATE_KEY|DATABASE_URL)\s*[:=]\s*['"][^'"]+['"]/i,
];

function checkHardcodedSecrets(filePath: string, lines: string[]): ConventionViolation[] {
  const violations: ConventionViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments and .env references
    if (/^\s*(?:\/\/|#|\*)/.test(line)) continue;
    if (/process\.env|os\.environ|os\.Getenv/.test(line)) continue;

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          rule: RULE_HARDCODED_SECRET,
          message: 'Possible hardcoded secret detected. Use environment variables instead.',
          context: line.trim().slice(0, 100),
          severity: 'error',
        });
        break;
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Check: SQL injection risk
// ----------------------------------------------------------------

const SQL_INJECTION_PATTERNS = [
  /`[^`]*(?:SELECT|INSERT|UPDATE|DELETE)\b[^`]*\$\{/i,          // template literal with interpolation
  /['"].*(?:SELECT|INSERT|UPDATE|DELETE)\b.*['"]\s*\+/i,         // string concat
  /f['"].*(?:SELECT|INSERT|UPDATE|DELETE)\b.*\{/i,               // Python f-string
  /(?:SELECT|INSERT|UPDATE|DELETE)\b.*%s.*%\s*\(/i,              // Python % formatting
];

function checkSqlInjection(filePath: string, lines: string[]): ConventionViolation[] {
  const violations: ConventionViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(?:\/\/|#|\*)/.test(line)) continue;

    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          rule: RULE_SQL_INJECTION,
          message: 'Possible SQL injection: use parameterized queries instead of string interpolation',
          context: line.trim().slice(0, 100),
          severity: 'error',
        });
        break;
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Check: Custom forbidden patterns from config
// ----------------------------------------------------------------

function checkForbiddenPatterns(
  filePath: string,
  lines: string[],
  patterns: string[],
): ConventionViolation[] {
  const violations: ConventionViolation[] = [];
  const compiled = patterns.map(p => new RegExp(p));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(?:\/\/|#|\*)/.test(line)) continue;

    for (const pattern of compiled) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          rule: {
            id: 'custom-forbidden',
            category: 'security',
            description: `Matches forbidden pattern: ${pattern.source}`,
            severity: 'error',
          },
          message: `Matches forbidden pattern: ${pattern.source}`,
          context: line.trim().slice(0, 100),
          severity: 'error',
        });
        break;
      }
    }
  }

  return violations;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function getLineNumber(content: string, charIndex: number): number {
  return content.slice(0, charIndex).split('\n').length;
}

function toKebab(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}
