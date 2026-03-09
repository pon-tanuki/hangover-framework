import { scanDirectory, scanFile } from '../../convention-validator/scanner';
import { parseConventionsJSON } from '../../spec-compiler/parsers';
import * as fs from 'fs';
import type { ConventionCategory } from '../../types';

export interface ConventionScoreResult {
  apiConsistency: { score: number; details: string };
  security: { score: number; details: string };
  errorHandling: { score: number; details: string };
}

const ERROR_PENALTY = 5;
const WARNING_PENALTY = 2;

export function collectConventionScores(
  conventionsPath: string,
  scanPath: string,
): ConventionScoreResult {
  const config = parseConventionsJSON(conventionsPath);

  const stat = fs.statSync(scanPath);
  const violations = stat.isDirectory()
    ? scanDirectory(scanPath, config)
    : scanFile(scanPath, config);

  // Group by category
  const byCat = new Map<ConventionCategory, { errors: number; warnings: number }>();
  for (const v of violations) {
    const cat = v.rule.category;
    if (!byCat.has(cat)) byCat.set(cat, { errors: 0, warnings: 0 });
    const counts = byCat.get(cat)!;
    if (v.severity === 'error') counts.errors++;
    else counts.warnings++;
  }

  function scoreFor(categories: ConventionCategory[]): { score: number; details: string } {
    let errors = 0, warnings = 0;
    for (const cat of categories) {
      const counts = byCat.get(cat);
      if (counts) {
        errors += counts.errors;
        warnings += counts.warnings;
      }
    }
    const penalty = errors * ERROR_PENALTY + warnings * WARNING_PENALTY;
    const score = Math.max(0, 100 - penalty);
    const total = errors + warnings;
    const details = total === 0
      ? 'No violations'
      : `${errors} errors, ${warnings} warnings`;
    return { score, details };
  }

  return {
    apiConsistency: scoreFor(['api-naming', 'response-structure']),
    security: scoreFor(['security']),
    errorHandling: scoreFor(['error-handling']),
  };
}
