import {
  Atom,
  Box,
  Braces,
  Briefcase,
  Camera,
  CodeXml,
  Command,
  Cpu,
  Database,
  File,
  Flame,
  GitBranch,
  Globe,
  House,
  LayoutDashboard,
  Mail,
  PenLine,
  Pickaxe,
  Rss,
  ShieldAlert,
  Star,
  Terminal,
  TvMinimalPlay,
  Wind,
  Workflow,
  Zap,
} from "lucide-svelte";
import { SiGithub, SiInstagram, SiX } from "@icons-pack/svelte-simple-icons";
import { m } from "$lib/paraglide/messages.js";
import type { DOCK, PROJECT, SKILL } from "$lib/types/ui.ts";

export const journey = [
  {
    name: m["milestones.primary"](),
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Grundschule_Hechinger_Eck_06.jpg/500px-Grundschule_Hechinger_Eck_06.jpg",
    text:
      `<a href="https://hechingereck.de/" target="_blank" rel="noopener noreferrer" class="hover:underline underline-offset-4 decoration-black transition-all">Primary school</a>`,
    time: "09.2012 - 07.2016",
  },
  {
    name: m["milestones.secondary"](),
    image:
      "https://upload.wikimedia.org/wikipedia/commons/1/1c/Wildermuth-Gymnasium_T%C3%BCbingen_Juli_2022.jpg",
    text:
      `<a href="https://www.wildermuth-gymnasium.de/" target="_blank" rel="noopener noreferrer" class="hover:underline underline-offset-4 decoration-black transition-all">Secondary school</a><li><a href="https://de.wikipedia.org/wiki/Abitur_in_Baden-W%C3%BCrttemberg" target="_blank" class="hover:underline underline-offset-4 decoration-black transition-all">Abitur 2024/2025</a></li>`,
    time: "09.2016 - 07.2025",
  },
  {
    name: m["milestones.internship"](),
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Grundschule_Hechinger_Eck_06.jpg/500px-Grundschule_Hechinger_Eck_06.jpg",
    text:
      `<a href="https://kmz-tuebingen.de" target="_blank" rel="noopener noreferrer" class="hover:underline underline-offset-4 decoration-black transition-all">KMZ Tübingen - 2022</a><li><a href="https://www.sfz-tuebingen.org/" target="_blank" rel="noopener noreferrer" class="hover:underline underline-offset-4 decoration-black transition-all">SFZ Tübingen(${m.member()} 2016) - 2025</a></li>`,
    time: "2022 and 2025",
  },
];

export const projects: PROJECT[] = [
  {
    title: "teclab",
    description: m["project_titles.teclab"](),
    tags: ["React", "Three.js", "Manitu"],
    href: "https://sfz-tuebingen.org/",
    iframe_url: "https://sfz-tuebingen.org/",
  },
];

export const social_links = {
  github: "https://github.com/driver005",
  blog: "https://blog.a42n.com",
  twitter: "https://x.com/real4drian",
  instagram: "https://www.instagram.com/4real4drian/",
  linkedin: "https://www.linkedin.com/in/adrian-fernandez-84b3183a6/",
};

export const dock: DOCK = {
  navbar: [
    {
      label: m["dock.navbar.home"](),
      icon: House,
      value: "home",
      color: "bg-emerald-400",
    },
    {
      label: m["dock.navbar.journey"](),
      icon: PenLine,
      value: "journey",
      color: "bg-amber-400",
    },
    {
      label: m["dock.navbar.projects"](),
      icon: TvMinimalPlay,
      value: "projects",
      color: "bg-indigo-400",
    },
    {
      label: m["dock.navbar.skills"](),
      icon: Pickaxe,
      value: "skills",
      color: "bg-rose-400",
    },
  ],
  contact: [
    {
      label: m["dock.contact.github"](),
      icon: SiGithub,
      href: social_links.github,
      color: "bg-zinc-100",
    },
    {
      label: m["dock.contact.linkedin"](),
      icon: Briefcase,
      href: social_links.linkedin,
      color: "bg-blue-500",
    },
    {
      label: m["dock.contact.instagram"](),
      icon: SiInstagram,
      href: social_links.instagram,
      color: "bg-orange-500",
    },
    {
      label: m["dock.contact.x"](),
      icon: SiX,
      href: social_links.twitter,
      color: "bg-white",
    },
    {
      label: m["dock.contact.blog"](),
      icon: Rss,
      href: social_links.blog,
      color: "bg-purple-500",
    },
    {
      label: m["dock.contact.email"](),
      icon: Mail,
      href: `mailto:${m.email()}`,
      color: "bg-sky-500",
    },
  ],
};

