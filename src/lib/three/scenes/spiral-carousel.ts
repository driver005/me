import * as THREE from "three";
import gsap from "gsap";
import type { Scene } from "./scene";
import { createPlaceholderTexture } from "./placeholder-textures";
import { CenterCube } from "./center-cube";
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import spiralVertex from "$lib/shaders/spiral/vertex.glsl";
// @ts-ignore
import spiralFragment from "$lib/shaders/spiral/fragment.glsl";

export interface SpiralCarouselItem {
  src: string;
  href?: string;
  /** 'image' (default, if omitted) or 'video' — a video item plays muted/looping/inline as a real
   *  THREE.VideoTexture instead of a downscaled still (see loadVideoTexture()); everything else
   *  (spiral placement, hover/click, duotone/fluid reveal) treats it identically to an image card. */
  type?: "image" | "video";
}

export interface SpiralCarouselOptions {
  /** 'spiral' (default) — the twisted stacked column. 'horizontal' — a flat filmstrip that only
   *  ever moves left/right, no vertical stacking or twist. */
  mode?: "spiral" | "horizontal";
  /** The real compositor's own screen-space cursor-trail reveal (output-fragment.glsl's
   *  tFluid/fluidMask, ported to spiral/fragment.glsl's own uTFluid/fluidMask) — every image grainy
   *  black/navy-and-white duotone by default, colour revealed in a circle following the cursor's
   *  fluid trail. Requires `fluidTexture` (below); silently has no visible effect without it, since
   *  the shader's own fluidMask then always reads as "no disturbance" (permanently duotone). Default
   *  off. */
  duotone?: boolean;
  /** SegermanBgContext.getFluidTexture() — the same screen-space dye texture the compositor's own
   *  white/colour reveal samples. Required for `duotone` to actually reveal colour on cursor
   *  movement rather than staying permanently duotone. */
  fluidTexture?: THREE.Texture | null;
  /** Radians of twist between adjacent items in 'spiral' mode. Default (0.85) matches the original
   *  standalone /spiral page's own ~150-photo set; a caller with far fewer items needs a wider
   *  angle or they read as a loose stack rather than an actual spiral — pass e.g. 2*PI/items.length
   *  for an even full-circle spread regardless of count. */
  angleGap?: number;
  /** World-space spiral radius. Default scales with the item scale (see fitFactor below). */
  radius?: number;
  /** World-space point this carousel is centred on. Default the origin. Ignored (read once, then
   *  never again) if `getCenter` is also given. */
  center?: { x: number; y: number; z: number };
  /** Like `center`, but re-evaluated every frame in tick() instead of read once — for a caller whose
   *  center needs to track a live, resize-driven value (e.g. spiral-layout.ts's getSpiralCenterX())
   *  without needing its own resize listener: this carousel already ticks every
   *  frame via scene.appendOutput(), so piggy-backing the recompute there is strictly more robust than
   *  a `window.resize` listener (which a resize that doesn't fire a real DOM resize event — a scaled/
   *  embedded preview iframe, for one — would silently never react to). Takes priority over `center`
   *  when both are given. */
  getCenter?: () => { x: number; y: number; z: number };
  /** Called when a clickable (has `href`) item is clicked. */
  onItemClick?: (item: SpiralCarouselItem, index: number) => void;
  /** When set, spawns a CenterCube (see center-cube.ts) directly in this carousel's own scene —
   *  spinning around Y, hit-tested alongside the cards themselves so hovering shows a pointer cursor
   *  and clicking calls `onClick`. Deliberately NOT a child of `group` (unlike an earlier version):
   *  Home wants it living in its own third of the page (see spiral-layout.ts's getCubeCenterX()) while
   *  the card column sits in a different third (getSpiralCenterX()) — two independent positions, not
   *  one shared one — so it gets its own `getCenter`, re-evaluated every frame exactly like the
   *  carousel's own (see that option's own comment on why frame-driven beats a resize listener).
   *  Home's own +page.svelte is the only current caller. */
  centerpiece?: {
    /** Cube edge length, in the same units `itemScale` derives from. Default 1.4x itemScale. */
    size?: number;
    onClick?: () => void;
    /** World-space center for the cube itself, re-evaluated every frame — independent of `center`/
     *  `getCenter` above. Falls back to the world origin if omitted. */
    getCenter?: () => { x: number; y: number; z: number };
  };
  /** Multiplies the camera-derived scale (see sharedCameraZ etc. below) — 1 reproduces the original
   *  standalone /spiral page's own proportions exactly (verified once the quadratic shader bug was
   *  fixed); smaller shrinks the whole carousel (item size, radius, every gap) uniformly to fit a
   *  tighter frame or share space with other scene content. Default 1. */
  fitFactor?: number;
  /** This engine's own shared camera's z position (EngineRoot.svelte's `camera.position.z`). Default
   *  100 — only override this if that camera setup itself ever changes. */
  sharedCameraZ?: number;
  /** The original standalone /spiral page's own camera z position (its own `camera.position.set(0, 0,
   *  8)`) — the reference distance every proportion here is derived relative to. Default 8. */
  spiralCameraZ?: number;
  /** This engine's own shared camera's vertical FOV, in degrees (EngineRoot.svelte's
   *  `new THREE.PerspectiveCamera(50, ...)`). Default 50. */
  sharedCameraFovDeg?: number;
  /** The original standalone /spiral page's own camera's vertical FOV, in degrees (its own
   *  `new THREE.PerspectiveCamera(35, ...)`). Default 35. */
  spiralCameraFovDeg?: number;
  /** Radius as a multiple of the item scale, when `radius` itself isn't given — the original's own
   *  ratio (radius:itemWidth ≈ 1.18:1) is 2 here since itemWidth there was 1.7. Default 2. */
  radiusRatio?: number;
  /** Wheel-scroll idle drift speed — never fully stops spinning; decays toward this floor rather than
   *  zero (see tick()'s own use of it). Default 0.002. */
  minWheelSpeed?: number;
  /** Per-frame easing rate the actual scroll speed chases its target at (tick()'s own
   *  `wheelDelta += (targetWheelDelta - wheelDelta) * easing`) — higher reacts to wheel input faster.
   *  Default 0.1. */
  easing?: number;
}

