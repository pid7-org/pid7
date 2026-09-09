export interface Project {
  name: string;
  desc: string;
  url: string;
}

export const projects: Project[] = [
  {
    name: 'ashwa',
    desc: 'hardware accelerated routines for single substring search',
    url: 'https://github.com/pid7-org/ashwa',
  },
  {
    name: 'turbofox',
    desc: 'persistent and efficient embedded KV database',
    url: 'https://github.com/pid7-org/turbofox',
  },
  {
    name: 'rta',
    desc: 'minimal metadata store for durable system state',
    url: 'https://github.com/pid7-org/rta',
  },
];

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
