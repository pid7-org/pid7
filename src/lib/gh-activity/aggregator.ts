import type { ActivityDataOutput, ActivityEvent, DailyActivity } from './types.ts';

export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function createZeroBucket(): DailyActivity {
  return {
    commits: 0,
    pull_requests: 0,
    reviews: 0,
    issues: 0,
    discussions: 0,
    releases: 0,
    total: 0,
  };
}

export function aggregateActivity(
  events: ActivityEvent[],
  year: number,
  startDateStr: string,
  endDateStr: string,
  reposCount: number,
  generatedAtISO?: string
): ActivityDataOutput {
  const activity: Record<string, DailyActivity> = {};
  const dateList = generateDateRange(startDateStr, endDateStr);

  for (const d of dateList) {
    activity[d] = createZeroBucket();
  }

  const uniqueEvents = new Map<string, ActivityEvent>();
  for (const ev of events) {
    const key = `${ev.type}:${ev.id}`;
    if (!uniqueEvents.has(key)) {
      uniqueEvents.set(key, ev);
    }
  }

  for (const ev of uniqueEvents.values()) {
    if (activity[ev.date]) {
      activity[ev.date][ev.type]++;
      activity[ev.date].total++;
    }
  }

  return {
    year,
    generated_at: generatedAtISO || new Date().toISOString(),
    repos: reposCount,
    activity,
  };
}

export function mergeActivityData(
  existingData: ActivityDataOutput,
  newData: ActivityDataOutput,
  windowStartDateStr: string,
  endDateStr: string
): ActivityDataOutput {
  const mergedActivity: Record<string, DailyActivity> = { ...existingData.activity };
  const windowDates = generateDateRange(windowStartDateStr, endDateStr);

  for (const d of windowDates) {
    mergedActivity[d] = newData.activity[d] || createZeroBucket();
  }

  const sortedActivity: Record<string, DailyActivity> = {};
  const sortedDates = Object.keys(mergedActivity).sort();
  for (const d of sortedDates) {
    sortedActivity[d] = mergedActivity[d];
  }

  return {
    year: newData.year,
    generated_at: newData.generated_at,
    repos: newData.repos,
    activity: sortedActivity,
  };
}

export function validateActivityData(data: ActivityDataOutput): void {
  if (typeof data.year !== 'number' || data.year < 2000) {
    throw new Error(`Invalid year in output JSON: ${data.year}`);
  }
  if (!data.generated_at || isNaN(Date.parse(data.generated_at))) {
    throw new Error(`Invalid generated_at timestamp: ${data.generated_at}`);
  }
  if (typeof data.repos !== 'number' || data.repos < 0) {
    throw new Error(`Invalid repos count: ${data.repos}`);
  }
  if (!data.activity || typeof data.activity !== 'object') {
    throw new Error('Missing or invalid activity object');
  }

  const dates = Object.keys(data.activity);
  if (dates.length === 0) {
    throw new Error('Activity object contains 0 date buckets');
  }

  for (const date of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date key format in activity: ${date}`);
    }
    const bucket = data.activity[date];
    const expectedKeys: (keyof DailyActivity)[] = [
      'commits',
      'pull_requests',
      'reviews',
      'issues',
      'discussions',
      'releases',
      'total',
    ];
    for (const key of expectedKeys) {
      if (typeof bucket[key] !== 'number' || bucket[key] < 0) {
        throw new Error(`Invalid value for ${key} on date ${date}: ${bucket[key]}`);
      }
    }
    const calculatedTotal =
      bucket.commits +
      bucket.pull_requests +
      bucket.reviews +
      bucket.issues +
      bucket.discussions +
      bucket.releases;

    if (bucket.total !== calculatedTotal) {
      throw new Error(
        `Total mismatch on date ${date}: bucket.total (${bucket.total}) !== calculatedTotal (${calculatedTotal})`
      );
    }
  }
}

export function summarizeActivity(
  org: string,
  startDateStr: string,
  endDateStr: string,
  outputPath: string,
  data: ActivityDataOutput
): string {
  let commits = 0;
  let pull_requests = 0;
  let reviews = 0;
  let issues = 0;
  let discussions = 0;
  let releases = 0;
  let total = 0;

  for (const bucket of Object.values(data.activity)) {
    commits += bucket.commits;
    pull_requests += bucket.pull_requests;
    reviews += bucket.reviews;
    issues += bucket.issues;
    discussions += bucket.discussions;
    releases += bucket.releases;
    total += bucket.total;
  }

  const lines = [
    'GitHub Activity',
    '---------------',
    `Organization: ${org}`,
    `Repositories: ${data.repos}`,
    `Date range: ${startDateStr} → ${endDateStr}`,
    '',
    `Commits:       ${commits.toString().padStart(6)}`,
    `Pull requests: ${pull_requests.toString().padStart(6)}`,
    `Reviews:       ${reviews.toString().padStart(6)}`,
    `Issues:        ${issues.toString().padStart(6)}`,
    `Discussions:   ${discussions.toString().padStart(6)}`,
    `Releases:      ${releases.toString().padStart(6)}`,
    `Total:         ${total.toString().padStart(6)}`,
    '',
    `Generated: ${outputPath}`,
  ];

  return lines.join('\n');
}
