import * as fs from 'fs';
import { parseConventionsJSON } from '../spec-compiler/parsers';
import { scanFile, scanDirectory } from './scanner';
import type { ConventionViolation } from '../types';

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

function formatViolation(v: ConventionViolation): string {
  const badge = v.severity === 'error' ? '[ERR] ' : '[WARN]';
  return `  Line ${String(v.line).padStart(4)}: ${badge} [${v.rule.id}] ${v.message}`;
}

function main() {
  const args = parseArgs();
  const conventionsPath = args['conventions'];
  const scanPath = args['scan'];
  const exitOnError = args['exit-on-error'] === 'true';

  if (!conventionsPath || !scanPath) {
    console.error('Usage: hangover conventions --conventions <conventions.json> --scan <path> [--exit-on-error]');
    process.exit(1);
  }

  console.log('HANGOVER Convention Validator v0.1.0');
  console.log('====================================');
  console.log(`Conventions: ${conventionsPath}`);
  console.log(`Scan:        ${scanPath}\n`);

  const config = parseConventionsJSON(conventionsPath);

  const stat = fs.statSync(scanPath);
  const violations: ConventionViolation[] = stat.isDirectory()
    ? scanDirectory(scanPath, config)
    : scanFile(scanPath, config);

  if (violations.length === 0) {
    console.log('✓ No convention violations found.');
    return;
  }

  // Group by file
  const byFile = new Map<string, ConventionViolation[]>();
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

  if (exitOnError && errorCount > 0) {
    process.exit(1);
  }
}

export { main };
if (require.main === module) main();
