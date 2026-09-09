export type ActivityType =
  | "commits"
  | "pull_requests"
  | "reviews"
  | "issues"
  | "discussions"
  | "releases";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  date: string;
  repo: string;
}

export interface DailyActivity {
  commits: number;
  pull_requests: number;
  reviews: number;
  issues: number;
  discussions: number;
  releases: number;
  total: number;
}

export interface ActivityDataOutput {
  year: number;
  generated_at: string;
  repos: number;
  activity: Record<string, DailyActivity>;
}

export interface RepositoryNode {
  name: string;
  nameWithOwner: string;
  isArchived: boolean;
  isPrivate: boolean;
  hasDiscussionsEnabled: boolean;
  defaultBranchRef?: {
    name: string;
  } | null;
}
