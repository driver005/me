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
	/** Per-card dome curve strength — see card/vertex.glsl's own comment. Default -1.85 (the source's
	 *  own value); pass 0 for a flat card. */
	crtStrength?: number;
	/** World-space arc strength (card/vertex.glsl's `pos.x += curved*uCurveX*...`/`pos.z -=
	 *  curved*uCurveZ*...`) — bends a strip's cards sideways/in-depth the farther they scroll from
	 *  centre, on top of (and independent from) the per-card dome above. Omit to track the scene's own
	 *  shared uCurveX/uCurveZ uniforms (today's behavior, live-updating with them); pass explicit
	 *  numbers (0 for none) to fix this card's strip to its own value regardless of the scene's. */
	curveX?: number;
	curveZ?: number;
}

export class Card {
	mesh: THREE.Mesh;
	material: THREE.ShaderMaterial;
	private hoverTween: gsap.core.Tween | gsap.core.Timeline | null = null;
	private baseScale: THREE.Vector3;

	constructor(scene: Scene, options: CardOptions) {
		const geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
		const texture = new THREE.TextureLoader().load(options.textureUrl, (loadedTexture) => {
			this.material.uniforms.uSizes.value.set(loadedTexture.image.width, loadedTexture.image.height);
		});
		texture.generateMipmaps = false;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uSpeed: { value: 0 },
				uHover: { value: 0 },
				uProgress: { value: 0 },
				uWarp: { value: 0 },
				uAxis: { value: 0 },
				uCrtStrength: { value: options.crtStrength ?? -1.85 },
				uCurveZ: options.curveZ != null ? { value: options.curveZ } : scene.uniforms.uCurveZ,
				uCurveX: options.curveX != null ? { value: options.curveX } : scene.uniforms.uCurveX,
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
		this.baseScale = this.mesh.scale.clone();
	}

	/** Which color-grading pass this render is for — Images renders every Card twice per frame, once per mode. */
	setImageMode(mode: 0 | 1): void {
		this.material.uniforms.uImageMode.value = mode;
	}

	setActive(): void {
		this.hoverTween?.kill();
		this.hoverTween = gsap
			.timeline()
			.to(
				this.mesh.scale,
				{ x: this.baseScale.x * 1.08, y: this.baseScale.y * 1.08, duration: 0.8, ease: 'power3.out', overwrite: 'auto' },
				0
			)
			.to(this.material.uniforms.uHover, { value: 1, duration: 3, ease: 'expo.out' }, 0);
	}

	setInactive(): void {
		this.hoverTween?.kill();
		this.hoverTween = gsap
			.timeline()
			.to(
				this.mesh.scale,
				{ x: this.baseScale.x, y: this.baseScale.y, duration: 0.8, ease: 'power3.out', overwrite: 'auto' },
				0
			)
			.to(this.material.uniforms.uHover, { value: 0, duration: 1, ease: 'expo.out' }, 0);
	}

	dispose(): void {
		this.hoverTween?.kill();
		this.mesh.geometry.dispose();
		this.material.dispose();
		(this.material.uniforms.tMap.value as THREE.Texture)?.dispose();
	}
}
