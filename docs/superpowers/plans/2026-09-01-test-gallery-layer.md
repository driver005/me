# `/test` Gallery Layer (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real, interactive horizontal-scroll project gallery (5 cards, warp shader, hover raycast, video-on-hover, dual front/back image render pass) to `/test`, replacing the `tImagesBack`/`tImagesBackBloom`/`tImagesFront`/`tVideo` placeholder textures phase 1/2a left in `Compositor`/`Front`.

**Architecture:** Two new mesh classes (`Card`, `VideoCard`) managed by a `Gallery` orchestrator (port of Home.js's scroller class `D`), plus two new render-target-producing `Layer` subclasses (`Images`, `Video`) following the same pattern as `Stars`/`Fog`/`Planet`. `Images` renders the gallery's card scene **twice per frame** (once per `uImageMode`) to match the original's dual color-grading pass.

**Tech Stack:** Same as prior phases — Three.js `^0.182.0`, SvelteKit 2/Svelte 5, `vite-plugin-glsl`, `npm run check`, GSAP (already a project dependency, used identically to how `Planet`'s crack-hover and other phase-1 animations don't currently use it, but this plan's hover tweens do — confirm `gsap` is importable the same way other Svelte components in this repo already import it, e.g. `src/lib/design/module/spiral.svelte` or similar — if not already a direct dependency accessible from `src/lib/three/scenes/segerman-bg/`, `import gsap from 'gsap';` works the same as anywhere else in this SvelteKit project).

**Spec:** `docs/superpowers/specs/2026-09-01-test-gallery-layer-design.md`

## Global Constraints

- Source: `static/sites/segerman-dev-86ede42f/root-7944de32/js/home-pretty.txt` (classes `_`/`B`/`D` — the per-card mesh, video wrapper, and scroller orchestrator) and `static/sites/segerman-dev-86ede42f/root-7944de32/js/video.BlQOh9uf.js` (the image/video fragment shaders — freshly fetched and saved into the local scrape mirror this session, confirmed matching the live build).
- GLSL extraction procedure (unchanged from prior phases): search for the given anchor, copy the entire enclosing backtick-delimited template literal verbatim.
- `.glsl` imports into `.ts` need `// @ts-ignore` (established convention).
- Continuously-animated layers override `loop()` to unconditionally `render()` every frame (established convention).
- **Coordinate-system note (read before Task 2):** the original site's `Card`/`Gallery` meshes live in the same Three.js scene/camera space as `Planet` (`fov 50`, `camera.position.z = 100`, giving a frustum height at `z=0` of ≈93.3 world units — matches `Planet`'s own radius of 93). The original sizes cards and gaps from CSS/DOM measurements (`54.8rem` × `33.4rem` project elements, `A(2.4)`/`A(8)` rem-based gaps) that don't exist in this port (no DOM layout). This plan derives comparable **world-unit** sizes directly in that same ≈93-unit-frustum space: card size `52 × 32` (matching the original's ~1.64 aspect ratio), gap `26.7` (front) / `89` (back) — computed once, documented here, not re-derived per task. These are real, principled starting values (not placeholders) — Task 8's visual verification may prompt tuning, which is expected and fine.
- **Scroll input is a temporary substitute for Lenis** (not built yet, deferred to a future phase) — a minimal wheel-event accumulator, explicitly called out in Task 5 as throwaway-when-Lenis-lands, not permanent architecture.
- No click-through navigation — dropped entirely (no other routes exist in this port).
- Titles/Texts stay on their existing placeholders — this plan never touches `tTitles`/`tTitlesSoft`/`tTitlesBlur`/`tTexts`.

---

## File Structure

```
src/lib/three/scenes/segerman-bg/
  card.ts               — new: Card mesh (port of `_`)
  video-card.ts           — new: VideoCard mesh (port of `B`)
  gallery.ts                — new: Gallery orchestrator (port of `D`)
  images.ts                  — new: Images layer (port of `He`), dual-pass
  video.ts                    — new: Video layer (port of `Oe`)
  types.ts                     — modified: add uCurveX/uCurveZ to SceneUniforms
  scene.ts                      — modified: set uCurveX/uCurveZ default values
  front.ts                       — modified: wire tImagesFront/tVideo to real layers
  compositor.ts                   — modified: wire tImagesBack/tImagesBackBloom/tVideo to real layers

src/lib/shaders/segerman-bg/
  card/vertex.glsl         — new: verbatim extraction of `q` (warp/CRT-curve shader)
  card/fragment.glsl        — new: verbatim extraction of `n`/`i` (image fragment)
  video-card/fragment.glsl   — new: verbatim extraction of `e`/`v` (video fragment)

static/textures/segerman-bg/work/  — new: 5 copied project images
static/videos/segerman-bg/work/     — new: 5 copied project videos
```

---

### Task 1: Shared uniforms + project assets

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/types.ts`
- Modify: `src/lib/three/scenes/segerman-bg/scene.ts`

**Interfaces:**
- Produces: `SceneUniforms.uCurveX: { value: number }`, `SceneUniforms.uCurveZ: { value: number }` — Task 2's `Card` reads these by shared reference.

- [ ] **Step 1: Add the two uniforms to `SceneUniforms`**

In `src/lib/three/scenes/segerman-bg/types.ts`, add to the `SceneUniforms` interface:

```typescript
	uCurveX: { value: number };
	uCurveZ: { value: number };
```

- [ ] **Step 2: Set their default values in `Scene`**

In `src/lib/three/scenes/segerman-bg/scene.ts`'s constructor `uniforms` object literal, add (matching `world.js`'s `initUniforms()` values — search anchor `uCurveX:{value:5e-5},uCurveZ:{value:.01}`):

```typescript
			uCurveX: { value: 0.00005 },
			uCurveZ: { value: 0.01 }
```

- [ ] **Step 3: Copy the project assets**

```bash
mkdir -p static/textures/segerman-bg/work static/videos/segerman-bg/work
for slug in estrela payjustnow vineyard yucca zulik; do
	cp "static/sites/segerman-dev-86ede42f/root-7944de32/work/${slug}-featured.webp" "static/textures/segerman-bg/work/${slug}.webp"
	cp "static/sites/segerman-dev-86ede42f/root-7944de32/work/${slug}-featured.mp4" "static/videos/segerman-bg/work/${slug}.mp4"
