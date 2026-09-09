import projectsData from '../assets/gh-projects.json';

export interface ProjectLanguageStat {
  name: string;
  color: string | null;
  bytes: number;
}

export interface Project {
  name: string;
  nameWithOwner?: string;
  desc: string;
  url: string;
  stars?: number;
  forks?: number;
  language?: string;
  languageColor?: string | null;
  languages?: ProjectLanguageStat[];
  commits?: number;
  releases?: number;
  pullRequests?: number;
  issues?: number;
  contributions?: number;
}

const fallbackProjects: Project[] = [
  {
    name: 'turbofox',
    desc: 'A persistent and efficient embedded KV database',
    url: 'https://github.com/pid7-org/turbofox',
    language: 'Rust',
    commits: 503,
    releases: 2,
    contributions: 507,
  },
  {
    name: 'frozen-core',
    desc: 'Core utilities for frozen codebases.',
    url: 'https://github.com/pid7-org/frozen-core',
    language: 'Rust',
    commits: 359,
    releases: 31,
    contributions: 486,
  },
  {
    name: 'ashwa',
    desc: 'Hardware accelerated routines for single substring search.',
    url: 'https://github.com/pid7-org/ashwa',
    language: 'Rust',
    commits: 265,
    releases: 6,
    contributions: 271,
  },
  {
    name: 'kosa',
    desc: 'A reliable page-based storage engine with fire-and-forget durability semantics',
    url: 'https://github.com/pid7-org/kosa',
    language: 'Rust',
    commits: 129,
    releases: 3,
    contributions: 136,
  },
  {
    name: 'rta',
    desc: 'Ṛta (ऋत) is a minimal metadata store for durable system state',
    url: 'https://github.com/pid7-org/rta',
    language: 'Rust',
    commits: 81,
    releases: 2,
    contributions: 86,
  },
];

export const projects: Project[] =
  projectsData && Array.isArray(projectsData.projects) && projectsData.projects.length > 0
    ? (projectsData.projects as Project[])
    : fallbackProjects;

export interface TeamMember {
  name: string;
  role?: string;
  image?: string;
  bio: string;
  github?: string;
}

export const team: TeamMember[] = [
  {
    name: 'Adii',
    role: 'Founder & Engineer',
    image: '/adii.jpg',
    bio: 'Engineer by choice, exploring systems engineering and turning ideas into reality.',
    github: 'https://github.com/adityamotale',
  },
  {
    name: 'Sher',
    role: 'Chief Officer of Happiness',
    image: '/sher.jpg',
    bio: 'Keeps morale high and sleeps through code reviews.',
  },
];
