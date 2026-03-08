import * as fs from 'fs';
import { collectTokenScore } from './collectors/token-score';
import { collectCodeStructure } from './collectors/code-structure';
import { collectComponentReuse } from './collectors/component-reuse';
import { collectAxeScore } from './collectors/axe-score';
import { collectLighthouseScore } from './collectors/lighthouse-score';
import { computeDQS } from './scorer';
import type { DQSResult } from './scorer';

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

function bar(score: number, width = 30): string {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function scoreIcon(score: number | null): string {
  if (score === null) return '-';
  if (score >= 80) return '✓';
  if (score >= 60) return '~';
  return '✗';
}

function printDQS(result: DQSResult): void {
  const overall = result.overall;
  const grade = overall >= 80 ? 'PASS' : overall >= 60 ? 'MARGINAL' : 'FAIL';

  console.log('\nHANGOVER Design Quality Score');
  console.log('═'.repeat(50));
  console.log(`  DQS: ${overall}/100  [${grade}]`);
  console.log(`  ${bar(overall)}`);
  console.log(`  Based on ${result.availableDimensions} of ${result.totalDimensions} dimensions\n`);

  console.log('Breakdown:');
  console.log('─'.repeat(50));

  for (const dim of result.dimensions) {
    if (dim.score !== null) {
      const scoreStr = String(dim.score).padStart(3);
      console.log(`  ${scoreIcon(dim.score)} ${dim.name.padEnd(22)} ${scoreStr}/100  ${dim.details}`);
    } else {
      console.log(`  - ${dim.name.padEnd(22)}  N/A   ${dim.runHint ?? ''}`);
    }
  }

  console.log('─'.repeat(50));

  const naItems = result.dimensions.filter(d => d.score === null);
  if (naItems.length > 0) {
    console.log('\nTo improve DQS coverage:');
    for (const dim of naItems) {
      if (dim.runHint) console.log(`  ${dim.name}: ${dim.runHint}`);
    }
  }
  console.log('');
}

async function main(): Promise<void> {
  const args = parseArgs();

  // Load from hangover.config.json as defaults
  const configPath = args['config'] ?? 'hangover.config.json';
  let config: Record<string, string> = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  const tokensPath = args['tokens'] ?? config['tokens'];
  const componentsPath = args['components'] ?? config['components'];
  const rawScan = args['scan'] ?? config['scan'] ?? '.';
  const scanPath = Array.isArray(rawScan) ? (rawScan as unknown as string[])[0] : String(rawScan);
  const htmlPath = args['html'];        // for axe
  const url = args['url'];             // for lighthouse
  const outputPath = args['output'];
  const threshold = Number(args['threshold'] ?? config['threshold'] ?? 80);

  if (!tokensPath) {
    console.error('Error: --tokens <path> required (or set "tokens" in hangover.config.json)');
    process.exit(1);
  }

  console.log('HANGOVER DQS v0.1.0');
  console.log('Collecting scores...\n');

  // --- Static collectors (synchronous) ---
  const token = collectTokenScore(tokensPath, scanPath);
  process.stdout.write(`  ✓ Token Compliance: ${token.score}/100\n`);

  const structure = collectCodeStructure(scanPath);
  process.stdout.write(`  ✓ Code Structure:   ${structure.score}/100\n`);

  const reuse = componentsPath
    ? collectComponentReuse(componentsPath, scanPath)
    : { score: 0, registeredUsages: 0, rawHtmlUsages: 0, details: 'No components.json provided' };
  if (componentsPath) process.stdout.write(`  ✓ Component Reuse:  ${reuse.score}/100\n`);

  // --- Axe (async, optional) ---
  let axeResult: { score: number; details: string } | null = null;
  if (htmlPath) {
    try {
      process.stdout.write('  ⋯ Accessibility (axe)...\r');
      const axe = await collectAxeScore(htmlPath);
      axeResult = { score: axe.score, details: axe.details };
      process.stdout.write(`  ✓ Accessibility:    ${axe.score}/100  ${axe.details}\n`);
    } catch (err) {
      process.stdout.write(`  ✗ Accessibility:    failed (${(err as Error).message.slice(0, 60)})\n`);
    }
  }

  // --- Lighthouse (optional) ---
  let lighthouseResult: { score: number; details: string } | null = null;
  if (url) {
    try {
      process.stdout.write('  ⋯ Performance (lighthouse)...\r');
      const lh = collectLighthouseScore(url);
      lighthouseResult = { score: lh.score, details: lh.details };
      process.stdout.write(`  ✓ Performance:      ${lh.score}/100  ${lh.details}\n`);
    } catch (err) {
      process.stdout.write(`  ✗ Performance:      failed (${(err as Error).message.slice(0, 60)})\n`);
    }
  }

  const result = computeDQS(token, structure, reuse, axeResult, lighthouseResult);
  printDQS(result);

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`JSON output written to ${outputPath}`);
  }

  if (result.overall < threshold) {
    console.error(`DQS ${result.overall} is below threshold ${threshold}. Failing.`);
    process.exit(1);
  }
}

export { main };
if (require.main === module) {
  main().catch(err => {
    console.error('DQS error:', err);
    process.exit(1);
  });
}