done
ls static/textures/segerman-bg/work/ static/videos/segerman-bg/work/
```

Expected: 5 `.webp` files and 5 `.mp4` files listed.

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/types.ts src/lib/three/scenes/segerman-bg/scene.ts static/textures/segerman-bg/work static/videos/segerman-bg/work
git commit -m "feat(test-bg): add uCurveX/uCurveZ shared uniforms and project assets"
```

---

### Task 2: `Card` mesh (port of `_`)

**Files:**
- Create: `src/lib/shaders/segerman-bg/card/vertex.glsl`
- Create: `src/lib/shaders/segerman-bg/card/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/card.ts`

**Interfaces:**
- Consumes: `Scene.uniforms` (`uMode`, `uCurveX`, `uCurveZ`, `uTime`, `uRes`, `uDpr`).
- Produces: `class Card { constructor(scene: Scene, options: { textureUrl: string; width: number; height: number }); mesh: THREE.Mesh; material: THREE.ShaderMaterial; setActive(): void; setInactive(): void; setImageMode(mode: 0 | 1): void; dispose(): void }` — Task 4 (`Gallery`) constructs and positions instances of this; Task 6 (`Images`) toggles `setImageMode` and renders the meshes.

`Card` is a plain data/mesh holder, not a `Layer` — it doesn't render itself to a target; `Gallery`/`Images` do that by adding its `.mesh` to a scene and rendering that scene.

- [ ] **Step 1: Extract the vertex shader**

Search `static/sites/segerman-dev-86ede42f/root-7944de32/js/home-pretty.txt` for the anchor `var q=` (unique — this is the warp/CRT-curve vertex shader used by every project card). Copy the full enclosing template literal (starts `varying vec2 vUv;`, ends after the `void main() { ... }` body with `uSpeed`/`uProgress`/`uWarp`/`uHover`/`uMode`/`uCurveZ`/`uCurveX` uniforms) verbatim into `src/lib/shaders/segerman-bg/card/vertex.glsl`.

- [ ] **Step 2: Extract the fragment shader**

Search `static/sites/segerman-dev-86ede42f/root-7944de32/js/video.BlQOh9uf.js` for the anchor `uniform float uInputBlack;` (unique). Find the enclosing template literal — it starts with the noise-helper functions (`vec4 permute(vec4 x)...`) and ends at `}` right before `` ,e=`vec4 permute `` (the video fragment's own literal begins immediately after). Copy that entire literal verbatim into `src/lib/shaders/segerman-bg/card/fragment.glsl`.

- [ ] **Step 3: Write `card.ts`**

Ported from class `_` (search anchor in `home-pretty.txt`: `class _ extends W{constructor(t){super(t),this.scene=null,this.scale=1`) combined with `MediaMesh`'s own base uniform set (search anchor in `home-pretty.txt`: `class g extends l{constructor(e)` is NOT the right class — `MediaMesh` is defined in the separately-scraped `mediamesh.js` file; its uniform list is already fully known from this session's own investigation and is reproduced completely below, no further extraction needed).

Geometry: `e.W.mediaGeometry` in the original is `new THREE.PlaneGeometry(1, 1, 30, 30)` (30×30 subdivisions — required for the warp vertex shader's per-vertex curve displacement to look smooth, not faceted; search anchor in `world.js`: `this.mediaGeometry=new P(1,1,30,30)`).

```typescript
// src/lib/three/scenes/segerman-bg/card.ts
import * as THREE from 'three';
import gsap from 'gsap';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import cardVertex from '$lib/shaders/segerman-bg/card/vertex.glsl';
// @ts-ignore
import cardFragment from '$lib/shaders/segerman-bg/card/fragment.glsl';

export interface CardOptions {
	textureUrl: string;
	width: number;
	height: number;
}

export class Card {
	mesh: THREE.Mesh;
	material: THREE.ShaderMaterial;
	private hoverTween: gsap.core.Tween | gsap.core.Timeline | null = null;

	constructor(scene: Scene, options: CardOptions) {
		const geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
		const texture = new THREE.TextureLoader().load(options.textureUrl);
		texture.generateMipmaps = false;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uSpeed: { value: 0 },
				uHover: { value: 0 },
				uProgress: { value: 0 },
				uWarp: { value: 0 },
				uCurveZ: scene.uniforms.uCurveZ,
				uCurveX: scene.uniforms.uCurveX,
				uMode: scene.uniforms.uMode,
				tMap: { value: texture },
				uSizes: { value: new THREE.Vector2(1, 1) },
				uPlaneSizes: { value: new THREE.Vector2(options.width, options.height) },
				uOffsetY: { value: 0 },
				uImageMode: { value: 0 },
				uSaturation: { value: 1 },
				uLightColor: { value: new THREE.Color('#ffffff') },
				uDarkColor: { value: new THREE.Color('#00031f') },
				uInputBlack: { value: 15 },
				uInputWhite: { value: 200 },
				uGamma: { value: 125 },
				uNoiseSize: { value: 3.8 },
				uNoiseAmount: { value: 0.12 },
				uDpr: scene.uniforms.uDpr,
				uRes: scene.uniforms.uRes
			},
			vertexShader: cardVertex,
			fragmentShader: cardFragment,
			transparent: true
		});

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.scale.set(options.width, options.height, 1);
		this.mesh.frustumCulled = false;

		texture.addEventListener('update', () => {
			this.material.uniforms.uSizes.value.set(texture.image.width, texture.image.height);
		});
	}

	/** Which color-grading pass this render is for — Images renders every Card twice per frame, once per mode. */
	setImageMode(mode: 0 | 1): void {
		this.material.uniforms.uImageMode.value = mode;
	}

	setActive(): void {
		this.hoverTween?.kill();
		this.hoverTween = gsap
			.timeline()
			.to(this.mesh.scale, { x: '+=0', duration: 0 }, 0) // placeholder anchor for the scale tween below
			.to(this.mesh, { }, 0);
		// Matches the original's back-mode hover animation: slight scale bump + uHover ramp.
		this.hoverTween = gsap
			.timeline()
			.to(this.mesh.scale, { x: this.mesh.scale.x * 1.08, y: this.mesh.scale.y * 1.08, duration: 0.8, ease: 'power3.out' }, 0)
			.to(this.material.uniforms.uHover, { value: 1, duration: 3, ease: 'expo.out' }, 0);
	}

	setInactive(): void {
		this.hoverTween?.kill();
		const baseScaleX = this.mesh.userData.baseScaleX ?? this.mesh.scale.x / 1.08;
		this.hoverTween = gsap
			.timeline()
			.to(this.mesh.scale, { x: baseScaleX, y: baseScaleX * (this.mesh.scale.y / this.mesh.scale.x), duration: 0.8, ease: 'power3.out' }, 0)
			.to(this.material.uniforms.uHover, { value: 0, duration: 1, ease: 'expo.out' }, 0);
	}

	dispose(): void {
		this.hoverTween?.kill();
		this.mesh.geometry.dispose();
		this.material.dispose();
		(this.material.uniforms.tMap.value as THREE.Texture)?.dispose();
	}
}
```

**Self-correction note for the implementer:** the `setActive()` method above has a stray first `.timeline()` chain (the "placeholder anchor" line) — that was a mistake in this brief's own drafting, not something to transcribe. Write `setActive()` as:

```typescript
	setActive(): void {
		this.hoverTween?.kill();
		this.hoverTween = gsap
			.timeline()
			.to(this.mesh.scale, { x: this.mesh.scale.x * 1.08, y: this.mesh.scale.y * 1.08, duration: 0.8, ease: 'power3.out' }, 0)
			.to(this.material.uniforms.uHover, { value: 1, duration: 3, ease: 'expo.out' }, 0);
	}