interface CardState {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  /** GSAP-driven (see setCardActive()/setCardInactive(), ported from card.ts's own setActive()/
   *  setInactive()) — no longer a per-frame manual ease chasing a target. Feeds uColorStrength/uZoom
   *  in tick(), same as before. */
  hoverProgress: number;
  /** GSAP-driven multiplier on the card's own base scale (card.ts's own setActive()/setInactive()
   *  scale pop, 1.08x) — separate from hoverProgress because card.ts tweens them on different
   *  timings (0.8s power3.out for scale, 3s/1s expo.out for the color/zoom-driving value). */
  scalePop: number;
  /** GSAP-driven, 0.001→1 once per card on spawn (see playEntrance(), ported from card.ts's own
   *  playEntrance()) — a grow-from-nothing pop layered on top of the spiral's own existing
   *  hiddenProgress-driven wipe/slide-in reveal, not a replacement for it. */
  entranceScale: number;
  hoverTween: gsap.core.Timeline | null;
  entranceTween: gsap.core.Timeline | null;
  hiddenProgress: number;
  hiddenTarget: number;
  isHidden: boolean;
}

/** The original standalone /spiral page's own camera sits at z:8 (spiral.svelte's
 *  `camera.position.set(0, 0, 8)`); this engine's shared camera sits at z:100 (EngineRoot.svelte).
 *  Scaling every one of the original's world-space constants (item size, radius, gaps — all below) by
 *  the camera-distance ratio, compensating for the two cameras' different FOV on top of that (apparent
 *  size at a given distance is proportional to size / (distance * tan(fov/2)); solving that ratio for
 *  the SAME apparent size across both cameras gives the tan(fov/2) factor below alongside the distance
 *  one), reproduces the original's proportions faithfully. An EARLIER version of this looked broken at
 *  this exact scale (a single wide ribbon spanning past both viewport edges, wrapping around Mars) —
 *  that turned out to be a real shader bug, not this derivation: spiral/vertex.glsl's
 *  pow(worldPosition.y, 2.0) term scales quadratically with position, so scaling every position up by
 *  this same factor blew that term up by its SQUARE, not by the factor itself. Fixed via
 *  uCurveStrength (set below, currently 0 — see its own comment) — this derivation was correct the
 *  whole time. All of the camera/scale numbers this depends on are SpiralCarouselOptions fields now
 *  (sharedCameraZ, spiralCameraZ, sharedCameraFovDeg, spiralCameraFovDeg, radiusRatio, fitFactor) —
 *  see each field's own doc comment; the values below are only the defaults used when unset. */
