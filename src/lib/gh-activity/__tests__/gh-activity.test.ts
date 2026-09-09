import { describe, expect, it } from 'vitest';
import {
  aggregateActivity,
  createZeroBucket,
  generateDateRange,
  mergeActivityData,
  summarizeActivity,
  validateActivityData,
} from '../aggregator.ts';
import type { ActivityDataOutput, ActivityEvent } from '../types.ts';

describe('GitHub Activity Aggregator Unit Tests (gh-activity)', () => {
  it('generates a contiguous date range in UTC', () => {
    const dates = generateDateRange('2026-01-01', '2026-01-05');
    expect(dates).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ]);
  });

  it('initializes zero buckets and aggregates events correctly', () => {
    const events: ActivityEvent[] = [
      { id: 'c1', type: 'commits', date: '2026-01-02', repo: 'org/repo1' },
      { id: 'c2', type: 'commits', date: '2026-01-02', repo: 'org/repo1' },
      { id: 'pr1', type: 'pull_requests', date: '2026-01-02', repo: 'org/repo2' },
      { id: 'rev1', type: 'reviews', date: '2026-01-03', repo: 'org/repo2' },
    ];

    const result = aggregateActivity(events, 2026, '2026-01-01', '2026-01-03', 2, '2026-01-03T12:00:00Z');

    expect(result.year).toBe(2026);
    expect(result.repos).toBe(2);
    expect(result.generated_at).toBe('2026-01-03T12:00:00Z');

    expect(result.activity['2026-01-01']).toEqual({
      commits: 0,
      pull_requests: 0,
      reviews: 0,
      issues: 0,
      discussions: 0,
      releases: 0,
      total: 0,
    });

    expect(result.activity['2026-01-02']).toEqual({
      commits: 2,
      pull_requests: 1,
      reviews: 0,
      issues: 0,
      discussions: 0,
      releases: 0,
      total: 3,
    });

    expect(result.activity['2026-01-03']).toEqual({
      commits: 0,
      pull_requests: 0,
      reviews: 1,
      issues: 0,
      discussions: 0,
      releases: 0,
      total: 1,
    });

    expect(() => validateActivityData(result)).not.toThrow();
  });

  it('deduplicates duplicate events with the same type and ID', () => {
    const events: ActivityEvent[] = [
      { id: 'commit-sha-123', type: 'commits', date: '2026-01-02', repo: 'org/repo1' },
      { id: 'commit-sha-123', type: 'commits', date: '2026-01-02', repo: 'org/repo1' },
    ];

    const result = aggregateActivity(events, 2026, '2026-01-02', '2026-01-02', 1);
    expect(result.activity['2026-01-02'].commits).toBe(1);
    expect(result.activity['2026-01-02'].total).toBe(1);
  });

  it('merges incremental updates into existing dataset without corrupting history', () => {
    const existing: ActivityDataOutput = {
      year: 2026,
      generated_at: '2026-01-05T00:00:00Z',
      repos: 10,
      activity: {
        '2026-01-01': { commits: 5, pull_requests: 1, reviews: 0, issues: 0, discussions: 0, releases: 0, total: 6 },
        '2026-01-02': { commits: 3, pull_requests: 0, reviews: 1, issues: 0, discussions: 0, releases: 0, total: 4 },
        '2026-01-03': { commits: 0, pull_requests: 0, reviews: 0, issues: 0, discussions: 0, releases: 0, total: 0 },
      },
    };

    const newWindowData: ActivityDataOutput = {
      year: 2026,
      generated_at: '2026-01-04T00:00:00Z',
      repos: 10,
      activity: {
        '2026-01-03': { commits: 2, pull_requests: 1, reviews: 0, issues: 0, discussions: 0, releases: 0, total: 3 },
        '2026-01-04': { commits: 4, pull_requests: 0, reviews: 2, issues: 1, discussions: 0, releases: 0, total: 7 },
      },
    };

    const merged = mergeActivityData(existing, newWindowData, '2026-01-03', '2026-01-04');

    expect(merged.activity['2026-01-01'].total).toBe(6);
    expect(merged.activity['2026-01-02'].total).toBe(4);
    expect(merged.activity['2026-01-03'].total).toBe(3);
    expect(merged.activity['2026-01-04'].total).toBe(7);
    expect(Object.keys(merged.activity)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']);

    expect(() => validateActivityData(merged)).not.toThrow();
  });

  it('fails validation when total does not match sum of individual activities', () => {
    const invalidData: ActivityDataOutput = {
      year: 2026,
      generated_at: '2026-01-01T00:00:00Z',
      repos: 1,
      activity: {
        '2026-01-01': { commits: 2, pull_requests: 1, reviews: 0, issues: 0, discussions: 0, releases: 0, total: 99 },
      },
    };

    expect(() => validateActivityData(invalidData)).toThrow(/Total mismatch on date 2026-01-01/);
  });

  it('formats output summary correctly', () => {
    const data = aggregateActivity(
      [{ id: 'c1', type: 'commits', date: '2026-01-01', repo: 'org/repo' }],
      2026,
      '2026-01-01',
      '2026-01-01',
      5
    );

    const summary = summarizeActivity('test-org', '2026-01-01', '2026-01-01', 'src/assets/gh-activity.json', data);
    expect(summary).toContain('Organization: test-org');
    expect(summary).toContain('Repositories: 5');
    expect(summary).toContain('Commits:            1');
    expect(summary).toContain('Generated: src/assets/gh-activity.json');
  });
});
