#!/usr/bin/env node
import { main as compileMain } from './spec-compiler/index';
import { main as validateMain } from './token-validator/index';
import { main as conventionsMain } from './convention-validator/index';
import { main as dqsMain } from './dqs/index';
import { main as trackMain } from './consistency-tracker/index';
import { main as initMain } from './init/index';

const HELP = `
HANGOVER Framework v0.1.0
Human Audit Normalization for Generated Output, Verification, Enforcement, and Review

バイブコーディングの翌朝、あなたを救う5フェーズの品質改善プロセス。

Commands:
  hangover init         プロジェクトへの初期セットアップ（対話式ウィザード）
  hangover compile      [Phase 0] デザインシステムをLLM向け仕様書に変換
  hangover validate     [Phase 2] トークン違反を即時検知（フロントエンド）
  hangover conventions  [Phase 2] 規約違反を即時検知（バックエンド）
  hangover dqs          [Phase 3] 品質を統合スコアで測定
  hangover track        [Phase 5] セッション間ドリフトを追跡

Usage:
  hangover init
  hangover compile      --tokens <tokens.css> [--components <c.json>] [--guidelines <g.md>] [--output <out.md>]
  hangover validate     --tokens <tokens.css> --scan <path> [--exit-on-error]
  hangover conventions  --conventions <conventions.json> --scan <path> [--exit-on-error]
  hangover dqs          --tokens <tokens.css> --scan <path> [--components <c.json>]
                        [--html <path>] [--url <url>] [--output <result.json>] [--threshold 70]
  hangover track        --dqs <result.json> [--label "description"] [--log hangover.log.json]
  hangover track        --report [--log hangover.log.json]

Examples:
  hangover init
  hangover compile      --tokens tokens.css --components components.json --output design-system.context.md
  hangover validate     --tokens tokens.css --scan src/ --exit-on-error
  hangover conventions  --conventions conventions.json --scan src/ --exit-on-error
  hangover dqs          --tokens tokens.css --scan src/ --html dist/ --threshold 70 --output dqs.json
  hangover track        --dqs dqs.json --label "Sprint 5 PR #42"
  hangover track        --report
`;

async function run(): Promise<void> {
  const subcommand = process.argv[2];

  // Shift argv so each subcommand's main() sees its own flags at argv[2]+
  process.argv.splice(2, 1);

  switch (subcommand) {
    case 'init':
      await initMain();
      break;
    case 'compile':
      compileMain();
      break;
    case 'validate':
      validateMain();
      break;
    case 'conventions':
      conventionsMain();
      break;
    case 'dqs':
      await dqsMain();
      break;
    case 'track':
      trackMain();
      break;
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${subcommand}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
