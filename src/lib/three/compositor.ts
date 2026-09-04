import * as THREE from "three";
import gsap from "gsap";
import type { Scene } from "./scene";
import type { PlanetPageId } from "./planet/planet";
import type { Stars } from "./layers/stars";
import type { Fog } from "./layers/fog";
import type { FluidSim } from "./layers/fluid";
import type { PlanetSource } from "./planet/planet-switcher";
import type { Front } from "./layers/front";
import type { Images } from "./layers/images";
import type { Video } from "./layers/video";
import type { Texts } from "./layers/texts";
import { createPlaceholderTexture } from "./shared/placeholder-textures";
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/effects/coffee-steam.ts for the same pattern)
import backFragment from "$lib/shaders/compositor/back-fragment.glsl";
// @ts-ignore
import outputFragment from "$lib/shaders/compositor/output-fragment.glsl";
// @ts-ignore
import fullscreenVertex from "$lib/shaders/common/fullscreen-triangle.glsl";

export interface CompositorLayers {
  stars: Stars;
  fog: Fog;
  fluid: FluidSim;
  planet: PlanetSource;
  front: Front;
  images: Images;
  video: Video;
  texts: Texts;
}

// Per-page "look" — one table for all three, not scattered across separate Records/constants in
// different files. `glow` is the strength of the bloom halo the back-fragment shader adds around
// media/planet edges (verbatim from world.js's own back-compositor class, its `this.glowStr`; home
// was already ported as this class's uGlowStrength default of 0.9, the other pages never were). `fog`
// is the MAXIMUM fog blend strength (brightness/opacity of a patch once it's showing — see
// Compositor.setFogIntensity()'s own comment). `fogCoverage` is a SEPARATE knob — how much of the
// screen counts as a patch at all, independent of how bright those patches are — a plain 0..1
// fraction (see Fog.setCoverage()'s own comment in layers/fog.ts): 0 is almost no coverage, 1 is the
// whole page. The route layout still
// decides WHETHER fog is on at all right now (isBackMode || dark mode, gating logic that belongs with
// the UI state driving it, not with this per-page data), but every per-page NUMBER lives here, next
// to glow, instead of separate near-identical constants scattered across files.
export const PAGE_LOOK: Record<PlanetPageId, { glow: number; fog: number; fogCoverage: number }> = {
  home: { glow: 0.6, fog: 0.8, fogCoverage: 0.8 },
  work: { glow: 0.4, fog: 0.85, fogCoverage: 0.9 },
  about: { glow: 0.1, fog: 0.75, fogCoverage: 0.75 },
  skills: { glow: 0.4, fog: 0.6, fogCoverage: 0.6 },
  error: { glow: 0, fog: 0, fogCoverage: 0 },
};

export class Compositor {
  private scene: Scene;
  private backRT: THREE.WebGLRenderTarget;
  private backMaterial: THREE.ShaderMaterial;
  private backMesh: THREE.Mesh;
  private outputMaterial: THREE.ShaderMaterial;
  private outputMesh: THREE.Mesh;
  private placeholder = createPlaceholderTexture();
  private fluidSim: FluidSim;
  private frontLayer: Front;
  private planetLayer: PlanetSource;
  private imagesLayer: Images;
  private videoLayer: Video;
  private textsLayer: Texts;
  private pageTimeline: gsap.core.Timeline | null = null;
  private fogIntensityTween: gsap.core.Tween | null = null;
  private lastPageId: PlanetPageId | null = null;

