# segerman.dev / — Page Topology & Behaviors

Source: chrome-devtools-mcp computed styles + site CSS + JS bundles (app/home/loader/mediamesh).

## Design tokens
- `--c-black: #00031F`, `--c-white: #ffffff`; media placeholder bg `#eee`
- Fonts: `nw` = NewakeRegular.woff (display, uppercase, weight 400), `ag` = AktivGroteskMedium.woff (body, weight 500)
- Desktop (≥1100 fine pointer): html font-size .5787vw → 1rem ≈ 8.33px @1440; `--col: 11.8rem`, `--unit: 2.4rem`, `--ar: 1.736/1`
- Breakpoints: ≤1099/coarse: col 10.5rem unit 2rem; ≤767: col 7.4rem unit 1.6rem

## Desktop layout (fixed viewport, WebGL/Lenis)
- `html,body` position fixed, full screen; `.page` fixed z0; Lenis scroll (html class `lenis`); loader `is-transitioning` blocks pointer events
- `.logo` absolute top var(--unit) left var(--unit); `.nav` absolute top var(--unit) right 7.2rem; `.toggle` 4rem square top 1.2rem right 1.2rem (3D view toggle, NOT theme)
- `.text-wrapper` padding 7.2rem var(--unit) var(--unit); `.overline` above title; `h1.title` nw 10.4rem uppercase lh 80% ls .1rem; `.line:nth-child(1)` mb .8rem; `.text` max-width 40rem
- `#home .work` absolute top 0 right 30.6rem width 54.8rem height 100%; `.projects` stacked, each `.project` 54.8×33.4rem absolute; vertical wrap-carousel driven by wheel→Lenis→scroll
- `.project-index` fixed top 38vh right var(--unit) width var(--col): Index label (1.4rem, mb 1.2rem), right-aligned title list (1.5rem, py .2rem), `.project-videos` width col+unit aspect 1.736
- `.metas.footer-metas` absolute bottom var(--unit) left var(--unit); metas 26rem wide, gap var(--unit); `.meta .label` mb .8rem; `.copyright` bottom right var(--unit)

## Interactions (from JS)
1. **Loader**: circle-mask SVG (inner circle animates --x/--y/--scale loop), % counts to 100, then page intro: canvas opacity 0→1 (1.2s power2.out), reveal timeline, lenis starts ~1.5s.
2. **Intro reveals**: `.work` offset height→0 (1.6s expo.out); project titles reveal stagger `.6+.07*i`; index label .5; toggle .8; copyright .9. Lines reveal via translate (clip) within overflow hidden.
3. **Wheel**: wheel → lenis scroll → carousel position `offset`, meshes wrapped modulo `(scroll%n)`, speed-limited (`5e-5` per px).
4. **Title hover** (mouseenter/.project-title): `titleHoverIndex=i` → `setActive(i)`: video `in()` (uOffsetY→0, currentTime=0, play), mesh scale 1.08 + uHover=1 (0.8s power3.out / 2-3s expo), cursor pointer; mouseleave → inactive (video pause, mesh scale 1).
5. **Click** anywhere (not on a title): navigates to active project's `/work/<slug>`.
6. **Copy email**: nav Contact + footer email button → `copied-active` class on button/meta (pointer-events none), `.copied` "Email copied!" appears (opacity/position anim), clipboard write.
7. **Toggle**: `toggle:start/end` events → back mode: group rotates (rotY -.49, posX -5.3, posZ -14), gap front 2.4→back 8, cursor default; `isToggleTransitioning` guards. (3D — clone approximates.)

## Mobile/tablet (no-WebGL equivalent CSS)
- ≤1099: page-content flex col, padding-top 12rem; projects grid 2col gap unit (≤767: block, item mb 2.8rem); project-index hidden; media-wrapper relative aspect 1.54/1 mb 1.2rem; metas static padding 0 unit.
- ≤767: html font 2.5vw; logo/nav 1.4rem; nav right 5.2rem; toggle 3.6rem; `.meta-available` hidden; metas column-reverse; h1 6.4rem.
