import * as fs from 'fs';
import * as path from 'path';
import { detectTokens, detectComponents, detectScanDirs } from './detector';
import { createRl, runWizard, confirmOverwrite, WizardAnswers } from './wizard';
import {
  hangoverConfigJson,
  tokensCss,
  componentsJson,
  postWriteJs,
  settingsLocalJson,
  hangoverYml,
  CLAUDE_MD_SNIPPET,
} from './templates';

const CWD = process.cwd();

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function writeIfOk(
  rl: ReturnType<typeof createRl>,
  relPath: string,
  content: string,
  alwaysOverwrite = false,
): Promise<boolean> {
  const absPath = path.join(CWD, relPath);
  if (fs.existsSync(absPath) && !alwaysOverwrite) {
    const ok = await confirmOverwrite(rl, relPath);
    if (!ok) {
      console.log(`  skipped: ${relPath}`);
      return false;
    }
  }
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, content, 'utf-8');
  console.log(`  created: ${relPath}`);
  return true;
}

function mergeSettingsLocalJson(answers: WizardAnswers): void {
  const relPath = '.claude/settings.local.json';
  const absPath = path.join(CWD, relPath);

  ensureDir(path.dirname(absPath));

  if (!fs.existsSync(absPath)) {
    fs.writeFileSync(absPath, settingsLocalJson(), 'utf-8');
    console.log(`  created: ${relPath}`);
    return;
  }

  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  } catch {
    // treat as empty if malformed
  }

  const hooks = (existing.hooks ?? {}) as Record<string, unknown>;
  const postToolUse = (hooks.PostToolUse ?? []) as Array<{
    matcher: string;
    hooks: Array<{ type: string; command: string }>;
  }>;

  const hangoverCommand = 'node .claude/hooks/post-write.js';
  const alreadyPresent = postToolUse.some(entry =>
    entry.hooks?.some(h => h.command === hangoverCommand),
  );

  if (!alreadyPresent) {
    postToolUse.push({
      matcher: 'Write|Edit',
      hooks: [{ type: 'command', command: hangoverCommand }],
    });
    hooks.PostToolUse = postToolUse;
    existing.hooks = hooks;
    fs.writeFileSync(absPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    console.log(`  updated: ${relPath} (hook merged)`);
  } else {
    console.log(`  skipped: ${relPath} (hook already present)`);
  }
}

function appendClaudeMd(): void {
  const relPath = 'CLAUDE.md';
  const absPath = path.join(CWD, relPath);

  if (fs.existsSync(absPath)) {
    const existing = fs.readFileSync(absPath, 'utf-8');
    if (existing.includes('@design-system.context.md')) {
      console.log(`  skipped: ${relPath} (snippet already present)`);
      return;
    }
    fs.appendFileSync(absPath, CLAUDE_MD_SNIPPET, 'utf-8');
    console.log(`  updated: ${relPath} (snippet appended)`);
  } else {
    fs.writeFileSync(absPath, CLAUDE_MD_SNIPPET.trimStart(), 'utf-8');
    console.log(`  created: ${relPath}`);
  }
}

function maybeCreateTokensFile(tokensPath: string): void {
  const absPath = path.join(CWD, tokensPath);
  if (!fs.existsSync(absPath)) {
    ensureDir(path.dirname(absPath));
    fs.writeFileSync(absPath, tokensCss(), 'utf-8');
    console.log(`  created: ${tokensPath} (minimal template)`);
  }
}

function maybeCreateComponentsFile(componentsPath: string): void {
  if (!componentsPath) return;
  const absPath = path.join(CWD, componentsPath);
  if (!fs.existsSync(absPath)) {
    ensureDir(path.dirname(absPath));
    fs.writeFileSync(absPath, componentsJson(), 'utf-8');
    console.log(`  created: ${componentsPath} (minimal template)`);
  }
}

export async function main(): Promise<void> {
  const detectedTokens = detectTokens(CWD);
  const detectedComponents = detectComponents(CWD);
  const detectedScanDirs = detectScanDirs(CWD);

  const rl = createRl();

  try {
    const answers: WizardAnswers = await runWizard(
      rl,
      detectedTokens,
      detectedComponents,
      detectedScanDirs,
    );

    console.log('');

    // 1. hangover.config.json (with overwrite prompt)
    await writeIfOk(rl, 'hangover.config.json', hangoverConfigJson(answers));

    // 2. tokens.css (create only if missing)
    maybeCreateTokensFile(answers.tokensPath);

    // 3. components.json (create only if missing)
    maybeCreateComponentsFile(answers.componentsPath);

    // 4. Claude Code hook
    if (answers.setupHook) {
      // post-write.js: always overwrite to keep latest version
      await writeIfOk(rl, '.claude/hooks/post-write.js', postWriteJs(), true);
      // settings.local.json: merge
      mergeSettingsLocalJson(answers);
    }

    // 5. GitHub Actions
    if (answers.setupGitHubActions) {
      await writeIfOk(rl, '.github/workflows/hangover.yml', hangoverYml(answers));
    }

    // 6. CLAUDE.md
    if (answers.setupClaudeMd) {
      appendClaudeMd();
    }
  } finally {
    rl.close();
  }

  console.log('');
  console.log('Setup complete.');
  console.log('');
  console.log(`Next step: hangover compile --tokens ${detectTokens(CWD) ?? 'tokens.css'} --output design-system.context.md`);
}
