# Scaffolding → SvelteKit 1:1 Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all simplified Svelte component implementations with pixel-accurate ports of the React scaffolding at `scafholding/src/components/`, and reorder `+page.svelte` to match `App.js` exactly.

**Architecture:** Each scaffolding React component is ported 1:1 to its Svelte counterpart in `src/lib/ui/module/`. Framer Motion scroll hooks become `$effect` + manual scroll listeners. Spring animations use `svelte-motion`. `+page.svelte` reordered to match App.js.

**Tech Stack:** SvelteKit 2, Svelte 5 runes (`$state`, `$effect`, `$props`), Tailwind CSS v3, `svelte-motion`, Three.js, Lenis smooth scroll.

**Scaffolding source:** All React originals live at `scafholding/src/components/<Name>.jsx`. Read the React source before implementing each task — it is the authoritative design reference.

---

## Task 1: Page structure + CSS foundation

**Files:**
- Modify: `src/routes/+page.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Rewrite `+page.svelte` to match `App.js` exactly**

Replace the full file content:

```svelte
<script lang="ts">
  import SmoothScroll from '$lib/ui/module/smooth-scroll.svelte';
  import Cursor from '$lib/ui/module/cursor.svelte';
  import ScrollProgress from '$lib/ui/module/scroll-progress.svelte';
  import Nav from '$lib/ui/module/nav.svelte';
  import Hero from '$lib/ui/module/hero.svelte';
  import About from '$lib/ui/module/about.svelte';
  import Gallery from '$lib/ui/module/gallery.svelte';
  import Works from '$lib/ui/module/works.svelte';
  import Spiral from '$lib/ui/module/spiral.svelte';
  import Services from '$lib/ui/module/services.svelte';
  import HorizontalScroll from '$lib/ui/module/horizontal-scroll.svelte';
  import Contact from '$lib/ui/module/contact.svelte';
  import Footer from '$lib/ui/module/footer.svelte';
  import Divider from '$lib/ui/module/divider.svelte';

  const CREAM = '#F3F2EE';
  const DARK = '#0A0A0A';
</script>

<SmoothScroll>
  <div class="App grain min-h-screen bg-[#F3F2EE] text-[#0A0A0A]">
    <Cursor />
    <ScrollProgress />
    <Nav />
    <main>
      <Hero />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <About />
      <!-- <Divider from={CREAM} to={DARK} /> -->
      <Gallery />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <Works />
      <!-- <Divider from={CREAM} to={DARK} /> -->
      <Spiral />
      <!-- <Divider from={DARK} to={CREAM} /> -->
      <Services />
      <HorizontalScroll />
      <Contact />
    </main>
    <Footer />
  </div>
</SmoothScroll>
```

- [ ] **Step 2: Add missing CSS utility to `src/app.css`**

Find the `.rfm-marquee-container` block (or add it near the marquee reset section). Add:

```css
/* Marquee reset — prevents horizontal overflow from react-fast-marquee */
.rfm-marquee-container {
  overflow: hidden;
}
```

- [ ] **Step 3: Verify in browser**

Run `yarn dev`. Open http://localhost:5173. Confirm:
- Page renders without JS errors in console
- Component order visible in DOM: Hero → About → Gallery → Works → Spiral → Services → HorizontalScroll → Contact → Footer
- No StarField, GhostBackground, or PandaScene rendered

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte src/app.css
git commit -m "feat: reorder page sections to match App.js, drop non-scaffolding components"
```

---

## Task 2: Divider component

**Files:**
- Modify: `src/lib/ui/module/divider.svelte`
- Reference: `scafholding/src/components/Divider.jsx`

The current Svelte divider is a simple border. The scaffolding uses a `GradientEngine` class that generates a 15-stop non-linear gradient using `easeInOutSine`.

- [ ] **Step 1: Rewrite `divider.svelte`**

