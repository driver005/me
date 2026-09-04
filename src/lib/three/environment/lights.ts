import * as THREE from 'three';

/** Light/dark presets — ported straight from ligths/default.svelte's own two `{#if mode.current}`
 *  branches (key/fill directional pair + one ambient, per mode). */
const LIGHT_MODE = [
	new THREE.DirectionalLight('#fff5e0', 1.5),
	new THREE.DirectionalLight('#c8d8ff', 0.4),
	new THREE.AmbientLight('#fffaf0', 0.3)
] as const;
LIGHT_MODE[0].position.set(10, 20, 10);
LIGHT_MODE[1].position.set(-8, 8, -6);

// Bumped up from the original 0.4/0.15/0.08 — even after fixing PosterizeEffect's own crushing of
// near-black values (see postprocessing.ts's own comment), dark mode was still reported too dark to
// see the model by. Kept well below light mode's own 1.5/0.4/0.3 to preserve the moodier look, just
// no longer so dim the room reads as unlit.
const DARK_MODE = [
	new THREE.DirectionalLight('#4a6fa5', 0.7),
	new THREE.DirectionalLight('#2a3f6f', 0.28),
	new THREE.AmbientLight('#0d1520', 0.16)
] as const;
DARK_MODE[0].position.set(10, 20, 10);
DARK_MODE[1].position.set(-8, 8, -6);

/** Swaps the whole light rig by mode — matching ligths/default.svelte's own `{#if}`/`{:else}` (one
 *  set of lights exists at a time, not a cross-fade), rather than tweening intensities between two
 *  permanently-present rigs. */
export class Lights {
	private scene: THREE.Scene;
	private isDark = false;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		for (const light of LIGHT_MODE) scene.add(light);
	}

	setDark(isDark: boolean): void {
		if (this.isDark === isDark) return;
		this.isDark = isDark;
		const [outgoing, incoming] = isDark ? [LIGHT_MODE, DARK_MODE] : [DARK_MODE, LIGHT_MODE];
		for (const light of outgoing) this.scene.remove(light);
		for (const light of incoming) this.scene.add(light);
	}

	dispose(): void {
		for (const light of [...LIGHT_MODE, ...DARK_MODE]) this.scene.remove(light);
	}
}
