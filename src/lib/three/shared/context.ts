import type * as THREE from 'three';
import type { Scene } from '../scene';
import type { Gallery } from '../gallery/gallery';
import type { RaymarchPlanet } from '../planet/raymarch-planet';

export const BG_ENGINE_CONTEXT = 'bg-engine';

/** Route-persisted WebGL scene/gallery getters for child +page.svelte components. */
export interface BgEngineContext {
	getScene(): Scene | null;
	getGallery(): Gallery | null;
	getReady(): boolean;
	/** Shared Earth instance — /skills drives its orbiting moons via this. */
	getEarthPlanet(): RaymarchPlanet | null;
	/** Cursor-trail dye texture (FluidSim.texture) — SpiralCarousel uses this for per-image reveal. */
	getFluidTexture(): THREE.Texture | null;
	/** Whether dark/immersive mode is active (mode-watcher's mode.current === 'dark'). */
	getIsBackMode(): boolean;
}
