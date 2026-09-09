import { describe, expect, it } from 'vitest';
import { summarizeProjects, validateProjectsData } from '../collector.ts';
import type { ProjectsDataOutput } from '../types.ts';

describe('GitHub Projects Collector Unit Tests', () => {
  it('validates project data structure correctly', () => {
    const validData: ProjectsDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      total_repos_scanned: 11,
      projects: [
        {
          name: 'turbofox',
          nameWithOwner: 'pid7-org/turbofox',
          desc: 'A persistent and efficient embedded KV database',
          url: 'https://github.com/pid7-org/turbofox',
          stars: 1,
          forks: 0,
          language: 'Rust',
          languageColor: '#dea584',
          languages: [{ name: 'Rust', color: '#dea584', bytes: 41066 }],
          commits: 503,
          releases: 2,
          pullRequests: 1,
          issues: 1,
          contributions: 507,
        },
      ],
    };

    expect(() => validateProjectsData(validData)).not.toThrow();
  });

  it('fails validation when project values are invalid', () => {
    const invalidData: ProjectsDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      total_repos_scanned: 11,
      projects: [
        {
          name: 'turbofox',
          nameWithOwner: 'pid7-org/turbofox',
          desc: 'A persistent and efficient embedded KV database',
          url: 'https://github.com/pid7-org/turbofox',
          stars: 1,
          forks: 0,
          language: 'Rust',
          languageColor: '#dea584',
          languages: [],
          commits: -5,
          releases: 2,
          pullRequests: 1,
          issues: 1,
          contributions: 507,
        },
      ],
    };

    expect(() => validateProjectsData(invalidData)).toThrow();
  });

  it('formats output summary correctly', () => {
    const data: ProjectsDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      total_repos_scanned: 11,
      projects: [
        {
          name: 'turbofox',
          nameWithOwner: 'pid7-org/turbofox',
          desc: 'A persistent and efficient embedded KV database',
          url: 'https://github.com/pid7-org/turbofox',
          stars: 1,
          forks: 0,
          language: 'Rust',
          languageColor: '#dea584',
          languages: [{ name: 'Rust', color: '#dea584', bytes: 41066 }],
          commits: 503,
          releases: 2,
          pullRequests: 1,
          issues: 1,
          contributions: 507,
        },
      ],
    };

    const summary = summarizeProjects('pid7-org', 'src/assets/gh-projects.json', data);
    expect(summary).toContain('Organization:        pid7-org');
    expect(summary).toContain('turbofox');
    expect(summary).toContain('[Rust]');
    expect(summary).toContain('507 total contributions');
    expect(summary).toContain('503 commits');
    expect(summary).toContain('2 releases');
    expect(summary).toContain('A persistent and efficient embedded KV database');
    expect(summary).toContain('Generated: src/assets/gh-projects.json');
  });
});
