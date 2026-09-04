import * as THREE from "three";
import gsap from "gsap";
import type { Scene } from "../scene";
import { createPlaceholderTexture } from "../shared/placeholder-textures";
import { CenterCube } from "./center-cube";
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import spiralVertex from "$lib/shaders/spiral/vertex.glsl";
// @ts-ignore
import spiralFragment from "$lib/shaders/spiral/fragment.glsl";

export interface SpiralCarouselItem {
  src: string;
  href?: string;
  /** 'image' (default) or 'video' — video plays via THREE.VideoTexture instead of a downscaled still. */
  type?: "image" | "video";
}

export interface SpiralCarouselOptions {
  /** 'spiral' (default) or 'horizontal' filmstrip. */
  mode?: "spiral" | "horizontal";
  /** Duotone with cursor-reveal (requires fluidTexture). */
  duotone?: boolean;
  /** Fluid texture for duotone cursor reveal. */
  fluidTexture?: THREE.Texture | null;
  /** Radians of twist between adjacent items. Default 0.85. */
  angleGap?: number;
  /** World-space spiral radius. Default scales with the item scale (see fitFactor below). */
  radius?: number;
  /** World-space center. Ignored if getCenter is given. */
  center?: { x: number; y: number; z: number };
  /** Re-evaluated every frame. Priority over `center` when both given. */
  getCenter?: () => { x: number; y: number; z: number };
  /** Called when a clickable (has `href`) item is clicked. */
  onItemClick?: (item: SpiralCarouselItem, index: number) => void;
  /** CenterCube — spinning, hit-tested, independent from the card group. */
  centerpiece?: {
    /** Cube edge length. Default 1.4x itemScale. */
    size?: number;
    onClick?: () => void;
    /** Cube world-space center, re-evaluated per frame. */
    getCenter?: () => { x: number; y: number; z: number };
  };
  /** Multiplies camera-derived scale. 1 = original /spiral proportions. Default 1. */
  fitFactor?: number;
  /** Shared camera z position. Default 100. */
  sharedCameraZ?: number;
  /** Original /spiral camera z position. Default 8. */
  spiralCameraZ?: number;
  /** Shared camera vertical FOV (degrees). Default 50. */
  sharedCameraFovDeg?: number;
  /** Original /spiral camera vertical FOV (degrees). Default 35. */
  spiralCameraFovDeg?: number;
  /** Radius as multiple of item scale. Default 2. */
  radiusRatio?: number;
  /** Idle drift speed floor. Default 0.002. */
  minWheelSpeed?: number;
  /** Per-frame easing rate for scroll speed. Default 0.1. */
  easing?: number;
}

interface CardState {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  /** GSAP-driven, feeds uColorStrength/uZoom in tick(). */
  hoverProgress: number;
  /** GSAP-driven scale multiplier (1.08x pop). */
  scalePop: number;
  /** GSAP-driven, 0.001→1 on spawn (grow-from-nothing pop). */
  entranceScale: number;
  hoverTween: gsap.core.Timeline | null;
  entranceTween: gsap.core.Timeline | null;
  hiddenProgress: number;
  hiddenTarget: number;
  isHidden: boolean;
}

/** Camera-distance ratio scaling: original z:8 → shared z:100, adjusted for FOV difference. */
const DEFAULT_SHARED_CAMERA_Z = 100;
const DEFAULT_SPIRAL_CAMERA_Z = 8;
const DEFAULT_SHARED_CAMERA_FOV_DEG = 50;
const DEFAULT_SPIRAL_CAMERA_FOV_DEG = 35;
/** Radius-to-item-scale ratio from original /spiral (1.18:1). */
const DEFAULT_RADIUS_RATIO = 2;
const DEFAULT_ANGLE_GAP = 0.85;
const DEFAULT_MIN_WHEEL_SPEED = 0.002;
const DEFAULT_EASING = 0.1;
/** Below this count, items are repeated end-to-end to fill the spiral. */
const MIN_ITEM_COUNT = 24;

