import * as THREE from 'three';

const CANVAS_HEIGHT = 128;
const FONT_PX = 88;
const PADDING_PX = 24;

/**
 * Project title rendered via a canvas-rasterized texture (not troika-three-text/SDF, which the
 * original site uses via custom webfonts we never scraped) — a plain, well-precedented three.js
 * pattern that avoids adding a heavy text-rendering dependency and missing font assets for what
 * is, in this port, a handful of short static strings.
 */
export class Title {
	mesh: THREE.Mesh;
	private material: THREE.MeshBasicMaterial;
	private texture: THREE.CanvasTexture;

	constructor(text: string, worldHeight: number) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		ctx.font = `700 ${FONT_PX}px system-ui, sans-serif`;
		const textWidth = ctx.measureText(text.toUpperCase()).width;
		canvas.width = Math.ceil(textWidth + PADDING_PX * 2);
		canvas.height = CANVAS_HEIGHT;

		ctx.font = `700 ${FONT_PX}px system-ui, sans-serif`;
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(text.toUpperCase(), PADDING_PX, canvas.height / 2);

		this.texture = new THREE.CanvasTexture(canvas);
		this.texture.generateMipmaps = false;
		this.texture.minFilter = THREE.LinearFilter;
		this.texture.magFilter = THREE.LinearFilter;

		this.material = new THREE.MeshBasicMaterial({
			map: this.texture,
			transparent: true,
			depthWrite: false
		});

		const worldWidth = (canvas.width / canvas.height) * worldHeight;
		const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.scale.set(worldWidth, worldHeight, 1);
		this.mesh.frustumCulled = false;
	}

	dispose(): void {
		this.material.dispose();
		this.texture.dispose();
		this.mesh.geometry.dispose();
	}
}