```svelte
<script lang="ts">
  let {
    from = '#F3F2EE',
    to = '#0A0A0A',
    height = 200,
  }: { from?: string; to?: string; height?: number } = $props();

  function hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  function buildGradient(from: string, to: string, steps = 15): string {
    const [fr, fg, fb] = hexToRgb(from);
    const [tr, tg, tb] = hexToRgb(to);

    const stops = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const t = easeInOutSine(progress);
      const r = Math.round(fr + (tr - fr) * t).toString(16).padStart(2, '0');
      const g = Math.round(fg + (tg - fg) * t).toString(16).padStart(2, '0');
      const b = Math.round(fb + (tb - fb) * t).toString(16).padStart(2, '0');
      return `#${r}${g}${b} ${(progress * 100).toFixed(1)}%`;
    });

    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }

  const gradient = $derived(buildGradient(from, to));
</script>

<div
  aria-hidden="true"
  style:height="{height}px"
  style:background={gradient}
  style:pointer-events="none"
/>
```

- [ ] **Step 2: Verify gradient renders**

Temporarily uncomment a `<Divider from={DARK} to={CREAM} />` in `+page.svelte`. Confirm a smooth multi-stop gradient appears between sections, not a hard border or simple two-stop gradient.

- [ ] **Step 3: Re-comment dividers, commit**

```bash
git add src/lib/ui/module/divider.svelte
git commit -m "feat: port Divider with GradientEngine 15-stop easeInOutSine gradient"
```

---

## Task 3: ScrambleText component

**Files:**
- Modify: `src/lib/ui/module/scramble-text.svelte`
- Reference: `scafholding/src/components/ScrambleText.jsx`

Current Svelte version auto-plays on mount with `setInterval`. Scaffolding is **hover-triggered** RAF with per-character queue.

- [ ] **Step 1: Rewrite `scramble-text.svelte`**

```svelte
<script lang="ts">
  let { text = '', class: className = '', style = '' }: {
    text: string;
    class?: string;
    style?: string;
  } = $props();

  const CHARS = '!<>-_\\/[]{}—=+*^?#________';

  let display = $state(text);
  let frame = 0;
  let queue: Array<{ from: string; to: string; start: number; end: number; char: string }> = [];
  let rafId: number | null = null;

  $effect(() => {
    display = text;
  });

  function randChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (frame >= item.end) {
        complete++;
        output += item.to;
      } else if (frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = randChar();
        }
        output += `<span class="opacity-70">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }
    display = output;
    if (complete === queue.length) {
      rafId = null;
      return;
    }
    frame++;
    rafId = requestAnimationFrame(update);
  }

  function scramble(target: string) {
    const old = display.replace(/<[^>]+>/g, '');
    const length = Math.max(old.length, target.length);
    queue = Array.from({ length }, (_, i) => ({
      from: old[i] ?? '',
      to: target[i] ?? '',
      start: Math.floor(Math.random() * 18),
      end: Math.floor(Math.random() * 18) + Math.floor(Math.random() * 18) + 6,
      char: '',
    }));
    if (rafId) cancelAnimationFrame(rafId);
    frame = 0;
    update();
  }

  function onEnter() { scramble(text); }
  function onLeave() { scramble(text); }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class={className}
  {style}
  onmouseenter={onEnter}
  onmouseleave={onLeave}
>
  {@html display}
</span>
```

- [ ] **Step 2: Verify hover behavior**

