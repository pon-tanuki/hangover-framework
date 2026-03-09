import * as readline from 'readline';

export interface WizardAnswers {
  tokensPath: string;
  componentsPath: string;
  scanDirs: string[];
  threshold: number;
  setupHook: boolean;
  setupGitHubActions: boolean;
  setupClaudeMd: boolean;
}

export function createRl(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function askWithDefault(
  rl: readline.Interface,
  prompt: string,
  defaultValue: string,
): Promise<string> {
  const hint = defaultValue ? ` (default: ${defaultValue})` : '';
  const answer = await ask(rl, `${prompt}${hint}\n> `);
  return answer.trim() || defaultValue;
}

async function askYesNo(
  rl: readline.Interface,
  prompt: string,
  defaultYes = true,
): Promise<boolean> {
  const hint = defaultYes ? '(Y/n)' : '(y/N)';
  const answer = await ask(rl, `${prompt} ${hint}\n> `);
  const trimmed = answer.trim().toLowerCase();
  if (!trimmed) return defaultYes;
  return trimmed === 'y' || trimmed === 'yes';
}

export async function confirmOverwrite(rl: readline.Interface, filePath: string): Promise<boolean> {
  const answer = await ask(rl, `  ${filePath} already exists. Overwrite? (y/N)\n> `);
  return answer.trim().toLowerCase() === 'y';
}

export async function runWizard(
  rl: readline.Interface,
  detectedTokens: string | undefined,
  detectedComponents: string | undefined,
  detectedScanDirs: string[],
): Promise<WizardAnswers> {
  console.log('\n🍺 HANGOVER Setup Wizard\n');

  // tokens path
  let tokensPrompt = 'Where are your design tokens? (tokens.css path)';
  if (detectedTokens) {
    tokensPrompt += `\n  Detected: ${detectedTokens} [Enter to confirm, or type new path]`;
  }
  const tokensPath = await askWithDefault(rl, tokensPrompt, detectedTokens ?? 'tokens.css');

  // components path
  let componentsPrompt = 'Where are your component definitions? (components.json path, skip with Enter)';
  if (detectedComponents) {
    componentsPrompt += `\n  Detected: ${detectedComponents} [Enter to confirm, or type new path]`;
  }
  const componentsRaw = await ask(rl, `${componentsPrompt}\n> `);
  const componentsPath = componentsRaw.trim() || detectedComponents || '';

  // scan dirs
  const defaultScan = detectedScanDirs.length > 0
    ? detectedScanDirs.join(', ')
    : 'src/';
  const scanRaw = await askWithDefault(
    rl,
    'What directories to scan? (comma-separated)',
    defaultScan,
  );
  const scanDirs = scanRaw.split(',').map(s => s.trim()).filter(Boolean);

  // threshold
  const thresholdRaw = await askWithDefault(rl, 'DQS threshold?', '80');
  const threshold = parseInt(thresholdRaw, 10) || 80;

  // Claude Code hook
  const setupHook = await askYesNo(
    rl,
    'Set up Claude Code hook for real-time validation?',
  );

  // GitHub Actions
  const setupGitHubActions = await askYesNo(
    rl,
    'Set up GitHub Actions quality gate workflow?',
  );

  // CLAUDE.md
  const setupClaudeMd = await askYesNo(
    rl,
    'Add design-system.context.md reference to CLAUDE.md?',
  );

  return {
    tokensPath,
    componentsPath,
    scanDirs,
    threshold,
    setupHook,
    setupGitHubActions,
    setupClaudeMd,
  };
}