  constructor(scene: Scene, layers: CompositorLayers) {
    this.scene = scene;
    this.fluidSim = layers.fluid;
    this.frontLayer = layers.front;
    this.planetLayer = layers.planet;
    this.imagesLayer = layers.images;
    this.videoLayer = layers.video;
    this.textsLayer = layers.texts;
    this.backRT = scene.createRenderTarget(scene.isMobile ? scene.dpr : Math.min(scene.dpr, 1.5));

    this.backMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMode: scene.uniforms.uMode,
        tFluid: { value: layers.fluid.texture },
        tStars: { value: layers.stars.texture },
        tPlanet: { value: layers.planet.texture },
        tPlanetBlur: { value: layers.planet.blurTexture },
        tFog: { value: layers.fog.texture },
        tTexts: { value: layers.texts.texture },
        tTitlesSoft: { value: this.placeholder },
        tTitlesBlur: { value: this.placeholder },
        tImagesBack: { value: layers.images.backTexture },
        tImagesBackBloom: { value: layers.images.backBloomTexture },
        tVideo: { value: layers.video.texture },
        uTime: scene.uniforms.uTime,
        uRes: scene.uniforms.uRes,
        uDpr: scene.uniforms.uDpr,
        uIsMobile: { value: scene.isMobile ? 1 : 0 },
        // 0, not 1 — same reasoning as fog.ts's own uHasFog default: starting at max meant the first
        // real setFogIntensity() call (route effect, on mount) visibly tweened it DOWN to the page's
        // actual target, reading as a strong flash that fades weaker instead of a clean fade-in.
        uHasFog: { value: 0 },
        uTextColor: { value: new THREE.Color("#ffffff").convertLinearToSRGB() },
        uLabelColor: { value: new THREE.Color("#93949f").convertLinearToSRGB() },
        uGrainAmount: { value: 0.025 },
        uBloomTint: { value: 0.01 },
        uBloomTintThreshold: { value: 0.95 },
        uBloomBleed: { value: 0.6 },
        uGlowStrength: { value: 0.9 },
        uGlowFogDull: { value: 0.05 },
        uOnPlaneBloom: { value: 0.3 },
        uProjMaskMin: { value: 0 },
        uProjMaskMax: { value: 0 },
        uCentreProxMin: { value: 0 },
        uCentreProxMax: { value: 0.8 },
        uFogErosionEdge: { value: 0.9 },
        uFogErosionCentre: { value: 0.1 },
        uMediaCurveEdge: { value: 1.5 },
        uSmokeBrightness: { value: 0.7 },
        uSmokeFogMod: { value: 0.6 },
        uSmokeDesat: { value: 0.3 },
        uStarsRGB: { value: 0.001 },
        uImagesRGB: { value: 0.001 },
        uVideoRGB: { value: 0.001 },
        uFogRGB: { value: 0.007 },
        uPlanetBlurAmt: { value: 1 },
      },
      vertexShader: fullscreenVertex,
      fragmentShader: backFragment,
    });
    this.backMesh = new THREE.Mesh(scene.fullScreenTriangle, this.backMaterial);
    this.backMesh.frustumCulled = false;

    this.outputMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tBack: { value: this.backRT.texture },
        tFront: { value: layers.front.texture },
        tFluid: { value: layers.fluid.texture },
        uTime: scene.uniforms.uTime,
        uIsTouch: scene.uniforms.uIsTouch,
        uMode: scene.uniforms.uMode,
        uRes: scene.uniforms.uRes,
        uToggleCoords: scene.uniforms.uToggleCoords,
        uToggleProgress: scene.uniforms.uToggleProgress,
        uDirection: scene.uniforms.uDirection,
        uProgressFront: scene.uniforms.uProgressFront,
        uProgressBack: scene.uniforms.uProgressBack,
        uWarp: scene.uniforms.uWarp,
      },
      vertexShader: fullscreenVertex,
      fragmentShader: outputFragment,
    });
    this.outputMesh = new THREE.Mesh(scene.fullScreenTriangle, this.outputMaterial);
    this.outputMesh.frustumCulled = false;
  }

  /** Tweens the back layer's glow strength to the given page's value (PAGE_LOOK[pageId].glow) — called
   *  by the route layout alongside Planet.animate(), on every navigation. Fog's own blend strength is
   *  a separate call now — see setFogIntensity()'s own comment. */
  setPage(pageId: PlanetPageId): void {
    if (pageId === this.lastPageId) return;
    this.lastPageId = pageId;
    this.pageTimeline?.kill();
    this.pageTimeline = gsap.timeline();
    this.pageTimeline.to(
      this.backMaterial.uniforms.uGlowStrength,
      { value: PAGE_LOOK[pageId].glow, duration: 2.3, ease: "power3.inOut" },
      0,
    );
  }

  /** The ONE fog strength control — tweens uHasFog, and nothing else. back-fragment.glsl derives
   *  every other fog-related quantity (blend weight, ambient boost, color) from that single scale now
   *  (see its own comment right where fogT is computed), so this is a genuine single dial: 0 is fully
   *  off, 1 is full strength, linearly in between.
   *
   *  Split out from setPage() because fog visibility on `/` also depends on dark/light mode and
   *  isBackMode, not just the page — the route layout reads PAGE_LOOK[pageId].fog as the per-page
   *  MAXIMUM, decides whether that gate is currently open, and passes the result straight through;
   *  this class doesn't need to know about mode/isBackMode itself. */
  setFogIntensity(value: number): void {
    this.fogIntensityTween?.kill();
    this.fogIntensityTween = gsap.to(this.backMaterial.uniforms.uHasFog, {
      value,
      duration: 2.3,
      ease: "power3.inOut",
    });
  }

  render(): void {
    const renderer = this.scene.renderer;
    this.backMaterial.uniforms.tFluid.value = this.fluidSim.texture;
    // tPlanet, like tPlanetBlur below, must be re-read every frame, not just captured once at
    // construction — `layers.planet` is a PlanetSwitcher now, not a single stable Planet instance,
    // so which texture ".texture" resolves to changes as the route swaps the active planet
    // (Earth/Moon/Mars/mesh). A stale reference here freezes on whichever planet was active when
    // Compositor was constructed instead of following the switch, mismatching the (already
    // per-frame) tPlanetBlur and reading as a half-transparent, wrong-planet composite.
    this.backMaterial.uniforms.tPlanet.value = this.planetLayer.texture;
    this.backMaterial.uniforms.tPlanetBlur.value = this.planetLayer.blurTexture;
    this.backMaterial.uniforms.tImagesBack.value = this.imagesLayer.backTexture;
    this.backMaterial.uniforms.tImagesBackBloom.value = this.imagesLayer.backBloomTexture;
    this.backMaterial.uniforms.tVideo.value = this.videoLayer.texture;
    this.backMaterial.uniforms.tTexts.value = this.textsLayer.texture;
    this.outputMaterial.uniforms.tFluid.value = this.fluidSim.texture;
    // tFront's texture identity is actually stable frame-to-frame (unlike tFluid's ping-pong swap) — this
    // live-read isn't strictly required today, but it mirrors the original site's own per-frame assignment
    // and costs one property write, so it's kept for fidelity and to stay correct if Front's RT strategy changes.
    this.outputMaterial.uniforms.tFront.value = this.frontLayer.texture;
    renderer.setRenderTarget(this.backRT);
    renderer.render(this.backMesh, this.scene.camera);

    renderer.setRenderTarget(null);
    renderer.render(this.outputMesh, this.scene.camera);
  }

  dispose(): void {
    this.pageTimeline?.kill();
    this.fogIntensityTween?.kill();
    this.backMaterial.dispose();
    this.outputMaterial.dispose();
    this.placeholder.dispose();
  }
}
