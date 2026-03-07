import * as fs from 'fs';
import { parseTokensCSS } from '../spec-compiler/parsers';
import { scanFile, scanDirectory } from './scanner';
import type { TokenViolation } from '../types';

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      result[key] = next && !next.startsWith('--') ? args[++i] : 'true';
    }
  }
  return result;
}

function formatViolation(v: TokenViolation): string {
  const badge = v.severity === 'error' ? '[ERR] ' : '[WARN]';
  const top = v.suggestions[0];
  const suggestion = top
    ? `         → var(${top.token}) = ${top.tokenValue}  (confidence: ${Math.round(top.confidence * 100)}%)`
    : `         → No close token found. Consider adding a new token.`;

  return `  Line ${String(v.line).padStart(4)}: ${badge} ${v.property}: ${v.rawValue}\n${suggestion}`;
}

function main() {
  const args = parseArgs();
  const tokensPath = args['tokens'];
  const scanPath = args['scan'];
  const exitOnError = args['exit-on-error'] === 'true';

  if (!tokensPath || !scanPath) {
    console.error('Usage: npm run validate -- --tokens <tokens.css> --scan <path> [--exit-on-error]');
    process.exit(1);
  }

  console.log('HANGOVER Token Validator v0.1.0');
  console.log('================================');
  console.log(`Tokens:  ${tokensPath}`);
  console.log(`Scan:    ${scanPath}\n`);

  const tokens = parseTokensCSS(tokensPath);
  console.log(`Loaded ${tokens.length} design tokens.\n`);

  const stat = fs.statSync(scanPath);
  const violations: TokenViolation[] = stat.isDirectory()
    ? scanDirectory(scanPath, tokens)
    : scanFile(scanPath, tokens);

  if (violations.length === 0) {
    console.log('✓ No violations found. Your hangover was mild.');
    return;
  }

  // Group violations by file
  const byFile = new Map<string, TokenViolation[]>();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  for (const [file, fileViolations] of byFile) {
    console.log(file);
    for (const v of fileViolations) {
      console.log(formatViolation(v));
    }
    console.log('');
  }

  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warnCount = violations.filter(v => v.severity === 'warning').length;
  const fileCount = byFile.size;

  console.log('━'.repeat(48));
  console.log(`Total: ${violations.length} violations  (${errorCount} errors, ${warnCount} warnings)  in ${fileCount} file(s)`);
  console.log('Your hangover score: ' + hangoverScore(errorCount, warnCount));

  if (exitOnError && errorCount > 0) {
    process.exit(1);
  }
}

function hangoverScore(errors: number, warnings: number): string {
  const total = errors * 2 + warnings;
  if (total === 0) return 'Sober ✓';
  if (total <= 3) return 'Mild headache';
  if (total <= 10) return 'Moderate. Drink water.';
  if (total <= 20) return 'Severe. Call someone.';
  return 'Critical. How did this ship?';
}

export { main };
if (require.main === module) main();
