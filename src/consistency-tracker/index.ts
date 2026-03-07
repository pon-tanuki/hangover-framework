import * as fs from 'fs';
import type { DQSResult } from '../dqs/scorer';

const DRIFT_ALERT_THRESHOLD = 5; // alert when DQS drops by this many points
const DEFAULT_LOG = 'hangover.log.json';
const DEFAULT_SHOW = 10;

interface LogEntry {
  session: number;
  timestamp: string;
  overall: number;
  dimensions: Record<string, number | null>;
  label?: string;
}

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

function loadLog(logPath: string): LogEntry[] {
  if (!fs.existsSync(logPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLog(logPath: string, entries: LogEntry[]): void {
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), 'utf-8');
}

function recordSession(dqsResult: DQSResult, logPath: string, label?: string): LogEntry {
  const entries = loadLog(logPath);
  const session = entries.length + 1;

  const dimensions: Record<string, number | null> = {};
  for (const dim of dqsResult.dimensions) {
    dimensions[dim.name] = dim.score;
  }

  const entry: LogEntry = {
    session,
    timestamp: dqsResult.timestamp,
    overall: dqsResult.overall,
    dimensions,
    label,
  };

  entries.push(entry);
  saveLog(logPath, entries);
  return entry;
}

function sparkline(scores: number[]): string {
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  return scores
    .map(s => chars[Math.round(((s - min) / range) * (chars.length - 1))])
    .join('');
}

function trend(entries: LogEntry[]): string {
  if (entries.length < 2) return '→';
  const last = entries[entries.length - 1].overall;
  const prev = entries[entries.length - 2].overall;
  if (last > prev + 1) return '↑';
  if (last < prev - 1) return '↓';
  return '→';
}

function detectDrift(entries: LogEntry[]): string[] {
  const alerts: string[] = [];
  if (entries.length < 2) return alerts;

  const recent = entries[entries.length - 1];
  const baseline = entries[Math.max(0, entries.length - 6)]; // compare against up to 5 sessions ago

  const drop = baseline.overall - recent.overall;
  if (drop >= DRIFT_ALERT_THRESHOLD) {
    alerts.push(
      `Overall DQS dropped ${drop} points (${baseline.overall} → ${recent.overall}) over last ${entries.length - Math.max(0, entries.length - 6)} sessions`,
    );
  }

  // Per-dimension drift
  for (const [dimName, recentScore] of Object.entries(recent.dimensions)) {
    const baseScore = baseline.dimensions[dimName];
    if (recentScore === null || baseScore === null) continue;
    const dimDrop = baseScore - recentScore;
    if (dimDrop >= 10) {
      alerts.push(`  ${dimName}: −${dimDrop} points (${baseScore} → ${recentScore})`);
    }
  }

  return alerts;
}

function printHistory(entries: LogEntry[], showLast: number): void {
  const shown = entries.slice(-showLast);
  const scores = shown.map(e => e.overall);

  console.log('HANGOVER Consistency Tracker');
  console.log('═'.repeat(50));
  console.log(`  Sessions tracked: ${entries.length}`);
  console.log(`  Trend: ${sparkline(scores)}  ${trend(entries)}`);
  console.log('');

  console.log('Session history (last ' + showLast + '):');
  console.log('─'.repeat(50));
  console.log('  #    Date         DQS    Token  Struct  Reuse  Label');

  for (const e of shown) {
    const date = new Date(e.timestamp).toLocaleDateString('ja-JP');
    const dqs = String(e.overall).padStart(3);
    const tok = e.dimensions['Token Compliance'] !== null ? String(e.dimensions['Token Compliance']).padStart(5) : '  N/A';
    const str = e.dimensions['Code Structure'] !== null ? String(e.dimensions['Code Structure']).padStart(6) : '   N/A';
    const reus = e.dimensions['Component Reuse'] !== null ? String(e.dimensions['Component Reuse']).padStart(5) : '  N/A';
    const label = e.label ? `  [${e.label}]` : '';
    console.log(`  ${String(e.session).padStart(2)}  ${date}   ${dqs}   ${tok}  ${str}  ${reus}${label}`);
  }

  console.log('─'.repeat(50));
  console.log('');
}

function main(): void {
  const args = parseArgs();
  const logPath = args['log'] ?? DEFAULT_LOG;
  const dqsPath = args['dqs'];
  const label = args['label'];
  const showLast = Number(args['show'] ?? DEFAULT_SHOW);
  const reportOnly = args['report'] === 'true';

  if (!reportOnly) {
    if (!dqsPath) {
      console.error('Usage: hangover:track -- --dqs <dqs-result.json> [--label "Session label"] [--log hangover.log.json]');
      console.error('       hangover:track -- --report [--log hangover.log.json]');
      process.exit(1);
    }

    const dqsResult: DQSResult = JSON.parse(fs.readFileSync(dqsPath, 'utf-8'));
    const entry = recordSession(dqsResult, logPath, label);
    console.log(`Recorded session #${entry.session}: DQS ${entry.overall}/100\n`);
  }

  const entries = loadLog(logPath);
  if (entries.length === 0) {
    console.log('No sessions recorded yet. Run DQS first, then track.');
    return;
  }

  printHistory(entries, showLast);

  const alerts = detectDrift(entries);
  if (alerts.length > 0) {
    console.log('⚠ Drift Alert:');
    for (const a of alerts) console.log('  ' + a);
    console.log('');
  } else {
    console.log('✓ No significant drift detected.');
  }
}

export { main };
if (require.main === module) main();