export const skills: SKILL[] = [
  {
    name: "SvelteKit",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/sveltekit",
    border: "border-orange-500",
    color: "text-orange-500",
  },
  {
    name: "TypeScript",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/typescript",
    border: "border-blue-500",
    color: "text-blue-500",
  },
  {
    name: "JavaScript",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/javascript",
    border: "border-yellow-400",
    color: "text-yellow-400",
  },
  {
    name: "Tailwind",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/tailwind",
    border: "border-sky-400",
    color: "text-sky-400",
  },
  {
    name: "Rust",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/rust",
    border: "border-orange-700",
    color: "text-orange-700",
  },
  {
    name: "C++",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/cpp",
    border: "border-blue-600",
    color: "text-blue-600",
  },
  {
    name: "Java",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/java",
    border: "border-red-500",
    color: "text-red-500",
  },
  {
    name: "Go",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/golang",
    border: "border-cyan-500",
    color: "text-cyan-500",
  },
  {
    name: "React",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/react",
    border: "border-sky-500",
    color: "text-sky-500",
  },
  {
    name: "Python",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/python",
    border: "border-blue-400",
    color: "text-blue-400",
  },
  {
    name: "SQL",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/sql",
    border: "border-indigo-500",
    color: "text-indigo-500",
  },
  {
    name: "NoSQL",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/nosql",
    border: "border-emerald-500",
    color: "text-emerald-500",
  },
  {
    name: "AWS",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/aws",
    border: "border-orange-400",
    color: "text-orange-400",
  },
  {
    name: "Docker",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/docker",
    border: "border-blue-500",
    color: "text-blue-500",
  },
  {
    name: "Kubernetes",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/kubernetes",
    border: "border-blue-600",
    color: "text-blue-600",
  },
  {
    name: "GitHub Actions",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/githubactions",
    border: "border-blue-300",
    color: "text-blue-300",
  },
  {
    name: "Vercel",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/vercel",
    border: "border-slate-400",
    color: "text-slate-400",
  },
  {
    name: "PostgreSQL",
    message: m["skills.core"](),
    img: "https://avatar.vercel.sh/postgresql",
    border: "border-indigo-400",
    color: "text-indigo-400",
  },
  {
    name: "Redis",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/redis",
    border: "border-red-600",
    color: "text-red-600",
  },
  {
    name: "Sentry",
    message: m["skills.other"](),
    img: "https://avatar.vercel.sh/sentry",
    border: "border-purple-400",
    color: "text-purple-400",
  },
];