const DEFAULT_SHARED_CAMERA_Z = 100;
const DEFAULT_SPIRAL_CAMERA_Z = 8;
const DEFAULT_SHARED_CAMERA_FOV_DEG = 50;
const DEFAULT_SPIRAL_CAMERA_FOV_DEG = 35;
/** Same ratio to item scale the original used (radius:itemWidth ≈ 1.18:1 there too). Decoupling this
 *  from item scale was tried and reverted while the curve term (spiral/vertex.glsl's uCurveStrength)
 *  was still active — shrinking radius alone without shrinking that term to match just let the curve
 *  dominate even harder relative to the now-smaller orbit. Moot now that the curve is off entirely,
 *  but left at the original's own ratio since there's no reason to deviate from it any more. */
const DEFAULT_RADIUS_RATIO = 2;
const DEFAULT_ANGLE_GAP = 0.85;
const DEFAULT_MIN_WHEEL_SPEED = 0.002;
const DEFAULT_EASING = 0.1;
/** Below this many items, the constructor repeats the caller's own list end-to-end until it clears
 *  this threshold (see its own comment) — /spiral's ~150 photos comfortably exceed it already,
 *  unaffected; a short list (Home's handful of project cards) gets repeated instead of spaced out. */
const MIN_ITEM_COUNT = 24;

/**
 * The project carousel (Home) and per-project media strip (Work detail) — a genuine Layer sharing
 * the engine's own canvas/camera/renderer, unlike the first version of this port (a separate
 * standalone <Spiral> component with its OWN WebGLRenderer/camera stacked on top as a DOM overlay).
 * That approach needed a z-index above every other floating UI element (the front/back toggle button)
 * and a manual pointer-event-forwarding hack just to keep the shared canvas's own cursor-reactive
 * effects (fluid trail, ADRIAN click-raycast) alive underneath it — both entire bug classes that
 * don't exist once this renders into the same scene everything else does.
 *
 * Not registered via scene.addLayer() — Scene has no removeLayer(), and this carousel is scoped to
 * one page (a fresh instance per Home/Work visit), torn down on navigation away. Also, critically,
 * NOT driven by its own independent requestAnimationFrame loop either — an earlier version of this
 * class was, calling a public update()+render() from the constructing +page.svelte's own rAF
 * callback, and every frame it drew was silently wiped: EngineRoot.svelte's useTask calls
 * `renderer.clear()` unconditionally right before the compositor's own final blit, every single
 * Threlte frame, regardless of what an independently-scheduled rAF callback drew earlier — there is
 * no ordering of two separate rAF loops that survives an unconditional clear on one of them. Instead
 * this drives itself entirely via scene.appendOutput() (see its own doc comment) — a single tick()
 * folding the wheel/hover physics update and the actual draw into one callback that the engine itself
 * invokes at the right point in its own frame, every frame, once appended.
 *
 * Renders via its own dedicated THREE.Scene + a direct renderer.render() call (autoClear disabled)
 * rather than joining gallery.imageScene/Images' own dual-pass render-target pipeline — that pipeline
 * assumes its members are Card instances (Images.ts's loop calls card.setImageMode() on each one) and
 * exists to crossfade the home strip between its own front/back looks, neither of which this needs
 * (duotone above is a fixed, permanent choice per instance, not a live crossfade).
 */
export class SpiralCarousel {
  private scene: Scene;
  private carouselScene = new THREE.Scene();
  private group = new THREE.Group();
  private geo: THREE.PlaneGeometry;
  private cardStates: CardState[] = [];
  private items: SpiralCarouselItem[];
  private mode: "spiral" | "horizontal";
  private angleGap: number;
  private radius: number;
  private itemScale: number;
  private fluidTexture!: THREE.Texture;
  private ownsFluidTexture!: boolean;
  private verticalGap: number;
  private horizontalGap: number;
  private minWheelSpeed: number;
  private easing: number;
  private total: number;
  private centerIndex: number;
  private clickableSet = new Set<number>();
  private onItemClickCb?: (item: SpiralCarouselItem, index: number) => void;
  private getCenterFn?: () => { x: number; y: number; z: number };