Open browser. Hover over nav links (which use `ScrambleText`). Characters should scramble through random glyphs and settle. No animation on page load — only on hover.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui/module/scramble-text.svelte
git commit -m "feat: port ScrambleText to hover-driven RAF queue animation"
```

---

## Task 4: CountUp minor update

**Files:**
- Modify: `src/lib/ui/module/count-up.svelte`
- Reference: `scafholding/src/components/CountUp.jsx`

Add `pad` (zero-padding to match digit count of target) and `suffix` prop.

- [ ] **Step 1: Update `count-up.svelte`**

```svelte
<script lang="ts">
  import { useIntersectionObserver } from '$lib/util/intersection.svelte';

  let {
    value = 100,
    duration = 1400,
    class: className = '',
    suffix = '',
  }: {
    value?: number | string;
    duration?: number;
    class?: string;
    suffix?: string;
  } = $props();

  const target = $derived(parseInt(String(value).replace(/\D/g, ''), 10) || 0);
  const pad = $derived(String(value).match(/^0+/)?.[0]?.length ?? 0);

  let displayValue = $state(0);
  let intersection = useIntersectionObserver({ threshold: 0.6 });

  $effect(() => {
    if (!intersection.isIntersecting) return;
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      displayValue = Math.round(target * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  const padded = $derived(
    String(displayValue)
      .padStart(pad + String(target).length, '0')
      .slice(-Math.max(2, String(target).length))
  );
</script>

<span bind:this={intersection.ref} class={className}>{padded}{suffix}</span>
```

- [ ] **Step 2: Verify**

The `About` component will use this. After porting About (Task 7), confirm numbers like "07+" display correctly with leading zero and suffix.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui/module/count-up.svelte
git commit -m "feat: add pad and suffix props to CountUp"
```

---

## Task 5: Nav update — hide-on-scroll + Berlin time

**Files:**
- Modify: `src/lib/ui/module/nav.svelte`
- Reference: `scafholding/src/components/Nav.jsx`

Current nav is always-visible with `mix-blend-difference`. Scaffolding nav: hidden until 80vh scroll, then hides on scroll-down / shows on scroll-up. Adds Berlin time display. Remove `mix-blend-difference`.

- [ ] **Step 1: Rewrite `nav.svelte`**

```svelte
<script lang="ts">
  import MagneticButton from './magnetic-button.svelte';
  import ScrambleText from './scramble-text.svelte';

  const links = [
    { href: '#work', label: 'Work' },
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#contact', label: 'Contact' },
  ];

  let open = $state(false);
  let show = $state(false);
  let time = $state('');

  $effect(() => {
    let lastY = window.scrollY;
    const threshold = window.innerHeight * 0.8;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < threshold) {
        show = false;
      } else {
        if (y < lastY - 2) show = true;
        else if (y > lastY + 2) show = false;
      }
      lastY = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  $effect(() => {
    const tick = () => {
      const d = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Berlin',
      };
      time = `BER ${d.toLocaleTimeString('en-GB', opts)}`;
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  });
</script>

{#if show}
  <header
    data-testid="site-nav"
    class="fixed top-0 left-0 right-0 z-50 bg-[#F3F2EE]/90 backdrop-blur-sm border-b border-black
           animate-[slideDown_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]"
    style="animation: slideDown 0.5s cubic-bezier(0.22,1,0.36,1) forwards;"
  >
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to   { transform: translateY(0); }
      }
    </style>

    <div class="flex items-center justify-between px-4 sm:px-8 h-14">
      <a href="#top" class="font-mono text-sm font-bold tracking-tighter flex items-center gap-2">
        <span class="inline-block h-2 w-2 bg-[#FF3B00] rounded-full"></span>
        ALEX CARTER©
      </a>

      <nav class="hidden md:flex items-center gap-8">
        {#each links as l}
          <a
            href={l.href}
            class="font-mono text-xs uppercase tracking-[0.2em] group relative overflow-hidden inline-flex flex-col"
            style="height:1.1em;line-height:1.1em"
          >
            <span class="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
              {l.label}
            </span>
            <span class="block absolute inset-x-0 top-full transition-transform duration-300 ease-out group-hover:-translate-y-full text-[#FF3B00]">
              {l.label}
            </span>
          </a>
        {/each}
      </nav>

      <div class="hidden md:flex items-center gap-4">
        <span class="hidden lg:flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#22c55e]">Open</span>
        </span>
        <span class="font-mono text-xs uppercase tracking-[0.2em] text-[#555]">{time}</span>
        <MagneticButton strength={0.4}>
          <a
            href="mailto:hello@alexcarter.studio"
            class="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00] transition-colors inline-block"
          >
            Let's Talk →
          </a>
        </MagneticButton>
      </div>

      <button
        class="md:hidden font-mono text-xs uppercase tracking-[0.2em] px-3 py-1.5 border border-black"
        onclick={() => (open = !open)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </div>

    {#if open}
      <nav class="md:hidden border-t border-black bg-[#F3F2EE]">
        <div class="flex flex-col p-4 gap-3">
          {#each links as l}
            <a
              href={l.href}
              onclick={() => (open = false)}
              class="font-mono text-sm uppercase tracking-[0.2em] hover:text-[#FF3B00]"
            >
              → {l.label}
            </a>
          {/each}
        </div>
      </nav>
    {/if}
  </header>
{/if}
```

- [ ] **Step 2: Verify**

Scroll down past 80% viewport height. Nav should slide in from top. Scroll down quickly — nav hides. Scroll up — nav reappears. Berlin time shows in top right. Mobile Menu/Close toggle works.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ui/module/nav.svelte
git commit -m "feat: port Nav with hide-on-scroll, Berlin time, slide-in animation"
```

---

## Task 6: Hero component

**Files:**
- Modify: `src/lib/ui/module/hero.svelte`
- Reference: `scafholding/src/components/Hero.jsx`

Current hero is text-only. Scaffolding hero: full-screen video background with scroll-stretch parallax, animated text overlays (line-by-line reveal), a bottom meta strip with marquee, and a noise layer.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Hero.jsx` in full before writing. Note: the React version uses `useScroll` + `useTransform` from framer-motion for parallax on the video element. In Svelte, use `$effect` + `window.scrollY` scroll listener to derive the same transforms.

The `scroll-stretch.svelte.ts` utility at `src/lib/util/scroll-stretch.svelte.ts` provides a `useScrollStretchY` helper — use it for the video scale transform.

- [ ] **Step 2: Rewrite `hero.svelte` matching scaffolding structure**

Key structural requirements (derive exact values from the React source):
- Outer container: `min-h-screen relative overflow-hidden` with `id="top"`
- Video element: absolutely positioned, full coverage, `autoplay muted loop playsinline`, parallax `translateY` and `scale` driven by scroll position
- Noise overlay div: `absolute inset-0 pointer-events-none mix-blend-overlay opacity-30` using `.noise-overlay` class
- Hero title: large `.font-display` text, split into lines for staggered reveal on mount
- Bottom meta strip: grid with left/right text info + marquee scrolling text using existing CSS `marquee` keyframe from `tailwind.config.ts`

Pattern for scroll-driven transform (replace `useScroll`/`useTransform`):

```svelte
<script lang="ts">
  let scrollY = $state(0);
  let videoY = $derived(scrollY * 0.4); // matches React useTransform range

  $effect(() => {
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<video
  style:transform="translateY({videoY}px) scale(1.1)"
  ...
/>
```

- [ ] **Step 3: Verify**

Page load: hero title lines animate in sequentially. Scroll down: video drifts upward (parallax). Bottom marquee scrolls continuously. No video controls visible.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/hero.svelte
git commit -m "feat: port Hero with video parallax, animated title, marquee meta strip"
```

---

## Task 7: About component

**Files:**
- Modify: `src/lib/ui/module/about.svelte`
- Reference: `scafholding/src/components/About.jsx`

Current about is a simple two-column layout. Scaffolding: 7/5 grid split, animated headline (line-by-line reveal), **3D portrait with mouse-tracking parallax** (CSS perspective transforms), SVG depth lines, ISO-style corner labels, CountUp stats.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/About.jsx`. The mouse parallax uses `useMotionValue` + `useSpring` on `rotateX`/`rotateY`. In Svelte, translate this to `$state` tracking mousemove + direct style transforms (or use `svelte-motion`'s `useMotionValue`/`useSpring` if the component uses `Motion` from `svelte-motion`).

Mouse parallax pattern in Svelte:

```svelte
<script lang="ts">
  let rotateX = $state(0);
  let rotateY = $state(0);

  function onMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX = y * -20;
    rotateY = x * 20;
  }

  function onMouseLeave() {
    rotateX = 0;
    rotateY = 0;
  }
</script>

<div
  style:perspective="800px"
  onmousemove={onMouseMove}
  onmouseleave={onMouseLeave}
>
  <div style:transform="rotateX({rotateX}deg) rotateY({rotateY}deg)"
       style:transition="transform 0.3s ease-out">
    <!-- portrait image -->
  </div>
</div>
```

- [ ] **Step 2: Rewrite `about.svelte`**

Key requirements:
- `id="about"` on outer container
- 7/5 grid: left col is text/headline, right col is portrait + SVG depth
- Headline: lines revealed via `IntersectionObserver` with stagger
- `CountUp` components for stats (use the updated component from Task 4)
- ISO corner labels: `absolute` positioned `font-mono text-[10px]` strings at corners of the portrait

- [ ] **Step 3: Verify**

Confirm: portrait tilts on mouse-over. Stats count up when scrolled into view. Headline lines reveal sequentially.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/about.svelte
git commit -m "feat: port About with 3D parallax portrait, CountUp stats, line reveal"
```

---

## Task 8: Works component

**Files:**
- Modify: `src/lib/ui/module/works.svelte`
- Reference: `scafholding/src/components/Works.jsx`

Current works is a simple row list. Scaffolding: project rows with a **cursor-following image trail** — on hover, a stack of 260×300px project images follows the cursor. `ScrambleText` on project names. `text-stroke` class on index numbers.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Works.jsx`. The image trail uses `onMouseMove` to spawn image elements at cursor position with throttling (every ~80ms). Each image fades out and removes itself after ~600ms.

Image trail pattern in Svelte:

```svelte
<script lang="ts">
  interface TrailImage { id: number; x: number; y: number; src: string }
  let images = $state<TrailImage[]>([]);
  let lastSpawn = 0;
  let counter = 0;

  function onMouseMove(e: MouseEvent, src: string) {
    const now = Date.now();
    if (now - lastSpawn < 80) return;
    lastSpawn = now;
    const id = counter++;
    images = [...images, { id, x: e.clientX, y: e.clientY, src }];
    setTimeout(() => {
      images = images.filter(img => img.id !== id);
    }, 600);
  }
</script>

<!-- Fixed image trail layer (outside the scroll container) -->
{#each images as img (img.id)}
  <div
    class="pointer-events-none fixed z-50 w-[260px] h-[300px] overflow-hidden"
    style:left="{img.x - 130}px"
    style:top="{img.y - 150}px"
    style:animation="fadeTrail 0.6s ease-out forwards"
  >
    <img src={img.src} alt="" class="w-full h-full object-cover" />
  </div>
{/each}
```

Add to `app.css`:
```css
@keyframes fadeTrail {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.95) translateY(-10px); }
}
```

- [ ] **Step 2: Rewrite `works.svelte`**

Key requirements:
- `id="work"` on outer container
- Project rows: border-top rule, index number with `.text-stroke` class, project name with `ScrambleText`, year + tags
- Hover on row triggers image trail at cursor position
- List at least 4 sample projects (or pull from a `const projects` array at top of file)

- [ ] **Step 3: Verify**

Hover over a project row. Image trail follows cursor, fades out. Project name scrambles on hover.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/works.svelte src/app.css
git commit -m "feat: port Works with cursor image trail and ScrambleText hover"
```

---

## Task 9: Services component

**Files:**
- Modify: `src/lib/ui/module/services.svelte`
- Reference: `scafholding/src/components/Services.jsx`

Current services is a simple card grid. Scaffolding: marquee heading with `text-stroke` outline style, service cards with **border-line fill on hover**, tag lists, stagger reveal animations.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Services.jsx`. The marquee heading uses `react-fast-marquee` — use the existing CSS `marquee` keyframe from `tailwind.config.ts` instead (no library needed):

```svelte
<div class="overflow-hidden border-y border-black py-4">
  <div
    class="flex gap-16 whitespace-nowrap"
    style="animation: marquee 20s linear infinite; --gap: 4rem;"
  >
    {#each Array(6) as _}
      <span class="font-display text-5xl text-stroke">SERVICES</span>
      <span class="font-display text-5xl">✦</span>
    {/each}
  </div>
</div>
```

Border-line fill hover: a pseudo-element that expands from 0 to 100% width on hover.

```svelte
<style>
  .service-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    width: 0;
    background: #FF3B00;
    transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .service-card:hover::after { width: 100%; }
  .service-card:hover { background: #0A0A0A; color: #F3F2EE; }
</style>
```

- [ ] **Step 2: Rewrite `services.svelte`**

Key requirements:
- `id="services"` on outer container
- Marquee heading row
- Service cards in a grid: each card has title, description, tag pills, hover color flip + border fill
- Stagger reveal: use `IntersectionObserver` + CSS `animation-delay` per card

- [ ] **Step 3: Verify**

Marquee scrolls continuously. Hover over a service card: background flips to black, text to cream, orange underline fills in.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/services.svelte
git commit -m "feat: port Services with marquee heading and hover fill cards"
```

---

## Task 10: Contact component

**Files:**
- Modify: `src/lib/ui/module/contact.svelte`
- Reference: `scafholding/src/components/Contact.jsx`

Current contact is a centered single-column layout. Scaffolding: large scrolling marquee CTA, split-grid layout (main + sidebar with studio address + socials), color-coded contact buttons, magnetic button CTAs.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Contact.jsx`. The top marquee is the same technique as Services. The split grid is a 2-column layout: left large CTA area, right sidebar with contact info.

- [ ] **Step 2: Rewrite `contact.svelte`**

Key requirements:
- `id="contact"` on outer container
- Full-width marquee CTA row at top (e.g. "LET'S WORK TOGETHER ✦" repeating)
- Split grid: left col = large headline + magnetic CTA buttons; right col = studio address, email, social links, availability status
- Color-coded buttons: email (black), phone (accent orange)

```svelte
<div id="contact" class="border-t border-black">
  <!-- Marquee CTA -->
  <div class="overflow-hidden border-b border-black py-6">
    <div class="flex gap-16 whitespace-nowrap"
         style="animation: marquee 18s linear infinite;">
      {#each Array(5) as _}
        <span class="font-display text-6xl">LET'S WORK TOGETHER</span>
        <span class="font-display text-6xl text-[#FF3B00]">✦</span>
      {/each}
    </div>
  </div>

  <!-- Split grid -->
  <div class="grid md:grid-cols-[7fr_5fr] border-b border-black">
    <!-- Left: CTA -->
    <div class="p-8 md:p-16 border-r border-black flex flex-col justify-between gap-12">
      <!-- headline + buttons -->
    </div>
    <!-- Right: sidebar info -->
    <div class="p-8 flex flex-col gap-8">
      <!-- address, email, socials -->
    </div>
  </div>
</div>
```

- [ ] **Step 3: Verify**

Top marquee scrolls. Layout splits into 2 columns on desktop. CTA buttons use MagneticButton. Right sidebar shows contact info.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/contact.svelte
git commit -m "feat: port Contact with marquee CTA, split grid layout, sidebar info"
```

---

## Task 11: Footer component

**Files:**
- Modify: `src/lib/ui/module/footer.svelte`
- Reference: `scafholding/src/components/Footer.jsx`

Current footer is a simple 2-column layout. Scaffolding: large name with **clip-path scroll-fill reveal** (text starts as outline, fills in as you scroll into view), grid info columns (copyright, Berlin time, tech stack, back-to-top), scroll progress tracking.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Footer.jsx`. The clip-path reveal: a filled text element is clipped by `inset(0 100% 0 0)` and the right value animates to `0%` based on scroll position.

Clip-path fill pattern:

```svelte
<script lang="ts">
  let fillPercent = $state(100); // 100 = fully clipped (invisible)

  $effect(() => {
    const footer = document.getElementById('footer');
    if (!footer) return;

    const onScroll = () => {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight;
      // Fill as footer enters viewport
      const progress = 1 - Math.max(0, Math.min(1, rect.top / vh));
      fillPercent = Math.round((1 - progress) * 100);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<div id="footer" class="relative overflow-hidden">
  <!-- Outline version (always visible) -->
  <span class="font-display text-stroke" style="font-size: clamp(4rem, 15vw, 12rem);">
    ALEX CARTER
  </span>
  <!-- Filled version, clip-path reveals from left -->
  <span
    class="font-display absolute inset-0"
    style:clip-path="inset(0 {fillPercent}% 0 0)"
    style="font-size: clamp(4rem, 15vw, 12rem);"
  >
    ALEX CARTER
  </span>
</div>
```

- [ ] **Step 2: Rewrite `footer.svelte`**

Key requirements:
- Name reveal section (clip-path fill)
- Grid info row: 4 columns — copyright + year, Berlin live time (same pattern as Nav Task 5), tech stack list, back-to-top link
- `back-to-top` scrolls to `#top`

- [ ] **Step 3: Verify**

Scroll to bottom. Name should fill in from left as footer enters view. Grid info row shows 4 columns. Berlin time ticks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/footer.svelte
git commit -m "feat: port Footer with clip-path name reveal and info grid"
```

---

## Task 12: Gallery minor update

**Files:**
- Modify: `src/lib/ui/module/gallery.svelte`
- Reference: `scafholding/src/components/Gallery.jsx`

Current gallery uses a manual `scrollY` listener. Scaffolding uses `useScroll` from framer-motion on the section element (not window). Align the scroll tracking to the section element.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Gallery.jsx`. The heading parallax: `useScroll({ target: ref })` tracks the section's scroll progress, not the window. Translate: use `IntersectionObserver` to track when section is in view, then track `window.scrollY` relative to the section's `offsetTop`.

- [ ] **Step 2: Update scroll tracking in `gallery.svelte`**

Replace window-level scroll with section-relative tracking:

```svelte
<script lang="ts">
  let sectionEl: HTMLElement;
  let progress = $state(0); // 0 = section at bottom of viewport, 1 = at top

  $effect(() => {
    const onScroll = () => {
      if (!sectionEl) return;
      const rect = sectionEl.getBoundingClientRect();
      const vh = window.innerHeight;
      progress = Math.max(0, Math.min(1, 1 - rect.bottom / (vh + rect.height)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<section id="gallery" bind:this={sectionEl}>
  <!-- heading parallax uses progress -->
</section>
```

- [ ] **Step 3: Verify**

Gallery heading moves at a different rate than scroll (parallax). `InfiniteGallerySection` still renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/gallery.svelte
git commit -m "feat: align Gallery scroll tracking to section element"
```

---

## Task 13: Spiral component

**Files:**
- Modify: `src/lib/ui/module/spiral.svelte`
- Reference: `scafholding/src/components/Spiral.jsx`

Current spiral omits reveal animation and hover states. Scaffolding: PlaneCard mesh system with shader material, **reveal progress animation** (cards appear with scroll), hover expand state, wheel + pointer events.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/Spiral.jsx` in full. Pay attention to:
- The shader `vertexShader` and `fragmentShader` source strings
- The `reveal` uniform that drives card appearance
- The `PlaneCard` mesh setup (geometry size, position along spiral path)
- Wheel event handler that rotates the spiral

- [ ] **Step 2: Rewrite `spiral.svelte`**

Port the Three.js setup from React class-based patterns to Svelte. Use `onMount` for scene initialization and cleanup:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  let canvasEl: HTMLCanvasElement;

  onMount(() => {
    const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(/* values from React source */);
    // ... full Three.js setup copied from React source, translated to imperative JS
    // Key: replace React refs with local variables, replace useFrame with requestAnimationFrame loop

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  });
</script>

<section class="relative w-full" style="height: 100vh;">
  <canvas bind:this={canvasEl} class="w-full h-full" />
</section>
```

- [ ] **Step 3: Verify**

Spiral of cards renders on screen. Scroll into view: cards animate in (reveal). Mouse wheel rotates the spiral. Hover over a card: it expands slightly.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/module/spiral.svelte
git commit -m "feat: port Spiral with reveal animation, hover states, wheel rotation"
```

---

## Task 14: HorizontalScroll component

**Files:**
- Modify: `src/lib/ui/module/horizontal-scroll.svelte`
- Reference: `scafholding/src/components/HorizontalScroll.jsx`

Current horizontal scroll omits the WebGL background shader. Scaffolding: scroll-driven horizontal x translation (Framer Motion → `$effect` + scrollY), `VincentBackground` WebGL shader as a full-section background.

- [ ] **Step 1: Read the scaffolding source**

Read `scafholding/src/components/HorizontalScroll.jsx` in full. The `VincentBackground` is likely a sub-component or inline Three.js setup. Locate it — if it's inline, port it alongside the scroll logic. If separate, port it to `src/lib/ui/module/horizontal-scroll-bg.svelte` and import it.

- [ ] **Step 2: Implement scroll-driven x translation**

The Framer Motion `useScroll + useTransform` translates to:

```svelte
<script lang="ts">
  let sectionEl: HTMLElement;
  let x = $state(0);

  $effect(() => {
    const onScroll = () => {
      if (!sectionEl) return;
      const rect = sectionEl.getBoundingClientRect();
      const vh = window.innerHeight;
      // Map section progress to horizontal travel distance
      const totalHeight = sectionEl.offsetHeight - vh;
      const scrolled = sectionEl.offsetTop - window.scrollY;
      const progress = Math.max(0, Math.min(1, 1 - (scrolled / totalHeight)));
      const totalTravel = /* number of cards × card width */ 3 * 400; // derive from React source
      x = -(progress * totalTravel);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<!-- Sticky container — section is tall, inner content is sticky and translates -->
<section bind:this={sectionEl} style="height: 300vh;">
  <div class="sticky top-0 overflow-hidden" style="height: 100vh;">
    <!-- WebGL background -->
    <!-- Cards translate on x -->
    <div style:transform="translateX({x}px)" class="flex gap-8 absolute top-1/2 -translate-y-1/2">
      <!-- cards -->
    </div>
  </div>
</section>
```

- [ ] **Step 3: Port VincentBackground**

Read the shader source from the React component. Port using Three.js `WebGLRenderer` in an `onMount` (same pattern as Task 13). Canvas is absolutely positioned, `pointer-events: none`, behind the cards.

- [ ] **Step 4: Verify**

Scroll into the horizontal section: cards slide horizontally. WebGL background renders behind the cards. Reaching the end of the cards resumes vertical scroll.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui/module/horizontal-scroll.svelte
git commit -m "feat: port HorizontalScroll with scroll-driven x translation and WebGL bg"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Page structure reorder (Task 1)
- ✅ CSS `.rfm-marquee-container` (Task 1)
- ✅ Divider GradientEngine (Task 2)
- ✅ ScrambleText hover RAF (Task 3)
- ✅ CountUp pad/suffix (Task 4)
- ✅ Nav Berlin time + hide-on-scroll (Task 5)
- ✅ Hero video + scroll-stretch (Task 6)
- ✅ About 3D parallax + CountUp stats (Task 7)
- ✅ Works image trail (Task 8)
- ✅ Services marquee + hover fill (Task 9)
- ✅ Contact marquee CTA + split grid (Task 10)
- ✅ Footer clip-path reveal (Task 11)
- ✅ Gallery scroll alignment (Task 12)
- ✅ Spiral reveal + hover (Task 13)
- ✅ HorizontalScroll x translation + WebGL bg (Task 14)
- ✅ home/ route untouched (not in plan = no tasks touch it)
- ✅ smooth-scroll, cursor, scroll-progress, magnetic-button kept as-is (not in plan)

**Type consistency:** `CountUp` updated in Task 4 with `value: number | string` — About in Task 7 uses it. `ScrambleText` updated in Task 3 with `text: string` — Nav Task 5 and Works Task 8 use it. All consistent.

**No placeholders remaining.**
