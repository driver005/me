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

/** /home's whole 3D scene — constructed once from a renderer/scene/camera handle, driven by a
 *  per-frame `.loop(delta)`, torn down by `.dispose()`. HomeEngineRoot.svelte owns this instance. */
export class HomeScene {
	private renderer: THREE.WebGLRenderer;
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;

	private skybox: Skybox | null = null;
	private lights: Lights | null = null;
	private room: Room;
	private coffeeSteam: CoffeeSteam | null = null;
	private postprocessing: Postprocessing | null = null;
	private rain: Rain | null = null;
	private smoke: Smoke | null = null;

	private disposed = false;
	// False until compileAsync() below resolves — loop() skips rendering entirely until then, so the
	// GPU's first real draw call happens once every material's shader is already compiled instead of
	// triggering that compilation inline. See buildRestOfScene()'s own comment for why.
	private renderReady = false;
	// onReady (hides routes/home/+page.svelte's loading overlay) fires the first time loop() actually
	// renders a frame, not merely when renderReady flips true — those aren't the same moment, since the
	// render throttle below (loop() can return before rendering on the very frame renderReady flips)
	// means a frame or two can pass in between. Firing on renderReady alone let the overlay disappear
	// before skybox/lights had actually been drawn even once.
	private onReadyCallback?: () => void;
	private firstRenderDone = false;

	// Set immediately after construction, before buildRestOfScene() has run — reapplied there once
	// skybox/lights/postprocessing actually exist.
	private isDark = false;
	private size = { width: 0, height: 0 };

	constructor(
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.PerspectiveCamera,
		onReady?: () => void
	) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
		this.onReadyCallback = onReady;

		// Model loads first; skybox/lights/postprocessing/coffee steam build only once it's done (see
		// buildRestOfScene()) — spreads the two shader-compile bursts apart instead of racing them.
		this.room = timeStep('Room (sync part)', () => new Room(renderer, () => this.buildRestOfScene()));
		scene.add(this.room.group);

		this.setFriendly(true);
	}

	private async buildRestOfScene(): Promise<void> {
		if (this.disposed) return;

		this.skybox = timeStep('Skybox', () => new Skybox(this.renderer, this.scene, this.camera));
		this.lights = timeStep('Lights', () => new Lights(this.scene));
		this.postprocessing = timeStep('Postprocessing', () => new Postprocessing(this.renderer, this.scene, this.camera));
		this.coffeeSteam = timeStep('CoffeeSteam', () => new CoffeeSteam(this.scene));

		this.skybox.setDark(this.isDark);
		this.lights.setDark(this.isDark);
		this.postprocessing.setDark(this.isDark, this.scene);
		this.skybox.setSize(this.size.width, this.size.height);
		this.postprocessing.setSize(this.size.width, this.size.height);

		check_weather().then((isRaining) => {
			if (this.disposed || !isRaining) return;
			this.rain = new Rain(this.scene);
		});

		// Every material (~40+ distinct programs between the room and skybox/postprocessing) would
		// otherwise get its shader compiled inline on whichever frame renders first — a single-frame
		// compile burst that's been confirmed (via real hardware logs) to crash WebGL context on at
		// least one GPU/driver (Mesa Intel UHD 630). compileAsync() uses KHR_parallel_shader_compile
		// where available so the driver compiles off the critical path, and loop() below doesn't render
		// anything until this resolves — so the first real draw call finds everything already compiled.
		if (import.meta.env.DEV) console.time('[timing] compileAsync');
		await this.renderer.compileAsync(this.scene, this.camera);
		if (import.meta.env.DEV) console.timeEnd('[timing] compileAsync');
		if (this.disposed) return;

		this.renderReady = true;
		logRendererInfo(this.renderer, 'HomeScene rest-of-scene built');
		this.requestRender();
	}

	setFriendly(friendly: boolean): void {
		this.room.setFriendly(friendly);

		if (!friendly && !this.smoke) {
			this.smoke = new Smoke(this.scene);
		} else if (friendly && this.smoke) {
			this.smoke.dispose();
			this.smoke = null;
		}

		this.requestRender();
	}

	setDark(isDark: boolean): void {
		this.isDark = isDark;
		this.skybox?.setDark(isDark);
		this.lights?.setDark(isDark);
		this.rain?.setDark(isDark);
		this.smoke?.setDark(isDark);
		this.postprocessing?.setDark(isDark, this.scene);
		this.requestRender();
	}

	setSize(width: number, height: number): void {
		this.size = { width, height };
		this.skybox?.setSize(width, height);
		this.postprocessing?.setSize(width, height);
		this.requestRender();
	}

	// postprocessing.render() is the whole scene draw + bloom/tone mapping/grading chain — the most
	// expensive thing here — throttled to 1/RENDER_INTERVAL fps (30) instead of running every frame.
	// room.loop()/coffeeSteam.loop() (mixer/clock hands/particles) still update every frame regardless
	// — cheap, CPU-side — so their motion is only ever as smooth as the 10fps render, not frozen between
	// renders the way it would be under a purely on-demand (camera-move-triggered) scheme.
	private static readonly RENDER_INTERVAL = 1 / 30;
	private renderAccum = 0;

	/** Renders immediately and resets the throttle accumulator — for setDark()/setSize()/the initial
	 *  paint, where waiting up to RENDER_INTERVAL for the next throttled frame would read as a stall. */
	requestRender(): void {
		if (!this.renderReady) return;
		this.renderAccum = 0;
		this.renderFrame();
	}

	private renderFrame(): void {
		if (import.meta.env.DEV) {
			const start = performance.now();
			this.postprocessing?.render();
			const end = performance.now();
			recordLoopFrame({
				delta: 0,
				skybox: 0,
				room: 0,
				coffeeSteam: 0,
				rain: 0,
				smoke: 0,
				postprocess: end - start,
				total: end - start
			});
		} else {
			this.postprocessing?.render();
		}

		if (!this.firstRenderDone) {
			this.firstRenderDone = true;
			this.onReadyCallback?.();
		}
	}

	loop(delta: number): void {
		if (!this.renderReady) return;
		this.room.loop(delta);
		this.coffeeSteam?.loop(delta);

		this.renderAccum += delta;
		if (this.renderAccum < HomeScene.RENDER_INTERVAL) return;
		this.renderAccum %= HomeScene.RENDER_INTERVAL;
		this.renderFrame();
	}

	dispose(): void {
		this.disposed = true;
		this.skybox?.dispose();
		this.lights?.dispose();
		this.scene.remove(this.room.group);
		this.room.dispose();
		this.coffeeSteam?.dispose();
		this.postprocessing?.dispose();
		this.rain?.dispose();
		this.smoke?.dispose();
	}
}
