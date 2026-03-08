#!/usr/bin/env node
// HANGOVER PostToolUse Hook
// Runs Token Validator automatically after Claude Code writes or edits a file.
// Configured in .claude/settings.local.json under hooks.PostToolUse.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCANNABLE_EXTS = new Set(['.css', '.scss', '.tsx', '.jsx', '.ts', '.js']);

let raw = '';
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw);

    // Only react to file-writing tools
    if (!['Write', 'Edit'].includes(data.tool_name)) return;

    const filePath = data.tool_input?.file_path;
    if (!filePath) return;

    const ext = path.extname(filePath).toLowerCase();
    if (!SCANNABLE_EXTS.has(ext)) return;

    // Load project config
    const configPath = path.join(process.cwd(), 'hangover.config.json');
    if (!fs.existsSync(configPath)) return;

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const tokensPath = config.tokens;
    if (!tokensPath || !fs.existsSync(tokensPath)) return;

    // Run validator on the written file only
    // Resolve CLI: prefer local dist build, fall back to ts-node in dev, then npx
    const localCli = path.join(process.cwd(), 'dist', 'cli.js');
    const localSrc = path.join(process.cwd(), 'src', 'token-validator', 'index.ts');
    let cmd;
    if (fs.existsSync(localCli)) {
      cmd = `node "${localCli}" validate --tokens "${tokensPath}" --scan "${filePath}"`;
    } else if (fs.existsSync(localSrc)) {
      cmd = `npx ts-node src/token-validator/index.ts --tokens "${tokensPath}" --scan "${filePath}"`;
    } else {
      cmd = `npx hangover validate --tokens "${tokensPath}" --scan "${filePath}"`;
    }
    const result = execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    if (result && result.trim()) {
      process.stdout.write('\n[HANGOVER] Token Validation Result:\n' + result + '\n');
    }
  } catch {
    // Never break Claude Code's workflow on hook failure
  }
});
