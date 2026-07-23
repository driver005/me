# me — adrian's portfolio

eh whats up. this is my personal site. built with sveltekit 5, three.js, and way too much caffeine.

```bash
npm run dev      # fire it up
npm run build    # ship it
npm run preview  # see what you shipped
```

## stack

| thing          | what                                          |
| -------------- | --------------------------------------------- |
| **framework**  | sveltekit 5 + svelte 5 (runes mode bc classy) |
| **3d**         | threlte, three.js, postprocessing v6          |
| **css**        | tailwind v4, `@import "tailwindcss"`          |
| **i18n**       | paraglide (en/de/es)                          |
| **fonts**      | jetbrains mono + cabinet grotesk              |
| **animations** | lenis, svelte-motion, custom webgl shaders    |
| **deploy**     | static adapter → vercel                       |

## vibe

cream `#F3F2EE` bg, dark `#0A0A0A` text, red `#FF3B00` accent. brutalist edges. grain overlay everywhere. if it doesnt have a 4px black shadow did it even ship.

## what's in here

```
src/
├── lib/
│   ├── data/           # all content (works, services, skills, music, etc)
│   ├── ui/             # components (module/, custom/, cn/)
│   ├── three/          # 3d scenes & postprocessing
│   ├── util/           # composables (berlin clock, scroll reveal, mouse parallax)
│   ├── shaders/        # glsl
│   ├── types/          # types
│   ├── stores/         # svelte stores
│   ├── models/         # 3d models
│   └── paraglide/      # auto-generated i18n
├── static/
│   ├── images/works/   # project preview screenshots
│   └── ...
├── messages/           # i18n translation files (en, de, es)
└── scripts/            # utility scripts
```

## sections

- **selected works** — 6 projects with image trail on hover
- **about** — bio, portrait, journey timeline
- **services** — 4 skill areas (ai/ml, web, creative tech, infra)
- **spiral** — 3d spiral carousel with webgl shader cards
- **process** — horizontal scroll mindset thing (learn → build → share → repeat)
- **gallery** — links to assets/models
- **contact** — socials + email

## sections that use three.js

- spiral (full custom webgl, raycaster hover, scroll-driven)
- process (vincent background shader, image grid loop)
- gallery (threlte 3d scene)
- music (threlte scene)
- home (multiple threlte scenes)
- hero-card (3d card)

## scripts

```bash
bash scripts/update-works-previews.sh   # regenerate project screenshots
node scripts/model-pipeline.ts          # build 3d model pipeline
```

## socials

- github: [driver005](https://github.com/driver005)
- blog: [blog.a42n.com](https://blog.a42n.com)
- ig: [@4real4drian](https://www.instagram.com/4real4drian)
- x: [@real4drian](https://x.com/real4drian)

## license

uhh idk man its my portfolio. dont clone it 1:1 thats weird to be honest. get inspired tho.
