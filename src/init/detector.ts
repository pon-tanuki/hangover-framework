import * as fs from 'fs';
import * as path from 'path';

const TOKEN_CANDIDATES = [
  'src/styles/tokens.css',
  'src/styles/variables.css',
  'src/tokens.css',
  'styles/tokens.css',
  'tokens.css',
];

const COMPONENT_CANDIDATES = [
  'src/components/manifest.json',
  'src/components/index.json',
  'components.json',
];

const SCAN_CANDIDATES = ['src/', 'components/', 'pages/', 'app/'];

export function detectTokens(cwd: string): string | undefined {
  for (const candidate of TOKEN_CANDIDATES) {
    if (fs.existsSync(path.join(cwd, candidate))) {
      return candidate;
    }
  }
  return undefined;
}

export function detectComponents(cwd: string): string | undefined {
  for (const candidate of COMPONENT_CANDIDATES) {
    if (fs.existsSync(path.join(cwd, candidate))) {
      return candidate;
    }
  }
  return undefined;
}

export function detectScanDirs(cwd: string): string[] {
  return SCAN_CANDIDATES.filter(dir => fs.existsSync(path.join(cwd, dir)));
}
