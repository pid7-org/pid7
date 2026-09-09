import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  aggregateActivity,
  mergeActivityData,
  summarizeActivity,
  validateActivityData,
} from '../src/lib/gh-activity/aggregator.ts';
import { collectAllActivity, getRepositories } from '../src/lib/gh-activity/collector.ts';
import { validateEnv } from '../src/lib/gh-activity/graphql.ts';
import type { ActivityDataOutput } from '../src/lib/gh-activity/types.ts';

async function main() {
  const { org } = validateEnv();

  const args = process.argv.slice(2);
  const isIncrementalRequested = args.includes('--incremental');
  const fullRequested = args.includes('--full');

  let daysWindow = 3;
  const daysIndex = args.indexOf('--days');
  if (daysIndex !== -1 && args[daysIndex + 1]) {
    const parsedDays = parseInt(args[daysIndex + 1], 10);
    if (!isNaN(parsedDays) && parsedDays > 0) {
      daysWindow = parsedDays;
    }
  }

  const outputPath = path.join(process.cwd(), 'src', 'assets', 'gh-activity.json');
  const fileExists = existsSync(outputPath);

  const isIncremental = isIncrementalRequested && !fullRequested && fileExists;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const jan1Str = `${currentYear}-01-01`;
  const todayStr = now.toISOString().slice(0, 10);

  console.log(`Starting GitHub activity collector for organization '${org}'...`);
  console.log(`Mode: ${isIncremental ? `Incremental (past ${daysWindow} days)` : 'Full historical backfill'}`);

  const repos = await getRepositories(org);
  console.log(`Discovered ${repos.length} repositories.`);

  let finalData: ActivityDataOutput;
  let reportStartDate: string;
  let reportEndDate: string;

  if (isIncremental) {
    const rawExisting = readFileSync(outputPath, 'utf-8');
    const existingData = JSON.parse(rawExisting) as ActivityDataOutput;

    const windowStartDate = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000);
    let windowStartDateStr = windowStartDate.toISOString().slice(0, 10);
    if (windowStartDateStr < jan1Str) {
      windowStartDateStr = jan1Str;
    }

    const sinceISO = `${windowStartDateStr}T00:00:00Z`;
    const untilISO = `${todayStr}T23:59:59Z`;

    console.log(`Collecting recent activity window: ${windowStartDateStr} → ${todayStr}...`);
    const events = await collectAllActivity(repos, sinceISO, untilISO);

    const newData = aggregateActivity(events, currentYear, windowStartDateStr, todayStr, repos.length);
    finalData = mergeActivityData(existingData, newData, windowStartDateStr, todayStr);

    const allDates = Object.keys(finalData.activity);
    reportStartDate = allDates[0] || jan1Str;
    reportEndDate = allDates[allDates.length - 1] || todayStr;
  } else {
    reportStartDate = jan1Str;
    reportEndDate = todayStr;

    const sinceISO = `${jan1Str}T00:00:00Z`;
    const untilISO = `${todayStr}T23:59:59Z`;

    console.log(`Collecting full year activity: ${jan1Str} → ${todayStr}...`);
    const events = await collectAllActivity(repos, sinceISO, untilISO);

    finalData = aggregateActivity(events, currentYear, jan1Str, todayStr, repos.length);
  }

  console.log('Validating output dataset...');
  validateActivityData(finalData);

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

  console.log('\n' + summarizeActivity(org, reportStartDate, reportEndDate, 'src/assets/gh-activity.json', finalData));
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});
