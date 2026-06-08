# Scaffolding → SvelteKit 1:1 Port Design

**Date:** 2026-06-08  
**Scope:** Port `scafholding/` React design into the SvelteKit project at route `/`

---

## Goal

Replace the current simplified Svelte component implementations with pixel-accurate ports of the React scaffolding. The route `/` must render identically to the scaffolding's `App.js`.

---

## Section 1 — Page Structure (`src/routes/+page.svelte`)

Match `App.js` exactly:

```
SmoothScroll
  └── div.App.grain.min-h-screen (bg-[#F3F2EE] text-[#0A0A0A])
        ├── Cursor (fixed)
        ├── ScrollProgress (fixed)
        ├── Nav (fixed)
        └── main
              ├── Hero
              ├── About
              ├── Gallery
              ├── Works
              ├── Spiral
              ├── Services
              ├── HorizontalScroll
              ├── Contact
              └── Footer
```

**Removed from current page:** `StarField`, `GhostBackground`, `PandaScene` — not in scaffolding.  
**Dividers:** kept but commented out (matching scaffolding state).  
**`src/routes/home/`** — untouched (3D Threlte route).

---

## Section 2 — CSS / Design System (`src/app.css`)

Core tokens are already aligned (`--bg: #F3F2EE`, `--ink: #0A0A0A`, `--accent: #FF3B00`, same font stacks). Changes needed:

1. Add `.rfm-marquee-container { overflow: hidden; }` — required by react-fast-marquee in Gallery/Services
2. Verify `tailwind.config.ts` includes `fontFamily` entries for `display`, `almarai`, `serif-italic` matching scaffolding
3. Keep existing shadcn semantic vars (`--primary`, `--secondary`, etc.) — stripping would break Tailwind class references

No destructive CSS changes.

---

## Section 3 — Component Rewrites

### Full Rewrites (10 components)

Each rewritten as a `.svelte` file in `src/lib/ui/module/`, porting the React source 1:1.

| Component | Key features to port |
|---|---|
| `hero.svelte` | Full-screen video background, scroll-stretch text overlays via `scroll-stretch.svelte.ts`, grid meta strip, marquee scrolling text, noise layer parallax |
| `about.svelte` | 7/5 grid split, animated line-by-line headline reveal, 3D portrait with mouse-tracking parallax (`perspective` + CSS transforms), SVG depth lines, ISO corner labels, CountUp stats |
| `works.svelte` | Project row list, hover image-trail effect (cursor-following 260×300px image stack with spawn/throttle logic), ScrambleText on project names, `text-stroke` class |
| `services.svelte` | Marquee heading with `text-stroke` outline, hover color fill transition on service cards, border-line animations, tag lists, stagger reveals |
| `contact.svelte` | Large scrolling marquee CTA, split-grid layout (main + info sidebar), studio address + social links, color-coded contact buttons, magnetic button CTAs |
| `footer.svelte` | Large name with clip-path scroll-fill reveal, grid info columns (copyright, Berlin time, stack, back-to-top), scroll progress tracking |
| `spiral.svelte` | Three.js canvas, PlaneCard mesh with shader material, reveal progress animation, hover states, wheel + pointer events |
| `horizontal-scroll.svelte` | Scroll-driven horizontal translation via `$effect` + `scrollY`, VincentBackground WebGL shader as section background |
| `divider.svelte` | `GradientEngine` class: 15 gradient stops with `easeInOutSine` easing between `from` and `to` color props |
| `scramble-text.svelte` | RAF-based per-character animation queue, HTML injection, **hover-triggered** (not auto-play on mount) |

### Minor Updates (3 components)

| Component | Change |
|---|---|
| `nav.svelte` | Add Berlin time display (live clock, updates every second) |
| `gallery.svelte` | Align scroll tracking to use `useScroll`-equivalent pattern |
| `count-up.svelte` | Add `padding` (zero-pad to N digits) and `suffix` prop support |

### Keep As-Is (4 components)

`smooth-scroll.svelte`, `cursor.svelte`, `scroll-progress.svelte`, `magnetic-button.svelte` — functionally equivalent, no changes needed.

---

## Section 4 — Animation Translation Strategy

| Framer Motion pattern | Svelte equivalent |
|---|---|
| `motion.div` + `useMotionValue` / `useSpring` | `svelte-motion` `Motion` component (already installed) |
| `useScroll` + `useTransform` | `$effect` + `window.scrollY` listener + derived values |
| Hero scroll-stretch parallax | `scroll-stretch.svelte.ts` utility (already in `src/lib/util/`) |
| RAF character animation (ScrambleText) | `requestAnimationFrame` in `$effect`, cleanup on destroy |
| Three.js scenes | Native Three.js (pattern already used in current spiral.svelte) |
| Hover image trail (Works) | `mousemove` event handler + reactive array of positioned image elements |
| Clip-path reveal (Footer) | CSS `clip-path` animation triggered by `IntersectionObserver` |

---

## Section 5 — What Stays Untouched

- `src/routes/home/` — 3D Threlte/Rapier canvas route
- `src/lib/three/` — all Three.js scene helpers
- `src/lib/ui/helper/theme-switcher.svelte`
- `src/routes/+layout.svelte`

---

## Success Criteria

1. `+page.svelte` matches `App.js` component order exactly
2. Each ported component is visually identical to its React counterpart at all breakpoints
3. All scroll-driven animations trigger correctly with Lenis smooth scroll
4. No regressions in `src/routes/home/` 3D route
5. `app.css` tokens unchanged (same hex values, same font stacks)