  private scrollOffset = 0;
  private wheelDelta: number;
  private targetWheelDelta: number;
  private wheelDirection = 1;
  private lastTime = performance.now();

  private raycaster = new THREE.Raycaster();
  private hoveredIndex = -1;
  private hoveredIsCenterpiece = false;
  private centerCube?: CenterCube;
  private centerpieceOnClick?: () => void;
  private centerpieceGetCenter?: () => { x: number; y: number; z: number };

  private domCanvas: HTMLCanvasElement;
  private onWheel: (e: WheelEvent) => void;
  private onClick: () => void;

  private loadedTextures: THREE.Texture[] = [];
  private loadedVideos: HTMLVideoElement[] = [];
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private removeOutput: () => void;

  constructor(scene: Scene, rawItems: SpiralCarouselItem[], options: SpiralCarouselOptions = {}) {
    this.scene = scene;
    // /spiral's own ~150-photo density is what makes its column visibly span the full frame height
    // and read as a proper spiral rather than a loose handful of cards — that's a property of having
    // enough items at the shared default spacing, not of the spacing itself (an earlier version of
    // this instead widened the vertical gap for a sparse caller, which just spaced fewer items out
    // strangely rather than reproducing that density). Repeating a short item list end-to-end until
    // it clears MIN_ITEM_COUNT reproduces the SAME density with any caller's real item count, no
    // per-caller spacing tuning needed — every repeated instance is independently clickable (same
    // href) and shares one loaded texture (see the dedup below), not a separate download each.
    const repeatCount =
      rawItems.length > 0 ? Math.max(1, Math.ceil(MIN_ITEM_COUNT / rawItems.length)) : 1;
    const items: SpiralCarouselItem[] =
      repeatCount > 1 ? Array.from({ length: repeatCount }).flatMap(() => rawItems) : rawItems;
    this.items = items;
    this.mode = options.mode ?? "spiral";
    this.angleGap = options.angleGap ?? DEFAULT_ANGLE_GAP;
    const sharedCameraZ = options.sharedCameraZ ?? DEFAULT_SHARED_CAMERA_Z;
    const spiralCameraZ = options.spiralCameraZ ?? DEFAULT_SPIRAL_CAMERA_Z;
    const sharedCameraFovDeg = options.sharedCameraFovDeg ?? DEFAULT_SHARED_CAMERA_FOV_DEG;
    const spiralCameraFovDeg = options.spiralCameraFovDeg ?? DEFAULT_SPIRAL_CAMERA_FOV_DEG;
    const baseItemScale =
      (sharedCameraZ / spiralCameraZ) *
      (Math.tan((sharedCameraFovDeg * Math.PI) / 360) /
        Math.tan((spiralCameraFovDeg * Math.PI) / 360));
    this.itemScale = (options.fitFactor ?? 1) * baseItemScale;
    this.verticalGap = 0.5 * this.itemScale;
    this.horizontalGap = 2.1 * this.itemScale;
    this.radius = options.radius ?? (options.radiusRatio ?? DEFAULT_RADIUS_RATIO) * this.itemScale;
    this.minWheelSpeed = options.minWheelSpeed ?? DEFAULT_MIN_WHEEL_SPEED;
    this.easing = options.easing ?? DEFAULT_EASING;
    this.wheelDelta = this.minWheelSpeed;
    this.targetWheelDelta = this.minWheelSpeed;
    this.total = items.length;
    this.centerIndex = Math.floor(this.total / 2);
    this.onItemClickCb = options.onItemClick;
    this.getCenterFn = options.getCenter;

    this.carouselScene.add(this.group);
    this.group.position.set(options.center?.x ?? 0, options.center?.y ?? 0, options.center?.z ?? 0);

    if (options.centerpiece) {
      this.centerCube = new CenterCube(scene, options.centerpiece.size ?? this.itemScale * 1.4);
      // Sibling of `group`, not a child of it — see this field's own doc comment on why.
      this.carouselScene.add(this.centerCube.mesh);
      this.centerpieceOnClick = options.centerpiece.onClick;
      this.centerpieceGetCenter = options.centerpiece.getCenter;
    }

    this.geo = new THREE.PlaneGeometry(1.7, 1, 8, 8);

    items.forEach((item, i) => {
      if (item.href) this.clickableSet.add(i);
    });

    const duotone = options.duotone ?? false;
    // A valid sampler2D binding is needed regardless of whether duotone is even on — the uniform
    // still has to point at SOME texture, just main()'s own `uDuotone > 0.5` branch never samples it
    // when duotone is off (or fluidTexture wasn't supplied). Only dispose() this placeholder if WE
    // created it — a caller-supplied fluidTexture is the shared FluidSim.texture, owned and disposed
    // by the layout that constructed FluidSim, not by this carousel.
    this.fluidTexture = options.fluidTexture ?? createPlaceholderTexture();
    this.ownsFluidTexture = !options.fluidTexture;
    // Grouped by src rather than one load per item: a repeated list (see MIN_ITEM_COUNT above) would
    // otherwise re-download and re-upload the SAME image to the GPU once per repeat. Loaded once per
    // unique src, then spawned at every index that shares it — this.loadedTextures gets that texture
    // pushed once too, so dispose() doesn't double-free it.
    const indicesBySrc = new Map<string, number[]>();
    items.forEach((item, idx) => {
      const indices = indicesBySrc.get(item.src) ?? [];
      indices.push(idx);
      indicesBySrc.set(item.src, indices);
    });
    indicesBySrc.forEach((indices, src) => {
      const isVideo = items[indices[0]].type === "video";
      const onLoad = (tex: THREE.Texture) => {
        this.loadedTextures.push(tex);
        for (const idx of indices) this.spawnCard(idx, tex, duotone);
      };
      if (isVideo) {
        this.loadVideoTexture(src, onLoad);
      } else {
        this.loadDownscaledTexture(src, onLoad);
      }
    });

    this.domCanvas = scene.renderer.domElement;
    this.onWheel = (e: WheelEvent) => {
      this.targetWheelDelta = THREE.MathUtils.clamp(
        this.targetWheelDelta + e.deltaY * 15e-5,
        -2,
        2,
      );
      this.wheelDirection = e.deltaY > 0 ? 1 : -1;
    };
    this.domCanvas.addEventListener("wheel", this.onWheel, { passive: true });

    this.onClick = () => {
      if (this.hoveredIsCenterpiece) {
        this.centerpieceOnClick?.();
        return;
      }
      if (
        this.hoveredIndex >= 0 &&
        this.clickableSet.has(this.hoveredIndex) &&
        this.onItemClickCb
      ) {
        this.onItemClickCb(this.items[this.hoveredIndex], this.hoveredIndex);
      }
    };
    this.domCanvas.addEventListener("click", this.onClick);

    this.removeOutput = scene.appendOutput(() => this.tick());
  }

