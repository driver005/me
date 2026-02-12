import type { ComponentType } from 'svelte';

export type PROFILE = {
  name: string,
  title: string,
  description: string,
  tagline: string,
  story: string,
  status: string,
  focus: string,
  updateDate: string,
  image: string
}

export interface MILESTONE {
  id: number;
  title: string;
  content: string;
  image: string;
  icon: ComponentType; // Or 'any' if not using Svelte/Lucide icons specifically
}

export interface SKILL {
  name: string;
  message: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  img: string;
  border: string;
  color: string;
}


export interface PROJECT_ITEM {
  title: string;
  description: string;
  tags: string[];
  href: string;
  iframe_url: string;
}

export interface PROFILE_PAGE_DATA {
  profile: PROFILE;
  milestones: MILESTONE[];
  sellingPoints: string[];
  skills: SKILL[];
  projects: PROJECT_ITEM[];
}

export interface ARTIST {
  name: string;
  genre: 'R&B' | 'Alternative' | 'Hip Hop' | string; // Adds specific suggestions + flexibility
  color: `bg-${string}-${number}`; // Template literal for Tailwind classes
  text: `text-${string}-${number}`; 
  initials: string;
  image: string;
  href: string;
}

export interface SONG {
  title?: string;
  artist: string;
  tag: 'Hot' | 'Classic' | 'Vibe' | 'Heavy' | 'Chill' | 'Legend' | string;
  href: string;
  image?: string;
}

export interface FAVORITES_PAGE_DATA {
  artists: ARTIST[];
  songs: SONG[];
}
