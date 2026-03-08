import { WizardAnswers } from './wizard';

export function hangoverConfigJson(answers: WizardAnswers): string {
  const obj: Record<string, unknown> = {
    tokens: answers.tokensPath,
    scan: answers.scanDirs,
    ignore: ['node_modules', 'dist', '.next', 'build', 'coverage'],
    threshold: answers.threshold,
  };
  if (answers.componentsPath) {
    obj.components = answers.componentsPath;
  }
  return JSON.stringify(obj, null, 2) + '\n';
}

export function tokensCss(): string {
  return `/* Design Tokens */

:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #64748b;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --color-warning: #d97706;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Typography */
  --font-family-base: system-ui, -apple-system, sans-serif;
  --font-family-mono: ui-monospace, monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
}
`;
}

export function componentsJson(): string {
  return JSON.stringify(
    {
      components: [
        {
          name: 'Button',
          description: 'Interactive button element',
          variants: ['primary', 'secondary', 'outline', 'ghost'],
          props: {
            label: 'string',
            variant: 'primary | secondary | outline | ghost',
            disabled: 'boolean',
            onClick: '() => void',
          },
          usage: '<Button variant="primary" label="Submit" />',
        },
        {
          name: 'Input',
          description: 'Text input field',
          variants: ['default', 'error'],
          props: {
            label: 'string',
            placeholder: 'string',
            value: 'string',
            error: 'string',
            onChange: '(value: string) => void',
          },
          usage: '<Input label="Email" placeholder="you@example.com" />',
        },
        {
          name: 'Card',
          description: 'Container with surface styling',
          variants: ['default', 'elevated'],
          props: {
            title: 'string',
            children: 'ReactNode',
          },
          usage: '<Card title="Settings"><p>Content here</p></Card>',
        },
      ],
    },
    null,
    2,
  ) + '\n';
}

export function postWriteJs(): string {
  return `#!/usr/bin/env node
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
      cmd = \`node "\${localCli}" validate --tokens "\${tokensPath}" --scan "\${filePath}"\`;
    } else if (fs.existsSync(localSrc)) {
      cmd = \`npx ts-node src/token-validator/index.ts --tokens "\${tokensPath}" --scan "\${filePath}"\`;
    } else {
      cmd = \`npx hangover validate --tokens "\${tokensPath}" --scan "\${filePath}"\`;
    }
    const result = execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    if (result && result.trim()) {
      process.stdout.write('\\n[HANGOVER] Token Validation Result:\\n' + result + '\\n');
    }
  } catch {
    // Never break Claude Code's workflow on hook failure
  }
});
`;
}

export function settingsLocalJson(): string {
  return JSON.stringify(
    {
      hooks: {
        PostToolUse: [
          {
            matcher: 'Write|Edit',
            hooks: [
              {
                type: 'command',
                command: 'node .claude/hooks/post-write.js',
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  ) + '\n';
}

export function hangoverYml(answers: WizardAnswers): string {
  const tokens = answers.tokensPath;
  const components = answers.componentsPath || '';
  const scan = answers.scanDirs[0] ?? 'src/';

  const compileComponents = components
    ? `            --components ${components} \\\n`
    : '';
  const dqsComponents = components
    ? `            --components ${components} \\\n`
    : '';

  return `name: HANGOVER Quality Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  dqs:
    name: Design Quality Score
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Compile Design System Spec
        run: |
          npx hangover compile \\
            --tokens ${tokens} \\
${compileComponents}            --output design-system.context.md

      - name: Run Token Validator
        id: validate
        run: |
          npx hangover validate \\
            --tokens ${tokens} \\
            --scan ${scan} 2>&1 | tee token-report.txt
        continue-on-error: true

      - name: Run DQS
        id: dqs
        run: |
          npx hangover dqs \\
            --tokens ${tokens} \\
${dqsComponents}            --scan ${scan} \\
            --output dqs-result.json \\
            2>&1 | tee dqs-report.txt
        continue-on-error: true

      - name: Post DQS comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');

            let threshold = ${answers.threshold};
            try {
              const config = JSON.parse(fs.readFileSync('hangover.config.json', 'utf-8'));
              threshold = config.threshold ?? ${answers.threshold};
            } catch { /* use default */ }

            let result, overall, grade, gradeEmoji;
            try {
              result = JSON.parse(fs.readFileSync('dqs-result.json', 'utf-8'));
              overall = result.overall;
              grade = overall >= threshold ? 'PASS' : overall >= threshold * 0.75 ? 'MARGINAL' : 'FAIL';
              gradeEmoji = overall >= threshold ? '\\u2705' : overall >= threshold * 0.75 ? '\\u26a0\\ufe0f' : '\\u274c';
            } catch {
              overall = 0;
              grade = 'ERROR';
              gradeEmoji = '\\ud83d\\udd34';
              result = { dimensions: [], availableDimensions: 0, totalDimensions: 0 };
            }

            const dimRows = (result.dimensions ?? []).map(d => {
              const score = d.score !== null ? \`\${d.score}/100\` : 'N/A';
              const icon = d.score === null ? '\\u2014' : d.score >= 80 ? '\\u2705' : d.score >= 60 ? '\\u26a0\\ufe0f' : '\\u274c';
              return \`| \${icon} | **\${d.name}** | \${score} | \${d.details} |\`;
            }).join('\\n');

            let tokenSummary = '';
            try {
              const lines = fs.readFileSync('token-report.txt', 'utf-8').trim().split('\\n');
              tokenSummary = lines.find(l => l.startsWith('Total:')) ?? '';
            } catch {}

            const body = [
              \`## \\ud83c\\udf7a HANGOVER DQS Report\`,
              \`\`,
              \`**Overall Score: \${overall}/100 \${gradeEmoji} \${grade}**\`,
              \`> Based on \${result.availableDimensions ?? 0} of \${result.totalDimensions ?? 0} dimensions\`,
              \`\`,
              \`| | Dimension | Score | Details |\`,
              \`|--|-----------|-------|---------|\`,
              dimRows,
              \`\`,
              tokenSummary ? \`**Token Validator:** \${tokenSummary}\` : '',
            ].filter(l => l !== undefined).join('\\n');

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const existing = comments.find(c =>
              c.user?.login === 'github-actions[bot]' && c.body?.includes('HANGOVER DQS Report')
            );

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }

      - name: Enforce DQS threshold
        run: |
          SCORE=\$(node -e "const r=require('./dqs-result.json'); console.log(r.overall)" 2>/dev/null || echo 0)
          THRESHOLD=\$(node -e "const c=require('./hangover.config.json'); console.log(c.threshold ?? ${answers.threshold})")
          echo "DQS Score: \$SCORE / threshold: \$THRESHOLD"
          if [ "\$SCORE" -lt "\$THRESHOLD" ]; then
            echo "DQS \$SCORE is below threshold \$THRESHOLD. Merge blocked."
            exit 1
          fi
          echo "DQS \$SCORE passes threshold."
`;
}

export const CLAUDE_MD_SNIPPET = `
## Design System Context

@design-system.context.md
`;