export const skill_tree = {
  name: m["skills.subtitle"](),
  categories: [
    {
      name: "Frontend",
      icon: LayoutDashboard,
      color: "text-blue-500",
      skills: [
        {
          name: "TypeScript",
          status: m["skills.other"](),
          icon: Braces,
          colorClass: "text-blue-500 bg-blue-500/5 border-blue-500",
        },
        {
          name: "JavaScript",
          status: m["skills.core"](),
          icon: CodeXml,
          colorClass: "text-blue-500 bg-blue-500/5 border-blue-500",
        },
        {
          name: "SvelteKit",
          status: m["skills.other"](),
          icon: Flame,
          colorClass: "text-blue-500 bg-blue-500/5 border-blue-500",
        },
        {
          name: "React",
          status: m["skills.other"](),
          icon: Atom,
          colorClass: "text-blue-500 bg-blue-500/5 border-blue-500",
        },
        {
          name: "Tailwind",
          status: m["skills.other"](),
          icon: Wind,
          colorClass: "text-blue-500 bg-blue-500/5 border-blue-500",
        },
      ],
    },
    {
      name: "Backend & Languages",
      icon: Database,
      color: "text-green-500",
      skills: [
        {
          name: "Node.js",
          status: m["skills.core"](),
          icon: Globe,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "Python",
          status: m["skills.core"](),
          icon: Zap,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "Go",
          status: m["skills.core"](),
          icon: Zap,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "Rust",
          status: m["skills.core"](),
          icon: Star,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "Java",
          status: m["skills.core"](),
          icon: Database,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "C++",
          status: m["skills.core"](),
          icon: Terminal,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
        {
          name: "SQL & NoSQL",
          status: m["skills.core"](),
          icon: Database,
          colorClass: "text-green-500 bg-green-500/5 border-green-500",
        },
      ],
    },
    {
      name: "Tools & DevOps",
      icon: Terminal,
      color: "text-orange-500",
      skills: [
        {
          name: "Git & GitHub",
          status: m["skills.core"](),
          icon: GitBranch,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
        {
          name: "LazyVim",
          status: m["skills.core"](),
          icon: Command,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
        {
          name: "Redis",
          status: m["skills.core"](),
          icon: Cpu,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
        {
          name: "Docker",
          status: m["skills.other"](),
          icon: Box,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
        {
          name: "GitHub Actions",
          status: m["skills.other"](),
          icon: Workflow,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
        {
          name: "Sentry",
          status: m["skills.other"](),
          icon: ShieldAlert,
          colorClass: "text-orange-500 bg-orange-500/5 border-orange-500",
        },
      ],
    },
  ],
};

export const music = [
  {
    artist: "Lucki",
    tag: m["music.artist"](),
    href: "https://www.instagram.com/deadboylife/",
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fnetflixdeed.com%2Fwp-content%2Fuploads%2F2024%2F01%2Flucki-girlfriend-768x432.jpg&f=1&nofb=1&ipt=bc7bbf4125b708bc461399de355e845a795faac32daf5ddf074f28dda242c036",
  },
  {
    artist: "Pop Smoke",
    tag: m["music.artist"](),
    href:
      "https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp",
    image:
      "https://wallpapers.com/images/high/pop-smoke-us-rapper-yq1a006drjaez4vy.webp",
  },
  {
    artist: "Shorline Mafia",
    tag: m["music.artist"](),
    href: "https://www.instagram.com/shorelinemafia/",
    image: "https://wallpaperaccess.com/full/18996640.jpg",
  },
  {
    artist: "D. Savage",
    tag: m["music.artist"](),
    href: "https://www.instagram.com/dsavage2700/",
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.whatsonthestar.com%2Fuploads%2F1684784099396.jpeg&f=1&nofb=1&ipt=8da661ad042103940210b890e66aa84c7c29e14583193add491cd470df3301dd",
  },
  {
    artist: "Gunna",
    tag: m["music.artist"](),
    href: "https://www.instagram.com/gunna/",
    image:
      "https://generations.fr/media/news/thumb/1280x720_gunna-sort-du-silence-sur-instagram_63be8bd32ba98.webp",
  },
  {
    title: "4Tspoon (feat. Yung Bans)",
    artist: "Playboi Carti, Yung Ban",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/45nws9GcCPP4D1n9hJ6Ytq?si=63e90ac4af604cba",
  },
  {
    title: "Caribbean",
    artist: "Shoreline Mafia",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/0wXDkdptCVhhDsLDGAhAOS?si=1fc5311330dd4d80",
  },
  {
    title: "More Than Ever",
    artist: "CHASETHEMONEY, LUCKI",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/2R9998qWII0jEgDaFaKXj2?si=1e74412f13714635",
  },
  {
    title: "Sunset",
    artist: "LUCKI",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/0zXnqruuTKhV7dTmbaO52L?si=4eb628c23fdc44f8",
  },
  {
    title: "Goku",
    artist: "LUCKI",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/4owmkqBxZ7bVtLGmIkx7Ew?si=f16ec9887a27437b",
  },
  {
    title: "Amg",
    artist: "Baby Smoove",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/6hBocfeNzPiXXIQVZ7h9Xm?si=f6a1b054cde949e1",
  },
  {
    title: "Private Jet",
    artist: "D, Savage",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/448fc6aM6KF95yK0IdnIQQ?si=ff95e62ee2e14b8c",
  },
  {
    title: "4everybody",
    artist: "LUCKI",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/6mvEk4k2zDgm8GbVJlAnyg?si=a8f867d068ae4bcb",
  },
  {
    title: "Pressure (feat. OhGeesy & Fenix Flexin)",
    artist: "Shoreline Mafia, Fenix Flexin, OHGEESY",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/7oW5YZZVeesParmVY7gx6s?si=f847c75cd3a341f9",
  },
  {
    title: "Acordado eu Sonho",
    artist: "Tz da Coronel",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/1WwJveqGQoABRF22Nmwv88?si=78850f51f3e7495e",
  },
  {
    title: "Embalo",
    artist: "Ryu, The Runner, Yunk Vino, Teto",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/5cAeyKBtzlQ0EIwPFcIYhT?si=dda5fdc8f8664482",
  },
  {
    title: "back in the a",
    artist: "Gunna",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/2TX04DO2zwrmoZKos95IA5?si=1763c8c499a04002",
  },
  {
    title: "Pour Two 4's",
    artist: "Shoreline Mafia",
    tag: m["music.song"](),
    href:
      "https://open.spotify.com/track/6X0LieJFN17cFDbPCLN8pJ?si=d79fcb2dac2f4cfa",
  },
  {
    title: "Dope!!!",
    artist: "Brocasito",
    tag: m["music.song"](),
    href: "https://open.spotify.com/track/5ZEyH3VBYL4QJA7ePtocdX",
  },
  {
    title: "🥶",
    artist: "Me",
    tag: m["music.playlist"](),
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F71%2Fd7%2F86%2F71d7866893223d82407bc42688bd9771.jpg&f=1&nofb=1&ipt=d40f10ececefca8e3596da9081d889ddf241094525f9902f40f0555aeaa6bfa3",
    href:
      "https://open.spotify.com/playlist/2rmJabff6FqKACuLeK9pEi?si=Cx852YSaSDymGqBHC6LVOw",
  },
  {
    title: "💨💨💨",
    artist: "Me",
    tag: m["music.playlist"](),
    image:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F71%2Fd7%2F86%2F71d7866893223d82407bc42688bd9771.jpg&f=1&nofb=1&ipt=d40f10ececefca8e3596da9081d889ddf241094525f9902f40f0555aeaa6bfa3",
    href:
      "https://open.spotify.com/playlist/15gP5kcCEDRJC3AejOKc7C?si=EPO6wlZaQRe7at2RBHutgQ",
  },
];

export const languages = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
];

export const media_assets = [
  {
    name: m["gallery.links.teclab"](),
    category: m["gallery.category.file"](),
    url: "https://github.com/driver005/teclab",
    icon: File,
    color: "bg-pink-400",
  },
  {
    name: m["gallery.links.assets"](),
    category: m["gallery.category.model"](),
    url: "https://github.com/andrewwoan/sooahs-room-folio",
    icon: Box,
    color: "bg-emerald-400",
  },
  {
    name: m["gallery.links.slides"](),
    category: m["gallery.category.photo"](),
    url: "https://www.dallasdesignerhandbags.com/products/gucci-slides",
    icon: Camera,
    color: "bg-amber-400",
  },
  {
    name: m["gallery.links.space"](),
    category: m["gallery.category.model"](),
    url: "https://levimagony.gumroad.com/l/uoscw",
    icon: Box,
    color: "bg-indigo-400",
  },
  {
    name: m["gallery.links.sofa"](),
    category: m["gallery.category.model"](),
    url: "https://blenderbash.gumroad.com/l/tPJOa",
    icon: Box,
    color: "bg-yellow-400",
  },
  {
    name: m["gallery.links.printer"](),
    category: m["gallery.category.model"](),
    url:
      "https://cults3d.com/en/3d-model/tool/bambu-lab-p1s-3d-printer-model-stl",
    icon: Box,
    color: "bg-orange-400",
  },
  {
    name: m["gallery.links.ams"](),
    category: m["gallery.category.model"](),
    url:
      "https://makerworld.com/en/models/1283144-bambu-ams-2-pro-cad-model-stp-file",
    icon: Box,
    color: "bg-cyan-400",
  },
  {
    name: m["gallery.links.animated"](),
    category: m["gallery.category.file"](),
    url: "https://animation-svelte.vercel.app/",
    icon: File,
    color: "bg-violet-400",
  },
  {
    name: m["gallery.links.house"](),
    category: m["gallery.category.file"](),
    url: "https://de.pinterest.com/pin/2533343537727438/",
    icon: File,
    color: "bg-red-400",
  },
  {
    name: m["gallery.links.meme"](),
    category: m["gallery.category.file"](),
    url: "https://de.pinterest.com/pin/799389002653432801/",
    icon: File,
    color: "bg-red-400",
  },
];

export const shortcuts = [
  { label: m["help.key.help"](), keys: ["?"] },
  { label: m["help.key.home"](), keys: ["H"] },
  { label: m["help.key.music"](), keys: ["M"] },
  { label: m["help.key.skills"](), keys: ["S"] },
  { label: m["help.key.close"](), keys: ["ESC"] },
];
