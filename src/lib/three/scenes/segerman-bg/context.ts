import type { Scene } from './scene';
import type { Gallery } from './gallery';

export const SEGERMAN_BG_CONTEXT = 'segerman-bg';

/** Lets a route persist the WebGL scene/gallery in a parent +layout.svelte while a child +page.svelte
 *  reaches in to add page-specific 3D content (e.g. the Work detail page's media carousel). Getters,
 *  not plain fields, since the layout reassigns `scene`/`gallery` over its own lifecycle. */
export interface SegermanBgContext {
	getScene(): Scene | null;
	getGallery(): Gallery | null;
}
