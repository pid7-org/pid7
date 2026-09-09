import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateEnv } from '../src/lib/gh-activity/graphql.ts';
import { collectOrgLanguages, summarizeLanguages, validateLanguageData } from '../src/lib/gh-languages/collector.ts';

async function main() {
  const { org } = validateEnv();

  const outputPath = path.join(process.cwd(), 'src', 'assets', 'gh-languages.json');

  console.log(`Starting GitHub languages collector for organization '${org}'...`);
  const data = await collectOrgLanguages(org);

  console.log('Validating output dataset...');
  validateLanguageData(data);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n' + summarizeLanguages(org, 'src/assets/gh-languages.json', data));
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});
