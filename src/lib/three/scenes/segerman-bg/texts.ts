import * as THREE from 'three';
import gsap from 'gsap';
import { Layer } from './layer';
import type { Scene } from './scene';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it (see src/lib/three/extra/caffee.svelte for the same pattern)
import textsVertex from '$lib/shaders/segerman-bg/texts/vertex.glsl';
// @ts-ignore
import iconFragment from '$lib/shaders/segerman-bg/texts/icon-fragment.glsl';

const SIZE_BASE = 0.44;
const SIZE_FULL = 0.95;
const SCALE_BASE = 1;
const SCALE_HOVER = 1.4;

export class Texts extends Layer {
	private scene: Scene;
	private textsScene = new THREE.Scene();
	private renderTarget: THREE.WebGLRenderTarget;
	private iconMesh: THREE.Mesh;
	private iconMaterial: THREE.ShaderMaterial;
	private baseWidth = 0;
	private baseHeight = 0;
	private baseX = 0;
	private baseY = 0;
	private scaleMultiplier = SCALE_BASE;
	private hoverTimeline: gsap.core.Timeline | null = null;

	constructor(scene: Scene, isBackMode: boolean) {
		super(scene.isTouch);
		this.scene = scene;
		this.renderTarget = scene.createRenderTarget(scene.dpr);

		this.iconMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uMode: scene.uniforms.uMode,
				uColor: { value: new THREE.Color('red') },
				uRadius: { value: 0.5 },
				uSize: { value: SIZE_BASE },
				uProgress: { value: isBackMode ? 1 : 0 },
				uOffset: { value: 0 }
			},
			vertexShader: textsVertex,
			fragmentShader: iconFragment,
			transparent: true
		});
		this.iconMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), this.iconMaterial);
		this.textsScene.add(this.iconMesh);
	}

	get texture(): THREE.Texture {
		return this.renderTarget.texture;
	}

	/** Called by Toggle.svelte on mount and on window resize, with the button's current getBoundingClientRect(). */
	syncButtonRect(rect: DOMRect): void {
		const { widthAtZ, heightAtZ } = this.scene;
		this.baseWidth = (rect.width / window.innerWidth) * widthAtZ;
		this.baseHeight = (rect.height / window.innerHeight) * heightAtZ;
		this.baseX = (rect.left / window.innerWidth) * widthAtZ - widthAtZ / 2 + this.baseWidth / 2;
		this.baseY = -((rect.top / window.innerHeight) * heightAtZ - heightAtZ / 2) - this.baseHeight / 2;
		this.applyTransform();
	}

	private applyTransform(): void {
		this.iconMesh.scale.set(this.baseWidth * this.scaleMultiplier, this.baseHeight * this.scaleMultiplier, 1);
		this.iconMesh.position.set(this.baseX, this.baseY, 0);
	}

	/** Ported from Ha.in() — isBackMode is the CURRENT mode (hover never flips it). */
	handleIn(isBackMode: boolean): void {
		this.hoverTimeline?.kill();
		this.hoverTimeline = gsap.timeline();
		this.hoverTimeline.to(this.iconMaterial.uniforms.uProgress, { value: 1, duration: 0.8, ease: 'power3.inOut' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_FULL, duration: 0.4, ease: 'power3.in' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_BASE, duration: 0.4, ease: 'power3.out' }, 0.4);
		if (isBackMode) {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 0, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_BASE);
		} else {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 1, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_HOVER);
		}
	}

	/** Ported from Ha.out() — isBackMode is the CURRENT mode (hover never flips it). */
	handleOut(isBackMode: boolean): void {
		this.hoverTimeline?.kill();
		this.hoverTimeline = gsap.timeline();
		this.hoverTimeline.to(this.iconMaterial.uniforms.uProgress, { value: 0, duration: 0.8, ease: 'power3.inOut' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_FULL, duration: 0.4, ease: 'power3.in' }, 0);
		this.hoverTimeline.to(this.iconMaterial.uniforms.uSize, { value: SIZE_BASE, duration: 0.4, ease: 'power3.out' }, 0.4);
		if (isBackMode) {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 1, duration: 0.8, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_HOVER);
		} else {
			this.hoverTimeline.to(this.scene.uniforms.uToggleProgress, { value: 0, duration: 0.4, ease: 'power3.out' }, 0);
			this.tweenScale(SCALE_BASE);
		}
	}

	private tweenScale(target: number): void {
		const scaleState = { value: this.scaleMultiplier };
		this.hoverTimeline!.to(
			scaleState,
			{
				value: target,
				duration: 0.8,
				ease: 'power3.out',
				onUpdate: () => {
					this.scaleMultiplier = scaleState.value;
					this.applyTransform();
				}
			},
			0
		);
	}

	loop(): void {
		this.render();
	}

	render(): void {
		const renderer = this.scene.renderer;
		renderer.setRenderTarget(this.renderTarget);
		renderer.clear();
		renderer.render(this.textsScene, this.scene.camera);
	}

	dispose(): void {
		this.hoverTimeline?.kill();
		this.iconMaterial.dispose();
		this.iconMesh.geometry.dispose();
	}
}
