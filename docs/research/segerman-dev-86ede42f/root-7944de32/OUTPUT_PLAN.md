# Output Plan — segerman.dev clone

## Target
- URL: `https://segerman.dev/`
- App root: this SvelteKit repo (`.` — per user: "convert to sveltekit", clone lives in this app, not a Next.js scaffold)
- Site key: `segerman-dev-86ede42f` (origin `https://segerman.dev/`)
- Page key: `root-7944de32` (pathname `/`)
- Destination route: `src/routes/segerman/+page.svelte` → `/segerman` (route does not exist; no collision with existing routes: `/`, `/gallery`, `/skills`, `/works`, `/services`, `/about`, `/faq`, `/activity`, `/process`, `/contact`, `/home`, `/me`, `/map`, `/motion-path`, `/music`, `/imprint`, `/privacy`, `/spiral`)

## Artifact roots (SvelteKit-adapted)
- Research: `docs/research/segerman-dev-86ede42f/root-7944de32/`
- Screenshots: `docs/design-references/segerman-dev-86ede42f/root-7944de32/`
- Components: `src/lib/components/sites/segerman-dev-86ede42f/root-7944de32/` (+ `.../shared/` for same-site shared)
- Assets: `static/sites/segerman-dev-86ede42f/root-7944de32/`
- Downloader: `scripts/download-assets-segerman-dev-86ede42f-root-7944de32.mjs` (already run)

## Pipeline deviations (user-approved)
- Framework: SvelteKit 5 + Tailwind v4 (repo already uses these) instead of Next.js scaffold
- Extraction: browser MCP when connected (user: "I'll connect Chrome MCP"); firecrawl HTML/screenshot already captured as fallback baseline
- Fonts/colors/global CSS: merged into `src/routes/segerman/+layout.ts`-scoped CSS or `:global` in the clone's layout, NOT into `src/app.css` (avoid touching existing routes' styling)

## Foundation (sequential, before builders)
1. Chrome MCP connected → full-page screenshots desktop 1440 / mobile 390 → screenshot root
2. Global extraction: fonts, colors, favicon, smooth-scroll lib (check `.lenis`/custom scroll), global keyframes → scoped clone CSS
3. Behavior sweep → `BEHAVIORS.md`; page topology → `PAGE_TOPOLOGY.md`
4. Per-section extract → `components/*.spec.md` → dispatch SvelteKit builder agents → merge → verify `npm run build`

## Known from initial scrape (no browser needed)
- Layout: fixed top progress bar, logo "Raphael Segerman" left + nav "Info , Contact" right (comma separator, contact = copy email), hero title "Creative / Developer" + tagline, work section (media column images + desktop index column "Index" + big titles + hover videos), footer metas (`<dl>` Contact email / Available / ©)
- Assets: 10 downloaded (5× featured.webp + 5× featured.mp4 for estrela/yucca/zulik/payjustnow/vineyard)
- Missing yet: exact computed styles, fonts, favicon, hover/scroll behaviors, responsive breakpoints

## Existing routes
All preserved; nothing outside the clone's namespace (route, component root, asset root) will be modified except the plan-approved foundation files listed above.
