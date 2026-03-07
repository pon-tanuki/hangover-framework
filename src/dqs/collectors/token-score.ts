import * as fs from 'fs';
import * as path from 'path';
import { parseTokensCSS } from '../../spec-compiler/parsers';
import { scanDirectory, scanFile } from '../../token-validator/scanner';

export interface TokenScoreResult {
  score: number;
  errors: number;
  warnings: number;
  filesScanned: number;
  details: string;
}

const ERROR_PENALTY = 5;
const WARNING_PENALTY = 2;
const MAX_SCORE = 100;

export function collectTokenScore(tokensPath: string, scanPath: string): TokenScoreResult {
  const tokens = parseTokensCSS(tokensPath);

  const stat = fs.statSync(scanPath);
  const violations = stat.isDirectory()
    ? scanDirectory(scanPath, tokens)
    : scanFile(scanPath, tokens);

  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;
  const filesScanned = new Set(violations.map(v => v.file)).size;

  const penalty = errors * ERROR_PENALTY + warnings * WARNING_PENALTY;
  const score = Math.max(0, MAX_SCORE - penalty);

  const details = violations.length === 0
    ? 'No token violations'
    : `${errors} errors, ${warnings} warnings across ${filesScanned} file(s)`;

  return { score, errors, warnings, filesScanned, details };
}
