import type { ComponentType, SvelteComponent } from 'svelte';

export interface NAVITEM {
  label: string;
  icon: ComponentType<SvelteComponent<any>> | any;
  value: string;
  color: string;
}

export interface CONTACTITEM {
  label: string;
  icon: ComponentType<SvelteComponent<any>> | any;
  href: string;
  color: string;
}

export interface DOCK {
  navbar: NAVITEM[];
  contact: CONTACTITEM[];
}

export type PROFILE = {
  name: string,
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
  icon: ComponentType<SvelteComponent<any>> | any;
}

export interface SKILL {
  name: string;
  /** URL-safe id for /skills/[slug]. */
  slug: string;
  message: string;
  img: string;
  border: string;
  color: string;
  /** Hex form of `color` (Tailwind class → real value) — needed anywhere Tailwind classes can't
   *  reach, e.g. tinting the /skills/[slug] background planet's shader uniform. */
  primaryColor: string;
  /** Core skills (message === m['skills.core']()) are the favourites — gets a star before the name
   *  wherever it's listed. */
  favourite: boolean;
  /** Only set for actual programming languages (not frameworks/tools/services) — 'typed' (statically
   *  type-checked: TypeScript/Rust/C++/Java/Go) biases that skill's /skills moon and, on
   *  /skills/[slug], the shared skillPlanet's own procedural terrain toward hills/rock ("a lot of
   *  hills"); 'dynamic' (JavaScript/Python) biases it toward water ("a lot of water") instead — see
   *  raymarch-planet.ts's getHillBiasForSkill(). Left unset for everything else, which renders with
   *  the generator's own neutral default mix. */
  typeSafety?: 'typed' | 'dynamic';
}


export interface PROJECT {
  title: string;
  description: string;
  tags: string[];
  href: string;
  iframe_url?: string;
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

export interface MUSIC_LIBRARY {
  artists: ARTIST[];
  songs: SONG[];
}

export interface DATA {
  profile: PROFILE;
  milestones: MILESTONE[];
  sellingPoints: string[];
  skills: SKILL[];
  projects: PROJECT[];
  dock: DOCK;
}
