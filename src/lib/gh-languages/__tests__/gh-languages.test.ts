import { describe, expect, it } from 'vitest';
import { summarizeLanguages, validateLanguageData } from '../collector.ts';
import type { LanguageDataOutput } from '../types.ts';

describe('GitHub Languages Collector Unit Tests', () => {
  it('validates language data structure correctly', () => {
    const validData: LanguageDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      repos: 5,
      total_bytes: 1000,
      languages: [
        { name: 'Rust', color: '#dea584', bytes: 600, percentage: 60.0 },
        { name: 'TypeScript', color: '#3178c6', bytes: 400, percentage: 40.0 },
      ],
    };

    expect(() => validateLanguageData(validData)).not.toThrow();
  });

  it('fails validation on invalid values', () => {
    const invalidData: LanguageDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      repos: 5,
      total_bytes: 1000,
      languages: [
        { name: 'Rust', color: '#dea584', bytes: -1, percentage: 150.0 },
      ],
    };

    expect(() => validateLanguageData(invalidData)).toThrow();
  });

  it('formats output summary correctly', () => {
    const data: LanguageDataOutput = {
      generated_at: '2026-09-09T12:00:00Z',
      repos: 2,
      total_bytes: 1000,
      languages: [
        { name: 'Rust', color: '#dea584', bytes: 600, percentage: 60.0 },
        { name: 'TypeScript', color: '#3178c6', bytes: 400, percentage: 40.0 },
      ],
    };

    const summary = summarizeLanguages('test-org', 'src/assets/gh-languages.json', data);
    expect(summary).toContain('Organization: test-org');
    expect(summary).toContain('Rust');
    expect(summary).toContain('60.00%');
    expect(summary).toContain('Generated: src/assets/gh-languages.json');
  });
});
