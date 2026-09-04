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

// Per-page look: glow (bloom halo strength), fog (max blend strength), fogCoverage (0..1 fraction).
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
        uHasFog: { value: 0 }, // 0 not 1 — prevents a flash on first setFogIntensity() tween
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

  /** Tweens uHasFog from 0 (off) to 1 (full strength). back-fragment.glsl derives all fog
   *  quantities from this single dial. */
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
    // tPlanet must be re-read every frame — layers.planet is a PlanetSwitcher, not a stable instance.
    this.backMaterial.uniforms.tPlanet.value = this.planetLayer.texture;
    this.backMaterial.uniforms.tPlanetBlur.value = this.planetLayer.blurTexture;
    this.backMaterial.uniforms.tImagesBack.value = this.imagesLayer.backTexture;
    this.backMaterial.uniforms.tImagesBackBloom.value = this.imagesLayer.backBloomTexture;
    this.backMaterial.uniforms.tVideo.value = this.videoLayer.texture;
    this.backMaterial.uniforms.tTexts.value = this.textsLayer.texture;
    this.outputMaterial.uniforms.tFluid.value = this.fluidSim.texture;
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
