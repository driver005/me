import * as THREE from 'three';
import { check_weather } from '$lib/weather';
import { Skybox } from './environment/skybox';
import { Lights } from './environment/lights';
import { Room } from './room/room';
import { Rain } from './effects/rain';
import { Smoke } from './effects/smoke';
import { CoffeeSteam } from './effects/coffee-steam';
import { Postprocessing } from './postprocessing';
import { timeStep, logRendererInfo, recordLoopFrame } from './shared/gpu-diagnostics';

/**
 * /home's whole 3D scene, previously sceens/default.svelte + sceens/room.svelte + extra/default.svelte
 * (SkyBox/Camera/Extras/PostProcessing/Ligths/Room, composed declaratively) — one plain class matching
 * the (bg) engine's own style (see src/lib/three/scene.ts): constructed once from a
 * renderer/scene/camera handle, driven by a per-frame `.loop(delta)`, torn down by `.dispose()`.
 * HomeEngineRoot.svelte is the thin Threlte bridge that builds that handle and owns this instance,
 * mirroring EngineRoot.svelte's own relationship to the (bg) engine's `Scene`.
 */
export class HomeScene {
	private renderer: THREE.WebGLRenderer;
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;

	private skybox: Skybox;
	private lights: Lights;
	private room: Room;
	private coffeeSteam: CoffeeSteam;
	private postprocessing: Postprocessing;
	private rain: Rain | null = null;
	private smoke: Smoke | null = null;

	private disposed = false;

	constructor(
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.PerspectiveCamera,
		onReady?: () => void
	) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;

		this.skybox = timeStep('Skybox', () => new Skybox(renderer, scene, camera));
		this.lights = timeStep('Lights', () => new Lights(scene));
		this.postprocessing = timeStep('Postprocessing', () => new Postprocessing(renderer, scene, camera));
		// Only the synchronous constructor cost — the GLTF fetch/parse itself happens later and is
		// timed separately inside room.ts (it's async, so it can't be captured by wrapping the
		// constructor call here). `onReady` fires later still, once every mesh has been revealed and
		// had its shader compiled (see Room's own onFullyRevealed comment) — that's the real "done"
		// moment, well after this constructor returns.
		this.room = timeStep('Room (sync part)', () => new Room(renderer, onReady));
		scene.add(this.room.group);
		this.coffeeSteam = timeStep('CoffeeSteam', () => new CoffeeSteam(scene));

		// Weather-gated rain — see extra/default.svelte's own `{#await weatherPromise}`. check_weather()
		// already swallows its own fetch errors down to a `null` result (never rejects), so there's no
		// separate error path to replicate here.
		check_weather().then((isRaining) => {
			if (this.disposed || !isRaining) return;
			this.rain = new Rain(this.scene);
		});

		this.setFriendly(true);
		logRendererInfo(renderer, 'HomeScene constructed');
	}

	/** Mirrors extra/default.svelte's own `{#if !friendly.value}<Smoke/>{/if}` (mount/unmount, not a
	 *  visibility toggle) and sceens/room.svelte's own joint-mesh visibility. */
	setFriendly(friendly: boolean): void {
		this.room.setFriendly(friendly);

		if (!friendly && !this.smoke) {
			this.smoke = new Smoke(this.scene);
		} else if (friendly && this.smoke) {
			this.smoke.dispose();
			this.smoke = null;
		}
	}

	setDark(isDark: boolean): void {
		this.skybox.setDark(isDark);
		this.lights.setDark(isDark);
		this.rain?.setDark(isDark);
		this.smoke?.setDark(isDark);
		this.postprocessing.setDark(isDark, this.scene);
	}

	setSize(width: number, height: number): void {
		this.skybox.setSize(width, height);
		this.postprocessing.setSize(width, height);
	}

	loop(delta: number): void {
		if (import.meta.env.DEV) {
			// Dev-only per-stage timing — see gpu-diagnostics.ts's own recordLoopFrame() comment for why:
			// a context loss has been reported happening well after load, during steady-state looping, not
			// the startup shader-compile burst every earlier crash investigation focused on.
			const start = performance.now();
			const t0 = performance.now();
			this.skybox.loop(delta);
			const t1 = performance.now();
			this.room.loop(delta);
			const t2 = performance.now();
			this.coffeeSteam.loop(delta);
			const t3 = performance.now();
			this.rain?.loop(delta);
			const t4 = performance.now();
			this.smoke?.loop(delta);
			const t5 = performance.now();
			this.postprocessing.render();
			const t6 = performance.now();

			recordLoopFrame({
				delta,
				skybox: t1 - t0,
				room: t2 - t1,
				coffeeSteam: t3 - t2,
				rain: t4 - t3,
				smoke: t5 - t4,
				postprocess: t6 - t5,
				total: t6 - start
			});
			return;
		}

		this.skybox.loop(delta);
		this.room.loop(delta);
		this.coffeeSteam.loop(delta);
		this.rain?.loop(delta);
		this.smoke?.loop(delta);
		this.postprocessing.render();
	}

	dispose(): void {
		this.disposed = true;
		this.skybox.dispose();
		this.lights.dispose();
		this.scene.remove(this.room.group);
		this.room.dispose();
		this.coffeeSteam.dispose();
		this.postprocessing.dispose();
		this.rain?.dispose();
		this.smoke?.dispose();
	}
}
