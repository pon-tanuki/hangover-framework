import * as fs from 'fs';
import * as path from 'path';
import { parseComponentsJSON } from '../../spec-compiler/parsers';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);

// Raw HTML elements that each registered component is meant to replace
// Patterns match raw HTML that should be replaced by registered components.
// Case-sensitive (no `i` flag) so PascalCase component names like <Button>, <Input>, <Card>
// are never mistakenly counted as raw HTML equivalents.
const COMPONENT_RAW_EQUIVALENTS: Record<string, RegExp> = {
  Button: /<(?:button|div|span|a)\s[^>]*onClick/g,
  Input: /<input\b(?![^>]*type=['"](?:hidden|checkbox|radio|file|submit|reset|button|image|range|color)['"])/g,
  Card: /<div\s[^>]*(?:border|rounded|shadow)/g,
};

export interface ComponentReuseResult {
  score: number;
  registeredUsages: number;
  rawHtmlUsages: number;
  details: string;
}

export function collectComponentReuse(
  componentsPath: string,
  scanPath: string,
): ComponentReuseResult {
  const components = parseComponentsJSON(componentsPath);
  const componentNames = components.map(c => c.name);

  const files = collectTSXFiles(scanPath);
  let registeredUsages = 0;
  let rawHtmlUsages = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    // Count registered component usages: <Button, <Input, <Card ...
    for (const name of componentNames) {
      const matches = content.match(new RegExp(`<${name}[\\s/>]`, 'g'));
      registeredUsages += matches?.length ?? 0;
    }

    // Count raw HTML that should be replaced by registered components
    for (const [component, pattern] of Object.entries(COMPONENT_RAW_EQUIVALENTS)) {
      if (!componentNames.includes(component)) continue;
      const matches = content.match(pattern);
      rawHtmlUsages += matches?.length ?? 0;
    }
  }

  const total = registeredUsages + rawHtmlUsages;
  const reuseRate = total === 0 ? 1 : registeredUsages / total;
  const score = Math.round(reuseRate * 100);

  const details = total === 0
    ? 'No component opportunities detected'
    : `${registeredUsages} registered / ${total} total (${score}% reuse rate)`;

  return { score, registeredUsages, rawHtmlUsages, details };
}

function collectTSXFiles(dirOrFile: string): string[] {
  const stat = fs.statSync(dirOrFile);
  const TSX_EXTS = new Set(['.tsx', '.jsx']);

  if (stat.isFile()) {
    return TSX_EXTS.has(path.extname(dirOrFile)) ? [dirOrFile] : [];
  }

  const result: string[] = [];
  for (const entry of fs.readdirSync(dirOrFile, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dirOrFile, entry.name);
    if (entry.isDirectory()) result.push(...collectTSXFiles(full));
    else if (entry.isFile() && TSX_EXTS.has(path.extname(entry.name))) result.push(full);
  }
  return result;
}