  /** The work-project preview images this feeds (real full-page website screenshots) run up to
   *  5400px tall — uploading that much raw pixel data straight to the GPU as a texture is slow
   *  enough (worse still under software rendering, but real GPUs pay a real cost too) that it was
   *  the actual reason the carousel took far too long to appear, not a rendering bug. Downscales via
   *  an offscreen canvas to MAX_DIM on the long edge (preserving aspect — uPlaneSizes/uImageSizes in
   *  the shader only ever care about the ratio, not the absolute size) before ever creating a
   *  texture, instead of THREE.TextureLoader's default of using the full-resolution decoded image
   *  directly. */
  private loadDownscaledTexture(src: string, onLoad: (tex: THREE.Texture) => void): void {
    const MAX_DIM = 1024;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      onLoad(tex);
    };
    img.onerror = () => console.warn("[SpiralCarousel] failed to load image", src);
    img.src = src;
  }

  /** Plays a video muted/looping/inline (autoplay would otherwise be blocked by the browser without
   *  muted) and wraps it in a real THREE.VideoTexture, which THREE re-uploads to the GPU from the
   *  video's own current frame every render automatically — no manual per-frame texture update needed
   *  here, unlike loadDownscaledTexture()'s one-shot CanvasTexture. The <video> element itself
   *  (tracked in this.loadedVideos, disposed alongside its texture) is what actually needs
   *  pause()/src clearing on teardown; the texture alone doesn't stop playback. */
  private loadVideoTexture(src: string, onLoad: (tex: THREE.Texture) => void): void {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener(
      "loadeddata",
      () => {
        this.loadedVideos.push(video);
        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        onLoad(tex);
      },
      { once: true },
    );
    video.addEventListener("error", () => console.warn("[SpiralCarousel] failed to load video", src));
    video.src = src;
    video.play().catch(() => {
      /* Autoplay can still be refused (e.g. low-power mode) — the texture just shows the video's
         first frame, frozen, rather than throwing. */
    });
  }

  private spawnCard(idx: number, tex: THREE.Texture, duotone: boolean): void {
    const video = tex instanceof THREE.VideoTexture ? (tex.image as HTMLVideoElement) : null;
    const imgW = video?.videoWidth || tex.image?.width || 1024;
    const imgH = video?.videoHeight || tex.image?.height || 683;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: tex },
        uColorStrength: { value: 0 },
        uZoom: { value: 1 },
        uPlaneSizes: { value: new THREE.Vector2(1.7, 1) },
        uImageSizes: { value: new THREE.Vector2(imgW, imgH) },
        uRevealProgress: { value: 0 },
        uScrollSpeed: { value: 0 },
        // See spiral/vertex.glsl's own comment — directly scales that curve term's contribution.
        // 0 turns it off entirely (safe: the shader multiplies by this, never divides by it) — the
        // straight column reads better here than the original's own curved one did.
        uCurveStrength: { value: 0 },
        // card/fragment.glsl's own defaults (card.ts) — kept identical so this duotone look
        // matches what the old Gallery/Card carousel actually rendered.
        uDuotone: { value: duotone ? 1 : 0 },
        uDarkColor: { value: new THREE.Color("#00031f") },
        uLightColor: { value: new THREE.Color("#ffffff") },
        uInputBlack: { value: 15 },
        uInputWhite: { value: 200 },
        uGamma: { value: 125 },
        uNoiseSize: { value: 3.8 },
        uNoiseAmount: { value: 0.12 },
        uDpr: { value: this.scene.dpr },
        // See spiral/fragment.glsl's own comment on uDuotone — the same live screen-space dye
        // texture output-fragment.glsl's own tFluid samples for the compositor's page-wide reveal.
        // uRes shares the scene's own live-updating uniform (card.ts's own pattern) rather than a
        // static copy, so it stays correct across resize without this class needing its own listener.
        uTFluid: { value: this.fluidTexture },
        uRes: this.scene.uniforms.uRes,
      },
      vertexShader: spiralVertex,
      fragmentShader: spiralFragment,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.scale.setScalar(this.itemScale);
    mesh.frustumCulled = false;
    this.group.add(mesh);

    const cs: CardState = {
      mesh,
      mat,
      hoverProgress: 0,
      scalePop: 1,
      entranceScale: 0.001,
      hoverTween: null,
      entranceTween: null,
      hiddenProgress: 1,
      hiddenTarget: 1,
      isHidden: true,
    };
    this.cardStates[idx] = cs;

    this.timeoutIds.push(
      setTimeout(
        () => {
          cs.hiddenTarget = 0;
          cs.isHidden = false;
        },
        (idx % 4) * 50,
      ),
    );

    this.playEntrance(cs, idx);
  }

  /** Ported from card.ts's own playEntrance() — a grow-from-nothing scale pop (0.001→1, expo.out),
   *  on top of (not instead of) the spiral's own existing hiddenProgress-driven wipe/slide-in reveal.
   *  Staggered on the same (idx%4)*50ms cadence the spiral's own reveal already uses above, rather
   *  than card.ts's own idx*0.1s — that stagger was tuned for Home's own handful of project cards;
   *  applied to /spiral's ~150 photos it would take 15 real seconds for the last one to start. */
  private playEntrance(cs: CardState, idx: number): void {
    cs.entranceTween?.kill();
    cs.entranceTween = gsap.timeline({ delay: (idx % 4) * 0.05 }).to(
      cs,
      { entranceScale: 1, duration: 1.2, ease: "expo.out", overwrite: "auto" },
      0,
    );
  }

  /** Ported from card.ts's own setActive() — the old carousel's real hover "cursor effect": the card
   *  pops to 1.08x scale (fast, 0.8s power3.out) while hoverProgress (feeding uColorStrength/uZoom in
   *  tick()) eases in much more slowly (3s expo.out) — two different timings, not one shared value,
   *  exactly as card.ts had them. */
  private setCardActive(cs: CardState): void {
    cs.hoverTween?.kill();
    cs.hoverTween = gsap
      .timeline()
      .to(cs, { scalePop: 1.08, duration: 0.8, ease: "power3.out", overwrite: "auto" }, 0)
      .to(cs, { hoverProgress: 1, duration: 3, ease: "expo.out" }, 0);
  }

  /** Ported from card.ts's own setInactive(). */
  private setCardInactive(cs: CardState): void {
    cs.hoverTween?.kill();
    cs.hoverTween = gsap
      .timeline()
      .to(cs, { scalePop: 1, duration: 0.8, ease: "power3.out", overwrite: "auto" }, 0)
      .to(cs, { hoverProgress: 0, duration: 1, ease: "expo.out" }, 0);
  }

  /** Invoked once per frame via scene.appendOutput() (see the constructor and this class's own
   *  header comment) — the wheel/hover physics update, folded together with the actual draw call at
   *  the bottom, since both need to happen at exactly this point in the engine's own frame. */
  private tick(): void {
    if (this.getCenterFn) {
      const center = this.getCenterFn();
      this.group.position.set(center.x, center.y, center.z);
    }

    const mouseNX = this.scene.pointer.nx;
    const mouseNY = this.scene.pointer.ny;
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.wheelDelta += (this.targetWheelDelta - this.wheelDelta) * this.easing;
    this.scrollOffset += this.wheelDelta;
    if (Math.abs(this.targetWheelDelta) < this.minWheelSpeed) {
      this.targetWheelDelta = this.wheelDirection * this.minWheelSpeed;
    }
    this.targetWheelDelta *= 0.9;

    for (let i = 0; i < this.cardStates.length; i++) {
      const cs = this.cardStates[i];
      if (!cs) continue;

      const hiddenEase = 1 - Math.pow(1 - 0.05, delta * 150);
      cs.hiddenProgress += (cs.hiddenTarget - cs.hiddenProgress) * hiddenEase;

      const hideSign = cs.isHidden ? 1.5 : -1.5;
      let ws = i - this.scrollOffset;
      ws = ((ws % this.total) + this.total) % this.total;
      const Ba = ws - this.centerIndex;

      if (this.mode === "horizontal") {
        const Xa = Ba * this.horizontalGap - cs.hiddenProgress * hideSign * this.itemScale;
        cs.mesh.position.set(Xa, 0, 0);
        cs.mesh.rotation.y = 0;
      } else {
        const Va = Ba * this.verticalGap - cs.hiddenProgress * hideSign * this.itemScale;
        const Ga = this.radius * (1 - cs.hiddenProgress / 2);
        // +PI/2 phase: at Ba=0 (Ha=PI/2 with it) position.x=cos(Ha)*Ga=0 and rotation.y=0 — the
        // resting card sits centered on the group's own x and faces the camera square-on. Without
        // this the ported formula's own Ba=0 lands at local x=+radius, rotation.y=PI/2 (edge-on,
        // not facing camera) instead — a card 90° of rotation away from "centered and front-facing"
        // is always the one at rest, reading as the whole column being shifted off to one side and
        // tilted. Same shape/twist either way, just a different starting rotational phase.
        const Ha = Ba * this.angleGap + Math.PI / 2;
        cs.mesh.position.set(Math.cos(Ha) * Ga, Va, Math.sin(Ha) * Ga);
        cs.mesh.rotation.y = -Ha + Math.PI / 2;
      }

      const u = cs.mat.uniforms;
      // uColorStrength (spiral's own native mix-toward-black-on-hover) removed — card.ts's own real
      // hover effect never darkens the image at all, only zooms it (see uZoom below), so this stays
      // permanently 0 (its uniform default at spawn) rather than tracking hoverProgress any more.
      // uZoom at 0.08 matches card/fragment.glsl's own `1.0 - uHover * 0.08` exactly (this was 0.05,
      // the spiral page's own pre-existing native magnitude, not card.ts's).
      u.uZoom.value = 1 + 0.08 * cs.hoverProgress;
      u.uRevealProgress.value = (1 - cs.hoverProgress * 0.05) * (1 - cs.hiddenProgress);
      u.uScrollSpeed.value = this.wheelDelta;
      // scalePop is card.ts's own 1.08x hover pop (see setCardActive()); entranceScale is its own
      // playEntrance() grow-in (see playEntrance()) — both GSAP-driven, multiplied into x/y only,
      // matching card.ts's own scale.set(x, y, 1) — it never scales z for either effect either.
      const xyScale = this.itemScale * cs.scalePop * cs.entranceScale;
      cs.mesh.scale.set(xyScale, xyScale, this.itemScale);
    }

    if (this.centerCube) {
      const cubeCenter = this.centerpieceGetCenter?.() ?? { x: 0, y: 0, z: 0 };
      this.centerCube.mesh.position.set(cubeCenter.x, cubeCenter.y, cubeCenter.z);
      this.centerCube.spin(delta);
    }

    // Covers the cube too (a sibling of `group`, not a descendant — see its own field comment) as
    // well as every card, in one call.
    this.carouselScene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(mouseNX, mouseNY), this.scene.camera);
    const meshes = this.cardStates.map((cs) => cs?.mesh).filter((m): m is THREE.Mesh => !!m);
    const centerpieceMesh = this.centerCube?.mesh;
    const hitTargets = centerpieceMesh ? [...meshes, centerpieceMesh] : meshes;
    const hits = this.raycaster.intersectObjects(hitTargets);
    const hitObject = hits[0]?.object;
    const newHoveredIsCenterpiece = hitObject !== undefined && hitObject === centerpieceMesh;
    const newHoveredIndex =
      !newHoveredIsCenterpiece && hitObject
        ? this.cardStates.findIndex((cs) => cs?.mesh === hitObject)
        : -1;
    if (newHoveredIndex !== this.hoveredIndex) {
      if (this.hoveredIndex >= 0 && this.cardStates[this.hoveredIndex])
        this.setCardInactive(this.cardStates[this.hoveredIndex]);
      if (newHoveredIndex >= 0 && this.cardStates[newHoveredIndex])
        this.setCardActive(this.cardStates[newHoveredIndex]);
      this.hoveredIndex = newHoveredIndex;
    }
    this.hoveredIsCenterpiece = newHoveredIsCenterpiece;
    this.domCanvas.style.cursor =
      (newHoveredIndex >= 0 && this.clickableSet.has(newHoveredIndex)) ||
      (newHoveredIsCenterpiece && !!this.centerpieceOnClick)
        ? "pointer"
        : "auto";

    // autoClear disabled — this must draw ON TOP of the color the compositor's own output() just
    // drew this same frame (see appendOutput's own doc comment), not erase it. But autoClear also
    // gates the DEPTH clear, and the compositor's own output is a fullscreen triangle blit — its
    // depth values are whatever that geometry happens to leave behind, not a real "nothing drawn
    // yet" state. Without clearing depth here too, every card's fragments fail the depth test
    // against that leftover buffer and get silently discarded: the draw call succeeds, nothing
    // throws, and the carousel is simply invisible. clearDepth() resets only the depth buffer,
    // leaving the compositor's own color output untouched.
    const renderer = this.scene.renderer;
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.carouselScene, this.scene.camera);
    renderer.autoClear = prevAutoClear;
  }

  dispose(): void {
    this.removeOutput();
    this.domCanvas.removeEventListener("wheel", this.onWheel);
    this.domCanvas.removeEventListener("click", this.onClick);
    this.domCanvas.style.cursor = "auto";
    this.centerCube?.dispose();
    this.timeoutIds.forEach((id) => clearTimeout(id));
    for (const cs of this.cardStates) {
      if (!cs) continue;
      cs.hoverTween?.kill();
      cs.entranceTween?.kill();
      cs.mat.dispose();
    }
    this.loadedTextures.forEach((t) => t?.dispose());
    // Disposing the VideoTexture above doesn't stop the underlying <video> from playing — it needs
    // its own pause()/src clear, or it keeps decoding frames (and making network requests, for a
    // streamed src) in the background indefinitely after this carousel is gone.
    this.loadedVideos.forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    if (this.ownsFluidTexture) this.fluidTexture.dispose();
    this.geo.dispose();
  }
}
