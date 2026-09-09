import { runGraphQLAsync } from '../gh-activity/graphql.ts';
import type { LanguageDataOutput, LanguageStat } from './types.ts';

const GET_ORG_LANGUAGES_QUERY = `
  query getOrgLanguages($org: String!, $cursor: String) {
    organization(login: $org) {
      repositories(
        first: 100
        after: $cursor
        ownerAffiliations: OWNER
        isFork: false
      ) {
        nodes {
          nameWithOwner
          isArchived
          languages(first: 100, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

interface LanguageEdge {
  size: number;
  node: {
    name: string;
    color: string | null;
  };
}

interface RepositoryLanguageNode {
  nameWithOwner: string;
  isArchived: boolean;
  languages?: {
    edges: LanguageEdge[];
  } | null;
}

export async function collectOrgLanguages(org: string): Promise<LanguageDataOutput> {
  const languageMap = new Map<string, { name: string; color: string | null; bytes: number }>();
  let repoCount = 0;
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await runGraphQLAsync<{
      organization: {
        repositories: {
          nodes: RepositoryLanguageNode[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      } | null;
    }>(GET_ORG_LANGUAGES_QUERY, { org, cursor });

    if (!data.organization) {
      throw new Error(`Organization '${org}' not found or access denied.`);
    }

    const connection = data.organization.repositories;
    repoCount += connection.nodes.length;

    for (const repo of connection.nodes) {
      if (!repo.languages || !repo.languages.edges) continue;

      for (const edge of repo.languages.edges) {
        const { name, color } = edge.node;
        const size = edge.size;

        if (!languageMap.has(name)) {
          languageMap.set(name, { name, color, bytes: 0 });
        }
        const current = languageMap.get(name)!;
        current.bytes += size;
        if (color && !current.color) {
          current.color = color;
        }
      }
    }

    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  let totalBytes = 0;
  for (const item of languageMap.values()) {
    totalBytes += item.bytes;
  }

  const languages: LanguageStat[] = Array.from(languageMap.values())
    .map((item) => ({
      name: item.name,
      color: item.color,
      bytes: item.bytes,
      percentage: totalBytes > 0 ? parseFloat(((item.bytes / totalBytes) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    generated_at: new Date().toISOString(),
    repos: repoCount,
    total_bytes: totalBytes,
    languages,
  };
}

export function validateLanguageData(data: LanguageDataOutput): void {
  if (!data.generated_at || isNaN(Date.parse(data.generated_at))) {
    throw new Error(`Invalid generated_at timestamp: ${data.generated_at}`);
  }
  if (typeof data.repos !== 'number' || data.repos < 0) {
    throw new Error(`Invalid repos count: ${data.repos}`);
  }
  if (typeof data.total_bytes !== 'number' || data.total_bytes < 0) {
    throw new Error(`Invalid total_bytes: ${data.total_bytes}`);
  }
  if (!Array.isArray(data.languages)) {
    throw new Error('Missing or invalid languages array');
  }

  for (const lang of data.languages) {
    if (!lang.name || typeof lang.name !== 'string') {
      throw new Error('Language missing valid name');
    }
    if (typeof lang.bytes !== 'number' || lang.bytes < 0) {
      throw new Error(`Invalid bytes count for ${lang.name}: ${lang.bytes}`);
    }
    if (typeof lang.percentage !== 'number' || lang.percentage < 0 || lang.percentage > 100) {
      throw new Error(`Invalid percentage for ${lang.name}: ${lang.percentage}`);
    }
  }
}

export function summarizeLanguages(org: string, outputPath: string, data: LanguageDataOutput): string {
  const lines = [
    'GitHub Languages',
    '----------------',
    `Organization: ${org}`,
    `Repositories: ${data.repos}`,
    `Total bytes:  ${data.total_bytes.toLocaleString()}`,
    '',
    'Languages breakdown:',
  ];

  for (const lang of data.languages) {
    lines.push(
      `  - ${lang.name.padEnd(16)} ${lang.percentage.toFixed(2).padStart(6)}%  (${lang.bytes.toLocaleString()} bytes)`
    );
  }

  lines.push('');
  lines.push(`Generated: ${outputPath}`);
  return lines.join('\n');
}
