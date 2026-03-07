import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface LighthouseScoreResult {
  score: number;
  fcp: number;   // First Contentful Paint (ms)
  lcp: number;   // Largest Contentful Paint (ms)
  tbt: number;   // Total Blocking Time (ms)
  cls: number;   // Cumulative Layout Shift
  details: string;
}

export function collectLighthouseScore(url: string): LighthouseScoreResult {
  const tmpFile = path.join(os.tmpdir(), `hangover-lighthouse-${Date.now()}.json`);

  try {
    execSync(
      [
        'npx lighthouse',
        url,
        `--output=json`,
        `--output-path=${tmpFile}`,
        '--quiet',
        '--chrome-flags="--headless --no-sandbox --disable-gpu"',
        '--only-categories=performance',
      ].join(' '),
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60_000 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Lighthouse failed: ${msg.slice(0, 200)}`);
  }

  const report = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
  fs.unlinkSync(tmpFile);

  const score = Math.round((report.categories?.performance?.score ?? 0) * 100);
  const audits = report.audits ?? {};

  const fcp = Math.round(audits['first-contentful-paint']?.numericValue ?? 0);
  const lcp = Math.round(audits['largest-contentful-paint']?.numericValue ?? 0);
  const tbt = Math.round(audits['total-blocking-time']?.numericValue ?? 0);
  const cls = Number((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3));

  const details = `FCP ${fcp}ms / LCP ${lcp}ms / TBT ${tbt}ms / CLS ${cls}`;

  return { score, fcp, lcp, tbt, cls, details };
}
