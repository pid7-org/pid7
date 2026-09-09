import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { validateEnv } from '../src/lib/gh-activity/graphql.ts';
import {
  collectOrgProjects,
  summarizeProjects,
  validateProjectsData,
} from '../src/lib/gh-projects/collector.ts';

async function main() {
  const { org } = validateEnv();

  const args = process.argv.slice(2);
  let limit = 5;
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    const parsed = parseInt(args[limitIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  const outputPath = path.join(process.cwd(), 'src', 'assets', 'gh-projects.json');

  console.log(`Starting GitHub projects collector for organization '${org}' (top ${limit})...`);
  const data = await collectOrgProjects(org, { limit });

  console.log('Validating output dataset...');
  validateProjectsData(data);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n' + summarizeProjects(org, 'src/assets/gh-projects.json', data));
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});
