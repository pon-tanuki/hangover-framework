import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build', 'coverage']);

export interface AxeScoreResult {
  score: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  filesScanned: number;
  details: string;
}

// Impact → penalty points per violation
const PENALTIES: Record<string, number> = {
  critical: 15,
  serious: 10,
  moderate: 5,
  minor: 2,
};

export async function collectAxeScore(htmlPath: string): Promise<AxeScoreResult> {
  const files = collectHtmlFiles(htmlPath);

  if (files.length === 0) {
    return { score: 100, critical: 0, serious: 0, moderate: 0, minor: 0, filesScanned: 0, details: 'No HTML files found' };
  }

  // Load axe-core source once (injected into each jsdom instance via eval)
  const axeSource = loadAxeSource();

  let critical = 0, serious = 0, moderate = 0, minor = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf-8');
    const violations = await runAxeOnHtml(html, axeSource);

    for (const v of violations) {
      if (v.impact === 'critical') critical++;
      else if (v.impact === 'serious') serious++;
      else if (v.impact === 'moderate') moderate++;
      else minor++;
    }
  }

  const penalty = critical * PENALTIES.critical + serious * PENALTIES.serious +
    moderate * PENALTIES.moderate + minor * PENALTIES.minor;
  const score = Math.max(0, 100 - penalty);

  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} critical`);
  if (serious > 0) parts.push(`${serious} serious`);
  if (moderate > 0) parts.push(`${moderate} moderate`);
  if (minor > 0) parts.push(`${minor} minor`);

  const details = parts.length === 0
    ? `No violations in ${files.length} file(s)`
    : `${parts.join(', ')} in ${files.length} file(s)`;

  return { score, critical, serious, moderate, minor, filesScanned: files.length, details };
}

async function runAxeOnHtml(
  html: string,
  axeSource: string,
): Promise<Array<{ id: string; impact: string }>> {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    // Suppress jsdom console noise
    virtualConsole: new (require('jsdom').VirtualConsole)(),
  });

  // Inject axe-core into the jsdom window
  dom.window.eval(axeSource);

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dom.window as any).axe.run(
      dom.window.document,
      { reporter: 'v2' },
      (err: Error, results: { violations: Array<{ id: string; impact: string }> }) => {
        if (err) reject(err);
        else resolve(results.violations);
      },
    );
  });
}

function loadAxeSource(): string {
  // Try axe.min.js first, fall back to axe.js
  const axeDir = path.dirname(require.resolve('axe-core'));
  for (const candidate of ['axe.min.js', 'axe.js']) {
    const p = path.join(axeDir, candidate);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  // Last resort: use require.resolve directly
  const main = require.resolve('axe-core');
  return fs.readFileSync(main, 'utf-8');
}

function collectHtmlFiles(dirOrFile: string): string[] {
  const stat = fs.statSync(dirOrFile);
  if (stat.isFile()) return dirOrFile.endsWith('.html') ? [dirOrFile] : [];

  const result: string[] = [];
  for (const entry of fs.readdirSync(dirOrFile, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dirOrFile, entry.name);
    if (entry.isDirectory()) result.push(...collectHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}