```

(single tween chain, not two). Store the mesh's original (pre-hover) scale explicitly rather than dividing by 1.08 repeatedly — add a `private baseScale: THREE.Vector3;` field, set it once in the constructor right after `this.mesh.scale.set(...)` via `this.baseScale = this.mesh.scale.clone();`, and use `this.baseScale.x * 1.08` / `this.baseScale.x` in `setActive()`/`setInactive()` instead of the fragile divide-by-1.08 approach — this avoids compounding rounding error across repeated hover in/out cycles.

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shaders/segerman-bg/card/ src/lib/three/scenes/segerman-bg/card.ts
git commit -m "feat(test-bg): add Card mesh (warped project image, port of _)"
```

---

### Task 3: `VideoCard` mesh (port of `B`, simplified)

**Files:**
- Create: `src/lib/shaders/segerman-bg/video-card/fragment.glsl`
- Create: `src/lib/three/scenes/segerman-bg/video-card.ts`

**Interfaces:**
- Consumes: nothing from `Scene` directly (reuses `card/vertex.glsl` for its own vertex stage — same warp shader, since video cards sit in the same warped-plane system, confirmed by the original's `B`/`MediaMesh` sharing the same vertex shader source `q` across image and video types).
- Produces: `class VideoCard { constructor(scene: Scene, options: { videoUrl: string; width: number; height: number }); mesh: THREE.Mesh; playVideo(): void; pauseVideo(): void; setOffsetIn(): void; setOffsetOut(): void; dispose(): void }` — Task 4 (`Gallery`) constructs, positions, and calls `playVideo()`/`pauseVideo()`/`setOffsetIn()`/`setOffsetOut()` on hover; Task 7 (`Video` layer) renders the meshes.

- [ ] **Step 1: Extract the fragment shader**

Search `static/sites/segerman-dev-86ede42f/root-7944de32/js/video.BlQOh9uf.js` for the anchor `uniform sampler2D tThumb;` (unique). Copy the enclosing template literal (starts with the noise-helper functions, ends at `gl_FragColor = mix(thumb, final, uLoad);\n}` right before the file's `` }`;export{n as i,e as v}; `` close) verbatim into `src/lib/shaders/segerman-bg/video-card/fragment.glsl`.

- [ ] **Step 2: Write `video-card.ts`**

Per the spec's Section 3 simplification: no thumbnail texture, `uLoad` fixed at `1` (the shader's `mix(thumb, final, uLoad)` at `uLoad=1` always resolves to `final`, the video texture — `thumb`/`tThumb` stay bound to the same placeholder-texture pattern used elsewhere, since they're multiplied out but still need *some* bound texture to avoid a WebGL "no texture bound" warning).

```typescript
// src/lib/three/scenes/segerman-bg/video-card.ts
import * as THREE from 'three';
import gsap from 'gsap';
import type { Scene } from './scene';
import { createPlaceholderTexture } from './placeholder-textures';
// @ts-ignore
import cardVertex from '$lib/shaders/segerman-bg/card/vertex.glsl';
// @ts-ignore
import videoFragment from '$lib/shaders/segerman-bg/video-card/fragment.glsl';

export interface VideoCardOptions {
	videoUrl: string;
	width: number;
	height: number;
}

export class VideoCard {
	mesh: THREE.Mesh;
	material: THREE.ShaderMaterial;
	private video: HTMLVideoElement;
	private videoTexture: THREE.VideoTexture;
	private placeholder = createPlaceholderTexture();
	private offsetTween: gsap.core.Tween | null = null;

	constructor(scene: Scene, options: VideoCardOptions) {
		this.video = document.createElement('video');
		this.video.src = options.videoUrl;
		this.video.crossOrigin = 'anonymous';
		this.video.muted = true;
		this.video.loop = true;
		this.video.playsInline = true;
		this.video.preload = 'auto';

		this.videoTexture = new THREE.VideoTexture(this.video);
		this.videoTexture.generateMipmaps = false;
		this.videoTexture.minFilter = THREE.LinearFilter;
		this.videoTexture.magFilter = THREE.LinearFilter;

		const geometry = new THREE.PlaneGeometry(1, 1, 30, 30);

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				tMap: { value: this.videoTexture },
				tThumb: { value: this.placeholder },
				uSizes: { value: new THREE.Vector2(1, 1) },
				uThumbSizes: { value: new THREE.Vector2(1, 1) },
				uPlaneSizes: { value: new THREE.Vector2(options.width, options.height) },
				uOffsetY: { value: 1 },
				uBackMode: { value: 0 },
				uLoad: { value: 1 }
			},
			vertexShader: cardVertex,
			fragmentShader: videoFragment,
			transparent: true
		});

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.scale.set(options.width, options.height, 1);
		this.mesh.frustumCulled = false;

		this.video.addEventListener(
			'loadedmetadata',
			() => {
				this.material.uniforms.uSizes.value.set(this.video.videoWidth, this.video.videoHeight);
			},
			{ once: true }
		);
	}

	/** Reveals the video plane (uOffsetY 1→0, matching the original's B.createInTl) and starts playback. */
	setOffsetIn(): void {
		this.offsetTween?.kill();
		this.offsetTween = gsap.to(this.material.uniforms.uOffsetY, { value: 0, duration: 0.8, ease: 'power3.out' });
		this.video.currentTime = 0;
		this.playVideo();
	}

	/** Hides the video plane (uOffsetY 0→1) and pauses playback. */
	setOffsetOut(): void {
		this.offsetTween?.kill();
		this.offsetTween = gsap.to(this.material.uniforms.uOffsetY, { value: 1, duration: 0.3, ease: 'power3.out' });
		this.pauseVideo();
	}

	playVideo(): void {
		void this.video.play().catch(() => {});
	}

	pauseVideo(): void {
		this.video.pause();
	}

	dispose(): void {
		this.offsetTween?.kill();
		this.pauseVideo();
		this.video.removeAttribute('src');
		this.video.load();
		this.videoTexture.dispose();
		this.placeholder.dispose();
		this.mesh.geometry.dispose();
		this.material.dispose();
	}
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/shaders/segerman-bg/video-card/ src/lib/three/scenes/segerman-bg/video-card.ts
git commit -m "feat(test-bg): add VideoCard mesh (port of B, simplified — no thumbnail crossfade)"
```

---

### Task 4: `Gallery` orchestrator — construction, layout, group transform

**Files:**
- Create: `src/lib/three/scenes/segerman-bg/gallery.ts`

**Interfaces:**
- Consumes: `Card` (Task 2), `VideoCard` (Task 3), `Scene`.
- Produces: `class Gallery { constructor(scene: Scene, projects: { slug: string; textureUrl: string; videoUrl: string }[]); imageScene: THREE.Scene; videoScene: THREE.Scene; update(): void; dispose(): void }` — Task 6 (`Images`) renders `imageScene`, Task 7 (`Video`) renders `videoScene`. Task 5 adds hover raycasting and the entrance timeline to this same class (same file, additive).

This task builds the layout/positioning half of `Gallery`; Task 5 adds interactivity to the same class.

- [ ] **Step 1: Write the constructor and layout logic**

Ported from class `D`'s constructor and `updateItems`/`updateGroup` methods (search anchor in `home-pretty.txt`: `class D extends j{constructor(t){super(t),this.meshes=[]`). Uses the world-unit sizes derived in this plan's Global Constraints (card `52×32`, gap `26.7`/`89`).

```typescript
// src/lib/three/scenes/segerman-bg/gallery.ts
import * as THREE from 'three';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';

export interface ProjectDef {
	slug: string;
	textureUrl: string;
	videoUrl: string;
}

const CARD_WIDTH = 52;
const CARD_HEIGHT = 32;
const GAP_FRONT = 26.7;
const GAP_BACK = 89;

const BACK_STATE = {
	rotationX: 0,
	rotationY: -0.49,
	rotationZ: 0,
	positionX: -5.3,
	positionY: 0,
	positionZ: -14
};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export class Gallery {
	imageScene = new THREE.Scene();
	videoScene = new THREE.Scene();

	cards: Card[] = [];
	videoCards: VideoCard[] = [];

	private scene: Scene;
	private group = new THREE.Group();
	private groupPivot = new THREE.Group();
	private gap = GAP_FRONT;
	/** Raw wheel-accumulated scroll position — see Task 5's temporary scroll-input substitute. */
	scrollPosition = 0;
	private mouseOffset = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };
	private mouseTarget = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };

	constructor(scene: Scene, projects: ProjectDef[]) {
		this.scene = scene;
		this.groupPivot.add(this.group);
		this.imageScene.add(this.groupPivot);

		for (const project of projects) {
			const card = new Card(scene, { textureUrl: project.textureUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.group.add(card.mesh);
			this.cards.push(card);

			const videoCard = new VideoCard(scene, { videoUrl: project.videoUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.videoScene.add(videoCard.mesh);
			this.videoCards.push(videoCard);
		}

		for (let i = 0; i < this.cards.length; i++) {
			this.cards[i].mesh.visible = true;
			this.cards[i].material.uniforms.uProgress.value = 1;
			this.cards[i].material.uniforms.uWarp.value = 1;
		}
	}

	setMouseTarget(nx: number, ny: number): void {
		this.mouseTarget.posX = 0.3 * -nx;
		this.mouseTarget.posZ = 0.1 * -ny;
		this.mouseTarget.rotX = 0.05 * ny;
		this.mouseTarget.rotY = 0.1 * nx;
	}

	private updateItems(): void {
		const uMode = this.scene.uniforms.uMode.value;
		this.gap = lerp(GAP_BACK, GAP_FRONT, uMode);
		const step = CARD_WIDTH + this.gap;
		const totalWidth = step * this.cards.length;
		const wrapped = ((this.scrollPosition % totalWidth) + totalWidth) % totalWidth;

		for (let i = 0; i < this.cards.length; i++) {
			let x = step * i - wrapped;
			x = ((x + totalWidth / 2) % totalWidth + totalWidth) % totalWidth - totalWidth / 2;
			this.cards[i].mesh.position.x = x;
			this.videoCards[i].mesh.position.x = x;
			this.videoCards[i].mesh.position.y = this.cards[i].mesh.position.y;
			this.videoCards[i].mesh.position.z = this.cards[i].mesh.position.z + 0.01;
		}
	}

	private updateGroup(): void {
		const uMode = this.scene.uniforms.uMode.value;
		this.group.rotation.x = lerp(BACK_STATE.rotationX, 0, uMode);
		this.group.rotation.y = lerp(BACK_STATE.rotationY, 0, uMode);
		this.group.rotation.z = lerp(BACK_STATE.rotationZ, 0, uMode);
		this.group.position.x = lerp(BACK_STATE.positionX, 0, uMode);
		this.group.position.y = lerp(BACK_STATE.positionY, 0, uMode);
		this.group.position.z = lerp(BACK_STATE.positionZ, 0, uMode);

		this.mouseOffset.posX = lerp(this.mouseOffset.posX, this.mouseTarget.posX, 0.03);
		this.mouseOffset.posZ = lerp(this.mouseOffset.posZ, this.mouseTarget.posZ, 0.03);
		this.mouseOffset.rotX = lerp(this.mouseOffset.rotX, this.mouseTarget.rotX, 0.03);
		this.mouseOffset.rotY = lerp(this.mouseOffset.rotY, this.mouseTarget.rotY, 0.03);

		const frontness = 1 - uMode;
		this.groupPivot.position.x = this.mouseOffset.posX * frontness;
		this.groupPivot.position.z = this.mouseOffset.posZ * frontness;
		this.groupPivot.rotation.x = this.mouseOffset.rotX * frontness;
		this.groupPivot.rotation.y = this.mouseOffset.rotY * frontness;
	}

	/** Called once per frame by Images/Video layers before rendering — Task 5 adds handleHover() to this same method. */
	update(): void {
		this.updateItems();
		this.updateGroup();
	}

	dispose(): void {
		for (const card of this.cards) card.dispose();
		for (const videoCard of this.videoCards) videoCard.dispose();
	}
}
```

Note: `uMode` here uses the ORIGINAL's own mixing direction (`mix(backCol, frontCol, uMode)` pattern established in phase 1/2a where `uMode=0` is "back") — `lerp(BACK_STATE.x, 0, uMode)` correctly gives the back layout at `uMode=0` and the neutral/front layout at `uMode=1`, matching the phase-2a-corrected default.

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/gallery.ts
git commit -m "feat(test-bg): add Gallery orchestrator — layout + 3D group transform (port of D, part 1)"
```

---

### Task 5: `Gallery` — hover raycasting, entrance timeline, scroll input

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/gallery.ts`

**Interfaces:**
- Consumes: `Scene.camera`, `Scene.uniforms` (`uCurveX`, `uCurveZ`, `uMode`).
- Produces: `Gallery.handleHover(nx: number, ny: number): void`, `Gallery.playEntrance(): void`, `Gallery.attachScrollListener(): void` (called once, wires the temporary wheel accumulator), `Gallery.detachScrollListener(): void` — Task 8's route wiring calls `attachScrollListener()`/`detachScrollListener()` and `playEntrance()`.

This task edits the EXISTING `gallery.ts` from Task 4 — additive, don't restructure what's already there.

- [ ] **Step 1: Add curved-plane hover raycasting**

Ported from `D.handleHover()` (search anchor in `home-pretty.txt`: `handleHover(){if(e.isTouch||!this.meshes?.length)return`). This is NOT a standard `THREE.Raycaster.intersectObjects()` call — it's a custom screen-space bounding-box test accounting for the warp shader's curve displacement, then closest-hit (`z` distance) selection.

Add these fields to the `Gallery` class (alongside the existing ones):

```typescript
	private hoveredIndex: number | null = null;
	private _v = new THREE.Vector3();
	private _hitV = new THREE.Vector3();
	private _camMV = new THREE.Matrix4();
```

Add this method:

```typescript
	handleHover(mouseNX: number, mouseNY: number): void {
		this.groupPivot.updateMatrixWorld(true);
		const camera = this.scene.camera;
		const uMode = this.scene.uniforms.uMode.value;
		const curveX = this.scene.uniforms.uCurveX.value;
		const curveZ = this.scene.uniforms.uCurveZ.value;
		const frontness = Math.abs(1 - uMode);
		const crtStrength = -1.85;

		let closestIndex: number | null = null;
		let closestZ = Infinity;

		for (let i = 0; i < this.cards.length; i++) {
			const mesh = this.cards[i].mesh;
			if (!mesh.visible) continue;

			const geometry = mesh.geometry;
			geometry.computeBoundingBox();
			const box = geometry.boundingBox!;

			this._camMV.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
			const planeDist = Math.abs(this._camMV.elements[13]);
			const curved = planeDist * planeDist;
			const curveXOffset = curved * curveX * frontness;
			const curveZBase = crtStrength * 2 * frontness - curved * curveZ * frontness;

			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			const corners: [number, number][] = [
				[box.min.x, box.min.y],
				[box.max.x, box.min.y],
				[box.min.x, box.max.y],
				[box.max.x, box.max.y]
			];
			for (const [cx, cy] of corners) {
				this._v.set(cx + curveXOffset, cy, curveZBase);
				this._v.applyMatrix4(mesh.matrixWorld);
				this._v.project(camera);
				if (this._v.x < minX) minX = this._v.x;
				if (this._v.x > maxX) maxX = this._v.x;
				if (this._v.y < minY) minY = this._v.y;
				if (this._v.y > maxY) maxY = this._v.y;
			}

			if (mouseNX >= minX && mouseNX <= maxX && mouseNY >= minY && mouseNY <= maxY) {
				this._hitV.set(curveXOffset, 0, curveZBase).applyMatrix4(mesh.matrixWorld).project(camera);
				if (this._hitV.x < -1.2 || this._hitV.x > 1.2 || this._hitV.y < -1.2 || this._hitV.y > 1.2 || this._hitV.z >= 1) continue;
				if (this._hitV.z < closestZ) {
					closestZ = this._hitV.z;
					closestIndex = i;
				}
			}
		}

		if (closestIndex === this.hoveredIndex) return;
		if (this.hoveredIndex !== null) {
			this.cards[this.hoveredIndex].setInactive();
			this.videoCards[this.hoveredIndex].setOffsetOut();
		}
		this.hoveredIndex = closestIndex;
		if (this.hoveredIndex !== null) {
			this.cards[this.hoveredIndex].setActive();
			this.videoCards[this.hoveredIndex].setOffsetIn();
		}
	}
```

Update `update()` to accept and forward mouse coordinates:

```typescript
	update(mouseNX: number, mouseNY: number): void {
		this.updateItems();
		this.updateGroup();
		this.handleHover(mouseNX, mouseNY);
	}
```

- [ ] **Step 2: Add a simplified entrance timeline**

Ported from `D.init()`'s timeline (search anchor: `this.tl=m.timeline({paused:!0,onUpdate:()=>{this.updateItems()}})`), simplified — no title stagger (titles don't exist), no logo/nav timing (not this class's concern).

```typescript
	playEntrance(): void {
		for (let i = 0; i < this.cards.length; i++) {
			const card = this.cards[i];
			card.material.uniforms.uProgress.value = 0;
			card.material.uniforms.uWarp.value = 0;
			card.mesh.scale.multiplyScalar(0.001);
			gsap.timeline({ delay: i * 0.1 }).to(card.mesh.scale, { x: card.mesh.scale.x * 1000, y: card.mesh.scale.y * 1000, duration: 1.2, ease: 'expo.out' }, 0).to(card.material.uniforms.uProgress, { value: 1, duration: 1.6, ease: 'power2.out' }, 0).to(card.material.uniforms.uWarp, { value: 1, duration: 1.4 }, 0.2);
		}
	}
```

Add the `gsap` import at the top of the file (if not already present from Task 4 — it isn't, Task 4's code didn't need it): `import gsap from 'gsap';`.

- [ ] **Step 3: Add the temporary wheel-scroll substitute**

Documented, explicitly temporary — replaced wholesale when a future phase adds real Lenis-driven scroll, not extended.

```typescript
	private onWheel = (event: WheelEvent): void => {
		this.scrollPosition += event.deltaY * 0.05;
	};

	/** TEMPORARY substitute for Lenis-driven scroll (not built yet). A future phase replaces this
	 *  entire method with real smooth-scroll input — do not extend this, replace it wholesale. */
	attachScrollListener(): void {
		window.addEventListener('wheel', this.onWheel, { passive: true });
	}

	detachScrollListener(): void {
		window.removeEventListener('wheel', this.onWheel);
	}
```

- [ ] **Step 4: Update `dispose()` to detach the listener**

```typescript
	dispose(): void {
		this.detachScrollListener();
		for (const card of this.cards) card.dispose();
		for (const videoCard of this.videoCards) videoCard.dispose();
	}
```

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/gallery.ts
git commit -m "feat(test-bg): add Gallery hover raycasting, entrance timeline, temp scroll input (port of D, part 2)"
```

---

### Task 6: `Images` layer (port of `He`, dual-pass)

**Files:**
- Create: `src/lib/three/scenes/segerman-bg/images.ts`

**Interfaces:**
- Consumes: `Gallery` (Task 4-5), `Layer`, `Scene`, `Blur` (`src/lib/three/scenes/segerman-bg/blur.ts`, from phase 1).
- Produces: `class Images extends Layer { constructor(scene: Scene, gallery: Gallery); get backTexture(): THREE.Texture; get backBloomTexture(): THREE.Texture; get frontTexture(): THREE.Texture; render(): void; dispose(): void }` — Task 8 wires these three getters into `Compositor`/`Front`.

- [ ] **Step 1: Write `images.ts`**

Ported from class `He` (search anchor in `world.js`: `this.baseBloomBoost=.1,this.infoBloomBoost=.3`), simplified — this port has no "info page" bloom-boost mode (no other routes), so that conditional branch is dropped; the base bloom boost/reduction/clamp constants are kept as static values.

```typescript
// src/lib/three/scenes/segerman-bg/images.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Gallery } from './gallery';
import { Blur } from './blur';

export class Images extends Layer {
	private scene: Scene;
	private gallery: Gallery;
	private blur: Blur;

	private backRT: THREE.WebGLRenderTarget;
	private frontRT: THREE.WebGLRenderTarget;
	private tightBlurA: THREE.WebGLRenderTarget;
	private tightBlurB: THREE.WebGLRenderTarget;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.scene = scene;
		this.gallery = gallery;
		this.blur = new Blur(scene);

		const scale = scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.4);
		this.backRT = scene.createRenderTarget(scale);
		this.frontRT = scene.createRenderTarget(scale);
		this.tightBlurA = scene.createRenderTarget(0.5);
		this.tightBlurB = scene.createRenderTarget(0.5);
	}

	get backTexture(): THREE.Texture {
		return this.backRT.texture;
	}

	get backBloomTexture(): THREE.Texture {
		return this.tightBlurB.texture;
	}

	get frontTexture(): THREE.Texture {
		return this.frontRT.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		const renderer = this.scene.renderer;

		// Back pass (uImageMode=0): direct color, bloom-composited — feeds the immersive back compositor.
		for (const card of this.gallery.cards) card.setImageMode(0);
		renderer.setRenderTarget(this.backRT);
		renderer.clear();
		renderer.render(this.gallery.imageScene, this.scene.camera);
		this.blur.apply(this.backRT.texture, this.tightBlurA, this.tightBlurB, 1);

		// Front pass (uImageMode=1): grain/duotone treatment, no bloom — feeds the white front compositor.
		for (const card of this.gallery.cards) card.setImageMode(1);
		renderer.setRenderTarget(this.frontRT);
		renderer.clear();
		renderer.render(this.gallery.imageScene, this.scene.camera);
	}

	dispose(): void {
		this.blur.dispose();
	}
}
```

Note: `backRT`/`frontRT`/`tightBlurA`/`tightBlurB` are all created via `scene.createRenderTarget()`, so `Scene.dispose()` already tracks and disposes them centrally — `Images.dispose()` correctly only disposes its own `Blur` instance, matching the established pattern from `Planet`/`Fog`.

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/images.ts
git commit -m "feat(test-bg): add Images layer — dual front/back render pass with bloom (port of He)"
```

---

### Task 7: `Video` layer (port of `Oe`)

**Files:**
- Create: `src/lib/three/scenes/segerman-bg/video.ts`

**Interfaces:**
- Consumes: `Gallery` (Task 4-5), `Layer`, `Scene`.
- Produces: `class Video extends Layer { constructor(scene: Scene, gallery: Gallery); get texture(): THREE.Texture; render(): void }` — Task 8 wires `.texture` into both `Compositor` and `Front`.

- [ ] **Step 1: Write `video.ts`**

Ported from class `Oe` (search anchor in `world.js`: `this.scale=()=>e.isMobile?e.dpr:Math.min(e.dpr,1.25)`).

```typescript
// src/lib/three/scenes/segerman-bg/video.ts
import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Gallery } from './gallery';

export class Video extends Layer {
	private scene: Scene;
	private gallery: Gallery;
	private renderTarget: THREE.WebGLRenderTarget;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.scene = scene;
		this.gallery = gallery;
		const scale = scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.25);
		this.renderTarget = scene.createRenderTarget(scale);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	loop(): void {
		this.render();
	}

	render(): void {
		const renderer = this.scene.renderer;
		renderer.setRenderTarget(this.renderTarget);
		renderer.clear();
		renderer.render(this.gallery.videoScene, this.scene.camera);
	}
}
```

No `dispose()` override needed — `renderTarget` is tracked/disposed by `Scene` (via `createRenderTarget`), and `Video` owns no other resources (the `Gallery` instance it references is disposed separately, by whoever owns it).

- [ ] **Step 2: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/video.ts
git commit -m "feat(test-bg): add Video layer (port of Oe)"
```

---

### Task 8: Wiring — Compositor/Front/route + verification

**Files:**
- Modify: `src/lib/three/scenes/segerman-bg/compositor.ts`
- Modify: `src/lib/three/scenes/segerman-bg/front.ts`
- Modify: `src/routes/test/+page.svelte`

**Interfaces:**
- Consumes: `Gallery`, `Images`, `Video` (Tasks 4-7).

- [ ] **Step 1: Update `Compositor`**

In `src/lib/three/scenes/segerman-bg/compositor.ts`:

Add imports:

```typescript
import type { Images } from './images';
import type { Video } from './video';
```

Extend `CompositorLayers`:

```typescript
export interface CompositorLayers {
	stars: Stars;
	fog: Fog;
	fluid: FluidSim;
	planet: Planet;
	front: Front;
	images: Images;
	video: Video;
}
```

Add private fields (alongside the existing `fluidSim`/`frontLayer`/`planetLayer`):

```typescript
	private imagesLayer: Images;
	private videoLayer: Video;
```

Store them in the constructor:

```typescript
		this.imagesLayer = layers.images;
		this.videoLayer = layers.video;
```

Replace the `backMaterial`'s placeholder-bound uniforms (`tImagesBack`, `tImagesBackBloom`, `tVideo`) — change:

```typescript
				tImagesBack: { value: this.placeholder },
				tImagesBackBloom: { value: this.placeholder },
				tVideo: { value: this.placeholder },
```

to:

```typescript
				tImagesBack: { value: layers.images.backTexture },
				tImagesBackBloom: { value: layers.images.backBloomTexture },
				tVideo: { value: layers.video.texture },
```

In `render()`, add live-reads (alongside the existing `tFluid`/`tPlanetBlur` live-reads, same pattern) before the `backRT` draw:

```typescript
		this.backMaterial.uniforms.tImagesBack.value = this.imagesLayer.backTexture;
		this.backMaterial.uniforms.tImagesBackBloom.value = this.imagesLayer.backBloomTexture;
		this.backMaterial.uniforms.tVideo.value = this.videoLayer.texture;
```

- [ ] **Step 2: Update `Front`**

In `src/lib/three/scenes/segerman-bg/front.ts`, change the constructor signature to accept `images`/`video`:

```typescript
	constructor(scene: Scene, images: Images, video: Video) {
```

(add `import type { Images } from './images';` and `import type { Video } from './video';` at the top). Store them:

```typescript
	private imagesLayer: Images;
	private videoLayer: Video;
```

```typescript
		this.imagesLayer = images;
		this.videoLayer = video;
```

Change the placeholder-bound uniforms:

```typescript
				tImagesFront: { value: images.frontTexture },
				tVideo: { value: video.texture },
```

(keep `tTitles`/`tTexts` on their existing placeholders — untouched). In `render()`, add live-reads before the draw call:

```typescript
		this.material.uniforms.tImagesFront.value = this.imagesLayer.frontTexture;
		this.material.uniforms.tVideo.value = this.videoLayer.texture;
```

- [ ] **Step 3: Wire the route**

In `src/routes/test/+page.svelte`, add imports:

```typescript
import { Gallery } from '$lib/three/scenes/segerman-bg/gallery';
import { Images } from '$lib/three/scenes/segerman-bg/images';
import { Video } from '$lib/three/scenes/segerman-bg/video';
```

In `onMount`, after `planet` is constructed and before `front`/`compositor`:

```typescript
const projects = ['estrela', 'payjustnow', 'vineyard', 'yucca', 'zulik'].map((slug) => ({
	slug,
	textureUrl: `/textures/segerman-bg/work/${slug}.webp`,
	videoUrl: `/videos/segerman-bg/work/${slug}.mp4`
}));
const gallery = new Gallery(scene, projects);
gallery.playEntrance();
gallery.attachScrollListener();

const images = new Images(scene, gallery);
scene.addLayer(images);
const video = new Video(scene, gallery);
scene.addLayer(video);
```

Update the `Front` construction call to the new signature: `const front = new Front(scene, images, video);`.

Update the `Compositor` construction call to include the two new layers: `const compositor = new Compositor(scene, { stars, fog, fluid, planet, front, images, video });`.

Add a `pointermove` listener that feeds the gallery's hover raycast and parallax target (alongside the existing fluid/planet pointermove listeners):

```typescript
canvasRef?.addEventListener('pointermove', (event) => {
	const nx = (event.clientX / window.innerWidth) * 2 - 1;
	const ny = -(event.clientY / window.innerHeight) * 2 + 1;
	gallery.setMouseTarget(nx, ny);
});
```

Update the per-frame `Gallery.update()` call site — since `Images`/`Video` both call `gallery.update(...)` internally would duplicate work if each layer called it separately; instead, call it once per frame from the route's own render hook. **Add a call to `gallery.update(nx, ny)` inside the existing `pointermove` handler you just added** (reusing the same `nx`/`ny` it just computed), immediately after `gallery.setMouseTarget(nx, ny);`:

```typescript
canvasRef?.addEventListener('pointermove', (event) => {
	const nx = (event.clientX / window.innerWidth) * 2 - 1;
	const ny = -(event.clientY / window.innerHeight) * 2 + 1;
	gallery.setMouseTarget(nx, ny);
	gallery.update(nx, ny);
});
```

(This means layout/hover updates happen on pointer movement, not strictly every animation frame — acceptable for now since the temporary wheel-scroll substitute also needs a redraw trigger; note this as a known simplification, not a bug, in your report. A future phase wiring real per-frame updates independent of pointer events is reasonable follow-up work, not required here.)

Actually — **reconsider**: since scrolling (via the temporary wheel listener) changes `gallery.scrollPosition` independent of pointer movement, calling `gallery.update()` only on `pointermove` means scrolling alone won't visually update the layout until the next mouse move. Fix this by instead calling `gallery.update(scene.pointer.nx, scene.pointer.ny)` once per frame from inside `Images.render()` and `Video.render()`... but that would double-call it (both layers render every frame). **Correct approach:** call `gallery.update(...)` exactly once per frame, from the route itself, in a `requestAnimationFrame` loop separate from pointer events. Simplest fix: don't call it from `pointermove` at all — instead, track the latest normalized pointer position in two module-scope `let` variables updated by `pointermove`, and call `gallery.update(latestNx, latestNy)` once per frame via `scene`'s own loop. Since `Scene` doesn't expose a "run this once per frame" hook for route-level code, the pragmatic fix within this task's scope: have `Images.render()` (which already runs every frame via its `loop()` override) call `this.gallery.update(this.scene.pointer.nx, this.scene.pointer.ny)` as the first line of its own `render()` method, using `Scene.pointer`'s already-tracked normalized coordinates (from `Scene`'s constructor — confirm the field name; it was established in phase 1 as `scene.pointer.nx`/`scene.pointer.ny`). This means only `Images.render()` drives `Gallery.update()`, once per frame, regardless of pointer movement — remove the `gallery.update(nx, ny)` line from the `pointermove` handler above (keep only `gallery.setMouseTarget(nx, ny)` there).

Go back and edit `Images.render()` (from Task 6) to add this line at the very start of the method:

```typescript
	render(): void {
		this.gallery.update(this.scene.pointer.nx, this.scene.pointer.ny);
		const renderer = this.scene.renderer;
		// ... rest unchanged
```

- [ ] **Step 4: Dispose the new instances**

In `onDestroy`, `gallery`/`images`/`video` need cleanup. `images`/`video` are disposed automatically via `scene.dispose()` (registered through `scene.addLayer()`, same as every other layer). `gallery` is NOT a `Layer` and isn't registered with `scene` — add an explicit `gallery?.dispose();` call in `onDestroy`, before `scene?.dispose();` (so `Gallery`'s own `detachScrollListener()` runs while `window` is still a valid target, though this ordering doesn't actually matter for `window` — do it before `scene?.dispose()` anyway for consistency with disposal-order intuition elsewhere in this file).

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 6: Verify**

Check dev server: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/test` — start one if not `200`.

Try Playwright once (per this session's established pattern — try, and if it hits the known "Chromium distribution 'chrome' is not found" error, or any error, fall back to `npm run check` (already clean from Step 5) plus careful manual diff review, and report which path you used). Expected if it works: 5 project card images visible in a horizontal strip (front/white default view shows the duotone-graded version — likely still mostly obscured by the white front layer except where the cursor has revealed it, matching phase 2a's established behavior), hovering a visible card scales it up and its video fades in, scrolling the mouse wheel moves the strip.

- [ ] **Step 7: Commit**

```bash
git add src/lib/three/scenes/segerman-bg/compositor.ts src/lib/three/scenes/segerman-bg/front.ts src/lib/three/scenes/segerman-bg/images.ts src/routes/test/+page.svelte
git commit -m "feat(test-bg): wire Gallery/Images/Video into Compositor/Front/route, complete phase 2b"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (shared uniforms) → Task 1. Section 2 (`Card`) → Task 2. Section 3 (`VideoCard`) → Task 3. Section 4 (`Gallery`) → Tasks 4-5. Section 5 (`Images`) → Task 6. Section 6 (`Video`) → Task 7. Section 7 (wiring) → Task 8.
- **Placeholder scan:** Task 2's `card.ts` code block contains a deliberately-flagged self-correction (the stray first `setActive()` draft) — this is NOT a TBD/placeholder, it's an explicit "here's the wrong version, here's the right one" callout so the implementer doesn't transcribe a mistake; flagging it here so it isn't miscounted as a plan defect. No other placeholders found. Task 8's Step 3 contains a worked-through design correction (the `gallery.update()` call-site reconsideration) — again, not a placeholder, a resolved design decision with the final, correct instruction at the end.
- **Type consistency:** `Card`/`VideoCard`/`Gallery`/`Images`/`Video` names and public surfaces are consistent everywhere they're referenced across Tasks 2-8. `Images.backTexture`/`.backBloomTexture`/`.frontTexture` and `Video.texture` getter names match exactly between their own class definitions (Tasks 6-7) and `Compositor`/`Front`'s consumption of them (Task 8).
- **Scope check:** single subsystem (the gallery), consistent with the spec's phase-2b boundary. Titles/Texts, click-navigation, and real Lenis scroll remain explicitly deferred (spec's "Out of Scope" section, unchanged).
