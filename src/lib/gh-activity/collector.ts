import { runGraphQLAsync } from './graphql.ts';
import type { ActivityEvent, RepositoryNode } from './types.ts';

const GET_ORG_REPOS_QUERY = `
  query getOrgRepos($org: String!, $cursor: String) {
    organization(login: $org) {
      repositories(
        first: 100
        after: $cursor
        ownerAffiliations: OWNER
        isFork: false
      ) {
        nodes {
          name
          nameWithOwner
          isArchived
          isPrivate
          hasDiscussionsEnabled
          defaultBranchRef {
            name
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

const GET_REPO_BRANCHES_QUERY = `
  query getRepoBranches($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      refs(refPrefix: "refs/heads/", first: 100, after: $cursor) {
        nodes {
          name
          target {
            ... on Commit {
              oid
              committedDate
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

const GET_BRANCH_COMMITS_QUERY = `
  query getBranchCommits($owner: String!, $name: String!, $refName: String!, $since: GitTimestamp!, $until: GitTimestamp!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $refName) {
        target {
          ... on Commit {
            history(since: $since, until: $until, first: 100, after: $cursor) {
              nodes {
                oid
                committedDate
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    }
  }
`;

const GET_REPO_PRS_AND_REVIEWS_QUERY = `
  query getRepoPRsAndReviews($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: 100
        after: $cursor
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          id
          createdAt
          updatedAt
          reviews(first: 100) {
            nodes {
              id
              submittedAt
              state
            }
            pageInfo {
              hasNextPage
              endCursor
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

const GET_MORE_REVIEWS_QUERY = `
  query getMoreReviews($id: ID!, $cursor: String) {
    node(id: $id) {
      ... on PullRequest {
        reviews(first: 100, after: $cursor) {
          nodes {
            id
            submittedAt
            state
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;

const GET_REPO_ISSUES_QUERY = `
  query getRepoIssues($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      issues(
        first: 100
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          createdAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const GET_REPO_DISCUSSIONS_QUERY = `
  query getRepoDiscussions($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      discussions(
        first: 100
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          createdAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const GET_REPO_RELEASES_QUERY = `
  query getRepoReleases($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      releases(
        first: 100
        after: $cursor
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          id
          createdAt
          publishedAt
          isDraft
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function getRepositories(org: string): Promise<RepositoryNode[]> {
  const repos: RepositoryNode[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await runGraphQLAsync<{
      organization: {
        repositories: {
          nodes: RepositoryNode[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      } | null;
    }>(GET_ORG_REPOS_QUERY, { org, cursor });

    if (!data.organization) {
      throw new Error(`Organization '${org}' not found or access denied.`);
    }

    const connection = data.organization.repositories;
    repos.push(...connection.nodes);

    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return repos;
}

export async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function collectCommitsForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];
  const [owner, name] = repo.nameWithOwner.split('/');

  let branchCursor: string | null = null;
  let hasNextBranchPage = true;

  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);

  while (hasNextBranchPage) {
    const branchData = await runGraphQLAsync<{
      repository: {
        refs: {
          nodes: Array<{
            name: string;
            target?: {
              oid?: string;
              committedDate?: string;
            } | null;
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        } | null;
      } | null;
    }>(GET_REPO_BRANCHES_QUERY, { owner, name, cursor: branchCursor });

    if (!branchData.repository || !branchData.repository.refs) {
      break;
    }

    const refsConn = branchData.repository.refs;
    for (const branch of refsConn.nodes) {
      if (!branch.target || !branch.target.committedDate) continue;

      const headDate = new Date(branch.target.committedDate);
      if (headDate < sinceDate) continue;

      let historyCursor: string | null = null;
      let hasNextHistoryPage = true;

      while (hasNextHistoryPage) {
        const historyData = await runGraphQLAsync<{
          repository: {
            ref: {
              target: {
                history: {
                  nodes: Array<{
                    oid: string;
                    committedDate: string;
                  }>;
                  pageInfo: {
                    hasNextPage: boolean;
                    endCursor: string | null;
                  };
                };
              };
            } | null;
          } | null;
        }>(GET_BRANCH_COMMITS_QUERY, {
          owner,
          name,
          refName: branch.name,
          since: sinceISO,
          until: untilISO,
          cursor: historyCursor,
        });

        const target = historyData.repository?.ref?.target;
        if (!target || !target.history) break;

        for (const commit of target.history.nodes) {
          const cDate = new Date(commit.committedDate);
          if (cDate >= sinceDate && cDate <= untilDate) {
            events.push({
              id: commit.oid,
              type: 'commits',
              date: cDate.toISOString().slice(0, 10),
              repo: repo.nameWithOwner,
            });
          }
        }

        hasNextHistoryPage = target.history.pageInfo.hasNextPage;
        historyCursor = target.history.pageInfo.endCursor;
      }
    }

    hasNextBranchPage = refsConn.pageInfo.hasNextPage;
    branchCursor = refsConn.pageInfo.endCursor;
  }

  return events;
}

export async function collectPullRequestsAndReviewsForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];
  const [owner, name] = repo.nameWithOwner.split('/');

  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);

  let prCursor: string | null = null;
  let hasNextPRPage = true;

  while (hasNextPRPage) {
    const data = await runGraphQLAsync<{
      repository: {
        pullRequests: {
          nodes: Array<{
            id: string;
            createdAt: string;
            updatedAt: string;
            reviews: {
              nodes: Array<{
                id: string;
                submittedAt: string | null;
                state: string;
              }>;
              pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
              };
            };
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        } | null;
      } | null;
    }>(GET_REPO_PRS_AND_REVIEWS_QUERY, { owner, name, cursor: prCursor });

    if (!data.repository || !data.repository.pullRequests) break;

    const prsConn = data.repository.pullRequests;
    let shouldStop = false;

    for (const pr of prsConn.nodes) {
      const updatedAt = new Date(pr.updatedAt);
      if (updatedAt < sinceDate) {
        shouldStop = true;
        break;
      }

      const createdAt = new Date(pr.createdAt);
      if (createdAt >= sinceDate && createdAt <= untilDate) {
        events.push({
          id: pr.id,
          type: 'pull_requests',
          date: createdAt.toISOString().slice(0, 10),
          repo: repo.nameWithOwner,
        });
      }

      const processReviewNodes = (
        reviews: Array<{ id: string; submittedAt: string | null; state: string }>
      ) => {
        for (const r of reviews) {
          if (r.submittedAt) {
            const subDate = new Date(r.submittedAt);
            if (subDate >= sinceDate && subDate <= untilDate) {
              events.push({
                id: r.id,
                type: 'reviews',
                date: subDate.toISOString().slice(0, 10),
                repo: repo.nameWithOwner,
              });
            }
          }
        }
      };

      processReviewNodes(pr.reviews.nodes);

      let revCursor = pr.reviews.pageInfo.endCursor;
      let hasNextRevPage = pr.reviews.pageInfo.hasNextPage;

      while (hasNextRevPage && revCursor) {
        const moreRevData = await runGraphQLAsync<{
          node: {
            reviews: {
              nodes: Array<{
                id: string;
                submittedAt: string | null;
                state: string;
              }>;
              pageInfo: {
                hasNextPage: boolean;
                endCursor: string | null;
              };
            };
          } | null;
        }>(GET_MORE_REVIEWS_QUERY, { id: pr.id, cursor: revCursor });

        if (!moreRevData.node?.reviews) break;
        processReviewNodes(moreRevData.node.reviews.nodes);
        hasNextRevPage = moreRevData.node.reviews.pageInfo.hasNextPage;
        revCursor = moreRevData.node.reviews.pageInfo.endCursor;
      }
    }

    if (shouldStop) break;
    hasNextPRPage = prsConn.pageInfo.hasNextPage;
    prCursor = prsConn.pageInfo.endCursor;
  }

  return events;
}

export async function collectIssuesForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];
  const [owner, name] = repo.nameWithOwner.split('/');

  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);

  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await runGraphQLAsync<{
      repository: {
        issues: {
          nodes: Array<{
            id: string;
            createdAt: string;
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        } | null;
      } | null;
    }>(GET_REPO_ISSUES_QUERY, { owner, name, cursor });

    if (!data.repository || !data.repository.issues) break;

    const conn = data.repository.issues;
    let shouldStop = false;

    for (const issue of conn.nodes) {
      const createdAt = new Date(issue.createdAt);
      if (createdAt < sinceDate) {
        shouldStop = true;
        break;
      }
      if (createdAt >= sinceDate && createdAt <= untilDate) {
        events.push({
          id: issue.id,
          type: 'issues',
          date: createdAt.toISOString().slice(0, 10),
          repo: repo.nameWithOwner,
        });
      }
    }

    if (shouldStop) break;
    hasNextPage = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return events;
}

export async function collectDiscussionsForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  if (!repo.hasDiscussionsEnabled) {
    return [];
  }

  const events: ActivityEvent[] = [];
  const [owner, name] = repo.nameWithOwner.split('/');

  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);

  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await runGraphQLAsync<{
      repository: {
        discussions: {
          nodes: Array<{
            id: string;
            createdAt: string;
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        } | null;
      } | null;
    }>(GET_REPO_DISCUSSIONS_QUERY, { owner, name, cursor });

    if (!data.repository || !data.repository.discussions) break;

    const conn = data.repository.discussions;
    let shouldStop = false;

    for (const disc of conn.nodes) {
      const createdAt = new Date(disc.createdAt);
      if (createdAt < sinceDate) {
        shouldStop = true;
        break;
      }
      if (createdAt >= sinceDate && createdAt <= untilDate) {
        events.push({
          id: disc.id,
          type: 'discussions',
          date: createdAt.toISOString().slice(0, 10),
          repo: repo.nameWithOwner,
        });
      }
    }

    if (shouldStop) break;
    hasNextPage = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return events;
}

export async function collectReleasesForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = [];
  const [owner, name] = repo.nameWithOwner.split('/');

  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);

  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await runGraphQLAsync<{
      repository: {
        releases: {
          nodes: Array<{
            id: string;
            createdAt: string;
            publishedAt: string | null;
            isDraft: boolean;
          }>;
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        } | null;
      } | null;
    }>(GET_REPO_RELEASES_QUERY, { owner, name, cursor });

    if (!data.repository || !data.repository.releases) break;

    const conn = data.repository.releases;

    for (const rel of conn.nodes) {
      if (rel.isDraft && !rel.publishedAt) continue;
      const relDateStr = rel.publishedAt || rel.createdAt;
      const relDate = new Date(relDateStr);

      if (relDate >= sinceDate && relDate <= untilDate) {
        events.push({
          id: rel.id,
          type: 'releases',
          date: relDate.toISOString().slice(0, 10),
          repo: repo.nameWithOwner,
        });
      }
    }

    hasNextPage = conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo.endCursor;
  }

  return events;
}

export async function collectAllActivityForRepo(
  repo: RepositoryNode,
  sinceISO: string,
  untilISO: string
): Promise<ActivityEvent[]> {
  console.log(` -> Collecting activity for ${repo.nameWithOwner}...`);
  const commits = await collectCommitsForRepo(repo, sinceISO, untilISO);
  const prsAndReviews = await collectPullRequestsAndReviewsForRepo(repo, sinceISO, untilISO);
  const issues = await collectIssuesForRepo(repo, sinceISO, untilISO);
  const discussions = await collectDiscussionsForRepo(repo, sinceISO, untilISO);
  const releases = await collectReleasesForRepo(repo, sinceISO, untilISO);

  return [...commits, ...prsAndReviews, ...issues, ...discussions, ...releases];
}

export async function collectAllActivity(
  repos: RepositoryNode[],
  sinceISO: string,
  untilISO: string,
  concurrency = 2
): Promise<ActivityEvent[]> {
  const repoEventsArrays = await mapConcurrent(repos, concurrency, (repo) =>
    collectAllActivityForRepo(repo, sinceISO, untilISO)
  );

  return repoEventsArrays.flat();
}
