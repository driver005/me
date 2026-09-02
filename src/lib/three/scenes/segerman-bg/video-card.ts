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
				uLoad: { value: 1 },
				uMode: scene.uniforms.uMode,
				uCurveX: scene.uniforms.uCurveX,
				uCurveZ: scene.uniforms.uCurveZ,
				uSpeed: { value: 0 },
				uHover: { value: 0 },
				uProgress: { value: 1 },
				uWarp: { value: 1 },
				uAxis: { value: 0 }
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
