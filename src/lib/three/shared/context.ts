import type * as THREE from 'three';
import type { Scene } from '../scene';
import type { Gallery } from '../gallery/gallery';
import type { RaymarchPlanet } from '../planet/raymarch-planet';

export const BG_ENGINE_CONTEXT = 'bg-engine';

/** Lets a route persist the WebGL scene/gallery in a parent +layout.svelte while a child +page.svelte
 *  reaches in to add page-specific 3D content (e.g. the Work detail page's media carousel). Getters,
 *  not plain fields, since the layout reassigns `scene`/`gallery` over its own lifecycle.
 *
 *  `getReady()` reads the layout's `webglReady` — an actual `$state` value, unlike `scene`/`gallery`
 *  themselves (deliberately plain `let`s, to avoid Svelte reactivity overhead on objects mutated every
 *  frame). A consuming `$effect` should read `getReady()` alongside whatever route param it cares
 *  about — Svelte 5 tracks a `$state` read as a dependency even through a function call, so this is
 *  what makes the effect re-run once `scene`/`gallery` actually become non-null; depending on the
 *  route param alone risks the effect's first run landing before the layout's `onMount` finishes
 *  assigning them, with nothing to trigger a second run since the param never changes again. */
export interface BgEngineContext {
	getScene(): Scene | null;
	getGallery(): Gallery | null;
	getReady(): boolean;
	/** The shared Earth instance — /skills reaches in to drive its orbiting moons (see
	 *  skill-moons.ts's RaymarchPlanet.setMoons()) the same way Work's media carousel reaches into
	 *  getGallery(). */
	getEarthPlanet(): RaymarchPlanet | null;
	/** The screen-space cursor-trail dye texture (FluidSim.texture) — the SAME texture
	 *  output-fragment.glsl's own tFluid samples to decide how much of the immersive "back" content
	 *  shows through the white "front" layer where the cursor has recently been (see its own
	 *  fluidMask). SpiralCarousel reaches in for this to reproduce that exact reveal per-image
	 *  (spiral-carousel.ts's own fluidTexture option) — images duotone/grayscale by default, colour
	 *  revealed in a circle following the cursor, instead of a page-wide compositor effect. */
	getFluidTexture(): THREE.Texture | null;
	/** Whether the site is in dark/immersive mode — mode-watcher's own `mode.current === 'dark'`,
	 *  driven by the bottom-right Toggle.svelte button (which now flips mode.current directly rather
	 *  than a separate local isBackMode state — mode-watcher already persists it to localStorage, and
	 *  /home reads that same value, so there's one shared setting instead of two independent ones that
	 *  used to disagree). A getter for the same reason getReady() is: Svelte 5 tracks a `$state`/store
	 *  read as a dependency even through a function call, so a child reading this inside its own
	 *  $derived/$effect correctly re-runs when the mode changes. /about's own text color follows this
	 *  directly. */
	getIsBackMode(): boolean;
}
