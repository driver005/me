import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { Blur } from './blur';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import planetVertex from '$lib/shaders/segerman-bg/planet/vertex.glsl';
// @ts-ignore
import planetFragment from '$lib/shaders/segerman-bg/planet/fragment.glsl';
// @ts-ignore
import trailVertex from '$lib/shaders/segerman-bg/planet/trail-vertex.glsl';
// @ts-ignore
import trailFragment from '$lib/shaders/segerman-bg/planet/trail-fragment.glsl';

export interface PlanetTextures {
	map: THREE.Texture;
	cracked: THREE.Texture;
	crackedNormal: THREE.Texture;
}

export class Planet extends Layer {
	mesh: THREE.Mesh;
	renderTarget: THREE.WebGLRenderTarget;
	private scene: Scene;
	private material: THREE.ShaderMaterial;
	private innerScene = new THREE.Scene();
	private blur: Blur;
	private blurRTA: THREE.WebGLRenderTarget;
	private blurRTB: THREE.WebGLRenderTarget;
	private blurTextureValue: THREE.Texture | null = null;
	private raycaster = new THREE.Raycaster();
	private pointerNDC = new THREE.Vector2();
	private mouseWorldTarget = new THREE.Vector3();
	private mouseUVTarget = new THREE.Vector2();
	private mouseHoverTarget = 0;
	private mouseHover = 0;
	private crackMode = 0;
	private trailRTA: THREE.WebGLRenderTarget;
	private trailRTB: THREE.WebGLRenderTarget;
	private trailMaterial: THREE.ShaderMaterial;
	private trailMesh: THREE.Mesh;
	private trailScene = new THREE.Scene();
	private trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

	constructor(scene: Scene, textures: PlanetTextures) {
		super(scene.isTouch);
		this.scene = scene;

		const scale = scene.isMobile ? 1 : 0.8;
		this.renderTarget = scene.createRenderTarget(scale);
		this.blur = new Blur(scene);
		this.blurRTA = scene.createRenderTarget(0.15);
		this.blurRTB = scene.createRenderTarget(0.15);

		const geometry = new THREE.SphereGeometry(93, 128, 128);
		geometry.computeTangents();

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				uColor: { value: new THREE.Color('#00060a').convertLinearToSRGB() },
				uRimPow: { value: 4.5 },
				uGlowPow: { value: 3.2 },
				uGlowStr: { value: 1 },
				uRimStr: { value: 0 },
				uLightColor: { value: new THREE.Color('#81aeca') },
				uDarkColor: { value: new THREE.Color('#436eb1') },
				uLightStart: { value: 0.4 },
				uLightEnd: { value: 1 },
				uTerrainScale: { value: 3.9 },
				uTerrainHeight: { value: 0.7 },
				uTerrainDetail: { value: 1.5 },
				uTerrainTime: { value: 0 },
				uGlowBiasX: { value: -0.6 },
				uGlowBiasY: { value: 0 },
				uBiasGlowStr: { value: 1.5 },
				uBiasGlowPow: { value: 7 },
				uMouseWorld: { value: new THREE.Vector3(0, 0, 1000) },
				uMouseRadius: { value: 0.9 },
				uMouseStrength: { value: 0 },
				uTime: scene.uniforms.uTime,
				uMode: scene.uniforms.uMode,
				uIsIntro: { value: 0 },
				uIsMobile: { value: scene.isMobile ? 1 : 0 },
				uRes: scene.uniforms.uRes,
				tMap: { value: textures.map },
				tCracked: { value: textures.cracked },
				tCrackedNormal: { value: textures.crackedNormal },
				uTrailMap: { value: null },
				uRevealRadius: { value: 1.5 },
				uCrackStr: { value: 2 },
				uCrackActive: { value: 0 },
				uNormalStr: { value: 1.2 }
			},
			vertexShader: planetVertex,
			fragmentShader: planetFragment
		});

		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.position.set(62, -26, -10);
		this.innerScene.add(this.mesh);

		this.trailRTA = new THREE.WebGLRenderTarget(512, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RedFormat, type: THREE.HalfFloatType });
		this.trailRTB = this.trailRTA.clone();
		this.trailMaterial = new THREE.ShaderMaterial({
			uniforms: {
				tTrail: { value: null },
				uRes: { value: new THREE.Vector2(512, 256) },
				uMouseUV: { value: new THREE.Vector2(0.5, 0.5) },
				uDecay: { value: 0.995 },
				uStampRadius: { value: 0.06 },
				uActive: { value: 0 }
			},
			vertexShader: trailVertex,
			fragmentShader: trailFragment
		});
		this.trailMesh = new THREE.Mesh(scene.fullScreenTriangle, this.trailMaterial);
		this.trailScene.add(this.trailMesh);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	get blurTexture(): THREE.Texture {
		return this.blurTextureValue ?? this.renderTarget.texture;
	}

	/** Exposed for Task 8 (hover-crack trail) to set the trail render target's texture and drive uCrackActive/uMouseStrength. */
	get uniforms() {
		return this.material.uniforms;
	}

	setPointerNDC(nx: number, ny: number): void {
		this.pointerNDC.set(nx, ny);
		this.raycaster.setFromCamera(this.pointerNDC, this.scene.camera);
		const hits = this.raycaster.intersectObject(this.mesh);
		if (hits.length > 0 && hits[0].uv) {
			this.mouseWorldTarget.copy(hits[0].point);
			this.mouseUVTarget.copy(hits[0].uv);
			this.mouseHoverTarget = 1;
		} else {
			this.mouseHoverTarget = 0;
		}
	}

	render(): void {
		this.material.uniforms.uTerrainTime.value += (1 / 60) * 0.1;
		this.mesh.rotation.y += 0.0008;

		this.crackMode += (1 - this.crackMode) * 0.03;
		this.mouseHover += (this.mouseHoverTarget - this.mouseHover) * 0.04;
		if (this.mouseHoverTarget === 1) {
			this.material.uniforms.uMouseWorld.value.lerp(this.mouseWorldTarget, 0.06);
		}
		this.material.uniforms.uMouseStrength.value = this.mouseHover * this.crackMode * 0.9;
		this.material.uniforms.uCrackActive.value = this.crackMode;

		if (this.crackMode > 0.001) {
			this.trailMaterial.uniforms.tTrail.value = this.trailRTA.texture;
			this.trailMaterial.uniforms.uActive.value = this.mouseHoverTarget * this.crackMode;
			this.trailMaterial.uniforms.uMouseUV.value.copy(this.mouseUVTarget);
			this.scene.renderer.setRenderTarget(this.trailRTB);
			this.scene.renderer.render(this.trailScene, this.trailCamera);
			[this.trailRTA, this.trailRTB] = [this.trailRTB, this.trailRTA];
			this.material.uniforms.uTrailMap.value = this.trailRTA.texture;
		}

		this.scene.renderer.setRenderTarget(this.renderTarget);
		this.scene.renderer.render(this.innerScene, this.scene.camera);

		this.blurTextureValue = this.blur.apply(this.renderTarget.texture, this.blurRTA, this.blurRTB, 1);
	}

	loop(): void {
		this.render();
	}

	dispose(): void {
		this.mesh.geometry.dispose();
		this.material.dispose();
		this.blur.dispose();
		this.trailRTA.dispose();
		this.trailRTB.dispose();
		this.trailMaterial.dispose();
	}
}
