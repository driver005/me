import type { Scene } from './scene';
import type { Gallery } from './gallery';

export const SEGERMAN_BG_CONTEXT = 'segerman-bg';

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
export interface SegermanBgContext {
	getScene(): Scene | null;
	getGallery(): Gallery | null;
	getReady(): boolean;
}
