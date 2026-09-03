import * as THREE from 'three';
import { Layer } from './layer';

/** The minimal shape Compositor actually needs from "whatever the planet is right now" — both
 *  `Planet` (the mesh-based one, kept for /works/[slug]) and `RaymarchPlanet` (jsulpis's shader,
 *  everywhere else) already satisfy this without any changes to either class. */
export interface PlanetSource {
	texture: THREE.Texture;
	blurTexture: THREE.Texture;
	loop(): void;
	dispose(): void;
}

/**
 * Compositor holds one stable reference to this for its whole lifetime (its own `tPlanet`/
 * `tPlanetBlur` come from `.texture`/`.blurTexture` here) — the route layout swaps which real planet
 * is "active" underneath it as navigation changes which page's planet should show, without
 * Compositor itself ever needing to know that happened. Swapping does NOT dispose the outgoing
 * source — the route layout owns each source's lifecycle (the persistent mesh Planet is never
 * disposed at all; a route-scoped RaymarchPlanet gets disposed by whoever constructed it, on its own
 * page's teardown).
 *
 * Extends Layer (like the mesh Planet itself) purely so `scene.addLayer()` accepts it — its own
 * `loop()`, like Planet's, always renders unconditionally rather than using Layer's dirty-gating,
 * since whichever planet is active animates every frame regardless.
 */
export class PlanetSwitcher extends Layer implements PlanetSource {
	private active: PlanetSource | null = null;
	private placeholder = new THREE.WebGLRenderTarget(1, 1).texture;

	constructor(isTouch: boolean) {
		super(isTouch);
	}

	get texture(): THREE.Texture {
		return this.active?.texture ?? this.placeholder;
	}

	get blurTexture(): THREE.Texture {
		return this.active?.blurTexture ?? this.placeholder;
	}

	setActive(source: PlanetSource | null): void {
		this.active = source;
	}

	/** Identity of whatever's currently active — e.g. +layout.svelte's handleCanvasClick compares this
	 *  against its own `earthPlanet` reference to decide whether a click should hit-test against it
	 *  (RaymarchPlanet.raycastHit()) for the "click Earth -> /about" redirect, without needing its own
	 *  route-name special-casing to know which routes currently show Earth. */
	get activeSource(): PlanetSource | null {
		return this.active;
	}

	render(): void {
		this.active?.loop();
	}

	loop(): void {
		this.render();
	}

	dispose(): void {
		this.placeholder.dispose();
	}
}
