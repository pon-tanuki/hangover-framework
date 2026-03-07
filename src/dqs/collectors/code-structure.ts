import * as fs from 'fs';
import * as path from 'path';

const MAX_FILE_LINES = 200;
const MAX_FUNCTION_LINES = 50;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

export interface CodeStructureResult {
  score: number;
  totalFiles: number;
  largeFiles: Array<{ file: string; lines: number }>;
  largeFunctions: Array<{ file: string; lines: number; hint: string }>;
  details: string;
}

export function collectCodeStructure(scanPath: string): CodeStructureResult {
  const files = collectFiles(scanPath);
  const largeFiles: CodeStructureResult['largeFiles'] = [];
  const largeFunctions: CodeStructureResult['largeFunctions'] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > MAX_FILE_LINES) {
      largeFiles.push({ file, lines: lines.length });
    }

    // Detect oversized functions/components by finding blocks between
    // "function " / "=> {" and the matching closing "}"
    detectLargeFunctions(file, lines, largeFunctions);
  }

  // Scoring: start at 100, deduct per issue
  const penalty = largeFiles.length * 5 + largeFunctions.length * 3;
  const score = Math.max(0, 100 - penalty);

  const issues: string[] = [];
  if (largeFiles.length > 0) issues.push(`${largeFiles.length} file(s) over ${MAX_FILE_LINES} lines`);
  if (largeFunctions.length > 0) issues.push(`${largeFunctions.length} function(s) over ${MAX_FUNCTION_LINES} lines`);
  const details = issues.length > 0 ? issues.join(', ') : 'No structural issues';

  return { score, totalFiles: files.length, largeFiles, largeFunctions, details };
}

function detectLargeFunctions(
  file: string,
  lines: string[],
  results: CodeStructureResult['largeFunctions'],
): void {
  // Simple heuristic: track brace depth and measure spans between function headers
  const funcPattern = /(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s+)?\(.*?\)\s*=>)\s*\{/;
  let depth = 0;
  let funcStart = -1;
  let funcHint = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (funcStart === -1 && funcPattern.test(line)) {
      funcStart = i;
      funcHint = line.trim().slice(0, 60);
    }

    depth += (line.match(/\{/g) ?? []).length;
    depth -= (line.match(/\}/g) ?? []).length;
    depth = Math.max(0, depth);

    if (funcStart !== -1 && depth === 0) {
      const spanLines = i - funcStart + 1;
      if (spanLines > MAX_FUNCTION_LINES) {
        results.push({ file, lines: spanLines, hint: funcHint });
      }
      funcStart = -1;
      funcHint = '';
    }
  }
}

function collectFiles(dirOrFile: string): string[] {
  const stat = fs.statSync(dirOrFile);
  if (stat.isFile()) {
    return SCAN_EXTS.has(path.extname(dirOrFile)) ? [dirOrFile] : [];
  }

  const result: string[] = [];
  for (const entry of fs.readdirSync(dirOrFile, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dirOrFile, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(full));
    else if (entry.isFile() && SCAN_EXTS.has(path.extname(entry.name))) result.push(full);
  }
  return result;
}
