import * as fs from 'fs';
import * as path from 'path';
import { parseTokensCSS, parseComponentsJSON, parseGuidelines } from './parsers';
import { compileToContextMd } from './compiler';
import type { DesignSystemSpec } from '../types';

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

function main() {
  const args = parseArgs();
  const tokensPath = args['tokens'];
  const componentsPath = args['components'];
  const guidelinesPath = args['guidelines'];
  const outputPath = args['output'] ?? 'design-system.context.md';

  if (!tokensPath) {
    console.error('Error: --tokens <path> is required');
    console.error('Usage: npm run compile -- --tokens <tokens.css> [--components <components.json>] [--guidelines <guidelines.md>] [--output <output.md>]');
    process.exit(1);
  }

  console.log('HANGOVER Spec Compiler v0.1.0');
  console.log('================================\n');

  const sources: DesignSystemSpec['sources'] = {};

  const tokens = parseTokensCSS(tokensPath);
  sources.tokens = tokensPath;
  console.log(`✓ Tokens: ${tokens.length} tokens parsed from ${tokensPath}`);

  const components = componentsPath ? parseComponentsJSON(componentsPath) : [];
  if (componentsPath) {
    sources.components = componentsPath;
    console.log(`✓ Components: ${components.length} components parsed from ${componentsPath}`);
  }

  const guidelines = guidelinesPath ? parseGuidelines(guidelinesPath) : '';
  if (guidelinesPath) {
    sources.guidelines = guidelinesPath;
    console.log(`✓ Guidelines: parsed from ${guidelinesPath}`);
  }

  const spec: DesignSystemSpec = {
    tokens,
    components,
    guidelines,
    generatedAt: new Date().toISOString(),
    sources,
  };

  const output = compileToContextMd(spec);

  const outputDir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, output, 'utf-8');

  const tokenCount = tokens.length;
  const componentCount = components.length;
  const charCount = output.length;
  const tokenEstimate = Math.round(charCount / 4);

  console.log(`\n✓ Output: ${outputPath}`);
  console.log(`  ${tokenCount} tokens, ${componentCount} components → ${charCount} chars (~${tokenEstimate} tokens)`);
  console.log('\nNext step: reference design-system.context.md from CLAUDE.md');
}

export { main };
if (require.main === module) main();
