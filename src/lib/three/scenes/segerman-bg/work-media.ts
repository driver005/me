import * as THREE from 'three';
import type { Scene } from './scene';
import { createPlaceholderTexture } from './placeholder-textures';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import workMediaVertex from '$lib/shaders/segerman-bg/work-media/vertex.glsl';
// @ts-ignore
import videoFragment from '$lib/shaders/segerman-bg/video-card/fragment.glsl';

export interface WorkMediaOptions {
	videoUrl: string;
	width: number;
	height: number;
}

/**
 * One item in a project's in-page media carousel (Work.KlPQz3rX.js's class `y`, fetched via
 * Firecrawl). Reuses VideoCard's fragment shader (identical uniform needs) but a different vertex
 * shader (workImageVertex.GqdicV0I.js) — in back mode it wraps the whole strip around a large
 * cylinder instead of the home gallery's small per-card curl.
 */
export class WorkMedia {
	mesh: THREE.Mesh;
	material: THREE.ShaderMaterial;
	private video: HTMLVideoElement;
	private videoTexture: THREE.VideoTexture;
	private placeholder = createPlaceholderTexture();

	constructor(scene: Scene, options: WorkMediaOptions) {
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
				uOffsetY: { value: 0 },
				uBackMode: { value: 0 },
				uLoad: { value: 1 },
				uMode: scene.uniforms.uMode,
				uSpeed: { value: 0 },
				uHover: { value: 0 },
				uWarp: { value: 0.5 }
			},
			vertexShader: workMediaVertex,
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

	playVideo(): void {
		void this.video.play().catch(() => {});
	}

	pauseVideo(): void {
		this.video.pause();
	}

	dispose(): void {
		this.pauseVideo();
		this.video.removeAttribute('src');
		this.video.load();
		this.videoTexture.dispose();
		this.placeholder.dispose();
		this.mesh.geometry.dispose();
		this.material.dispose();
	}
}