/** Carousel layer sharing the engine's canvas/camera/renderer, driven via scene.appendOutput(). */
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
    // Repeat short item lists to reach MIN_ITEM_COUNT for spiral density.
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
    // Placeholder texture needed for valid sampler2D binding even when duotone is off.
    this.fluidTexture = options.fluidTexture ?? createPlaceholderTexture();
    this.ownsFluidTexture = !options.fluidTexture;
    // Dedup by src — repeated lists share one loaded texture per unique image.
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

  /** Downscale images to MAX_DIM on long edge before uploading to GPU. */
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

  /** Muted/looping/inline video → THREE.VideoTexture. */
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
      /* Autoplay may be refused — texture shows frozen first frame. */
    });
  }

  private spawnCard(idx: number, tex: THREE.Texture, duotone: boolean): void {
    const video = tex instanceof THREE.VideoTexture ? (tex.image as HTMLVideoElement) : null;
    const imgSource = tex.image as { width?: number; height?: number } | undefined;
    const imgW = video?.videoWidth || imgSource?.width || 1024;
    const imgH = video?.videoHeight || imgSource?.height || 683;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: tex },
        uColorStrength: { value: 0 },
        uZoom: { value: 1 },
        uPlaneSizes: { value: new THREE.Vector2(1.7, 1) },
        uImageSizes: { value: new THREE.Vector2(imgW, imgH) },
        uRevealProgress: { value: 0 },
        uScrollSpeed: { value: 0 },
        // uCurveStrength: scales spiral vertex curve term. 0 = straight column.
        uCurveStrength: { value: 0 },
        // Duotone params matching card/fragment.glsl defaults.
        uDuotone: { value: duotone ? 1 : 0 },
        uDarkColor: { value: new THREE.Color("#00031f") },
        uLightColor: { value: new THREE.Color("#ffffff") },
        uInputBlack: { value: 15 },
        uInputWhite: { value: 200 },
        uGamma: { value: 125 },
        uNoiseSize: { value: 3.8 },
        uNoiseAmount: { value: 0.12 },
        uDpr: { value: this.scene.dpr },
        // uTFluid: screen-space dye texture for duotone reveal. uRes: shared scene uniform.
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

  /** Grow-from-nothing scale pop, staggered by (idx%4)*50ms. */
  private playEntrance(cs: CardState, idx: number): void {
    cs.entranceTween?.kill();
    cs.entranceTween = gsap.timeline({ delay: (idx % 4) * 0.05 }).to(
      cs,
      { entranceScale: 1, duration: 1.2, ease: "expo.out", overwrite: "auto" },
      0,
    );
  }

  /** Hover pop: 1.08x scale (0.8s power3.out) + hoverProgress easing (3s expo.out). */
  private setCardActive(cs: CardState): void {
    cs.hoverTween?.kill();
    cs.hoverTween = gsap
      .timeline()
      .to(cs, { scalePop: 1.08, duration: 0.8, ease: "power3.out", overwrite: "auto" }, 0)
      .to(cs, { hoverProgress: 1, duration: 3, ease: "expo.out" }, 0);
  }

  /** Inverse of setCardActive. */
  private setCardInactive(cs: CardState): void {
    cs.hoverTween?.kill();
    cs.hoverTween = gsap
      .timeline()
      .to(cs, { scalePop: 1, duration: 0.8, ease: "power3.out", overwrite: "auto" }, 0)
      .to(cs, { hoverProgress: 0, duration: 1, ease: "expo.out" }, 0);
  }

  /** Per-frame: wheel/hover physics + draw call via scene.appendOutput(). */
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
        // +PI/2 phase: centers the resting card on x and faces camera.
        const Ha = Ba * this.angleGap + Math.PI / 2;
        cs.mesh.position.set(Math.cos(Ha) * Ga, Va, Math.sin(Ha) * Ga);
        cs.mesh.rotation.y = -Ha + Math.PI / 2;
      }

      const u = cs.mat.uniforms;
      // uColorStrength stays 0 (duotone darkening not used). uZoom at 1 + 0.08*hover matches card.ts.
      u.uZoom.value = 1 + 0.08 * cs.hoverProgress;
      u.uRevealProgress.value = (1 - cs.hoverProgress * 0.05) * (1 - cs.hiddenProgress);
      u.uScrollSpeed.value = this.wheelDelta;
      // scalePop * entranceScale = x/y scale (GSAP-driven, z untouched).
      const xyScale = this.itemScale * cs.scalePop * cs.entranceScale;
      cs.mesh.scale.set(xyScale, xyScale, this.itemScale);
    }

    if (this.centerCube) {
      const cubeCenter = this.centerpieceGetCenter?.() ?? { x: 0, y: 0, z: 0 };
      this.centerCube.mesh.position.set(cubeCenter.x, cubeCenter.y, cubeCenter.z);
      this.centerCube.spin(delta);
    }

    // Covers cube (sibling of group) and all cards in one call.
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

    // autoClear off: draw on top of compositor output. clearDepth resets depth buffer only.
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
    // Pause/clear <video> elements to stop background decoding after disposal.
    this.loadedVideos.forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    if (this.ownsFluidTexture) this.fluidTexture.dispose();
    this.geo.dispose();
  }
}
