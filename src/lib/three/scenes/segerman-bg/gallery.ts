import * as THREE from 'three';
import gsap from 'gsap';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';
import { Title } from './title';

export interface ProjectDef {
	slug: string;
	title: string;
	textureUrl: string;
	videoUrl: string;
}

const TITLE_HEIGHT = 4;
const TITLE_OFFSET_Y = -20;

const CARD_WIDTH = 52;
const CARD_HEIGHT = 32;
// Derived at the same ~0.95 units/rem ratio CARD_WIDTH itself uses (52 units for the original's 54.8rem
// card element) — the original gaps are 2.4rem/8rem. Phase 2b's final review flagged the previous values
// (26.7/89) as using an ~11.1 units/rem ratio instead, an ~11.7x mismatch that spread the strip out far
// more than the source (only ~2 cards visible on screen at 16:9 instead of several).
const GAP_FRONT = 2.28;
const GAP_BACK = 7.59;

const BACK_STATE = {
	rotationX: 0,
	rotationY: -0.49,
	rotationZ: 0,
	positionX: -5.3,
	positionY: 0,
	positionZ: -14
};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export class Gallery {
	imageScene = new THREE.Scene();
	videoScene = new THREE.Scene();

	cards: Card[] = [];
	videoCards: VideoCard[] = [];
	titles: Title[] = [];
	projects: ProjectDef[];

	private scene: Scene;
	private group = new THREE.Group();
	private groupPivot = new THREE.Group();
	private gap = GAP_FRONT;
	/** Written every frame by the `Scroll` layer (real Lenis-driven input, phase 4). */
	scrollPosition = 0;
	private previousScrollPosition = 0;
	private mouseOffset = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };
	private mouseTarget = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };

	private _hoveredIndex: number | null = null;
	private _v = new THREE.Vector3();
	private _hitV = new THREE.Vector3();
	private _camMV = new THREE.Matrix4();
	private entranceTimelines: gsap.core.Timeline[] = [];

	constructor(scene: Scene, projects: ProjectDef[]) {
		this.scene = scene;
		this.projects = projects;
		this.groupPivot.add(this.group);
		this.imageScene.add(this.groupPivot);

		for (const project of projects) {
			const card = new Card(scene, { textureUrl: project.textureUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.group.add(card.mesh);
			this.cards.push(card);

			const videoCard = new VideoCard(scene, { videoUrl: project.videoUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.videoScene.add(videoCard.mesh);
			this.videoCards.push(videoCard);

			const title = new Title(project.title, TITLE_HEIGHT);
			this.group.add(title.mesh);
			this.titles.push(title);
		}

		for (let i = 0; i < this.cards.length; i++) {
			this.cards[i].mesh.visible = true;
			this.cards[i].material.uniforms.uProgress.value = 1;
			this.cards[i].material.uniforms.uWarp.value = 1;
		}
	}

	get hoveredIndex(): number | null {
		return this._hoveredIndex;
	}

	setMouseTarget(nx: number, ny: number): void {
		this.mouseTarget.posX = 0.3 * -nx;
		this.mouseTarget.posZ = 0.1 * -ny;
		this.mouseTarget.rotX = 0.05 * ny;
		this.mouseTarget.rotY = 0.1 * nx;
	}

	private updateItems(): void {
		const uMode = this.scene.uniforms.uMode.value;
		this.gap = lerp(GAP_BACK, GAP_FRONT, uMode);
		const step = CARD_WIDTH + this.gap;
		const totalWidth = step * this.cards.length;
		const wrapped = ((this.scrollPosition % totalWidth) + totalWidth) % totalWidth;

		// Gallery-wide scroll speed (simplified from the original's per-mesh tracked speed) drives each
		// card's warp shader — see card/vertex.glsl's `mix(-.00015, -(uSpeed*.2), uProgress)`.
		const speed = this.scrollPosition - this.previousScrollPosition;
		this.previousScrollPosition = this.scrollPosition;

		for (let i = 0; i < this.cards.length; i++) {
			let x = step * i - wrapped;
			x = ((x + totalWidth / 2) % totalWidth + totalWidth) % totalWidth - totalWidth / 2;
			this.cards[i].mesh.position.x = x;
			this.cards[i].material.uniforms.uSpeed.value = speed;
			this.videoCards[i].mesh.position.x = x;
			this.videoCards[i].mesh.position.y = this.cards[i].mesh.position.y;
			this.videoCards[i].mesh.position.z = this.cards[i].mesh.position.z + 0.01;
			this.videoCards[i].material.uniforms.uSpeed.value = speed;
			this.titles[i].mesh.position.x = x;
			this.titles[i].mesh.position.y = this.cards[i].mesh.position.y + TITLE_OFFSET_Y;
		}
	}

	private updateGroup(): void {
		const uMode = this.scene.uniforms.uMode.value;
		this.group.rotation.x = lerp(BACK_STATE.rotationX, 0, uMode);
		this.group.rotation.y = lerp(BACK_STATE.rotationY, 0, uMode);
		this.group.rotation.z = lerp(BACK_STATE.rotationZ, 0, uMode);
		this.group.position.x = lerp(BACK_STATE.positionX, 0, uMode);
		this.group.position.y = lerp(BACK_STATE.positionY, 0, uMode);
		this.group.position.z = lerp(BACK_STATE.positionZ, 0, uMode);

		this.mouseOffset.posX = lerp(this.mouseOffset.posX, this.mouseTarget.posX, 0.03);
		this.mouseOffset.posZ = lerp(this.mouseOffset.posZ, this.mouseTarget.posZ, 0.03);
		this.mouseOffset.rotX = lerp(this.mouseOffset.rotX, this.mouseTarget.rotX, 0.03);
		this.mouseOffset.rotY = lerp(this.mouseOffset.rotY, this.mouseTarget.rotY, 0.03);

		const frontness = 1 - uMode;
		this.groupPivot.position.x = this.mouseOffset.posX * frontness;
		this.groupPivot.position.z = this.mouseOffset.posZ * frontness;
		this.groupPivot.rotation.x = this.mouseOffset.rotX * frontness;
		this.groupPivot.rotation.y = this.mouseOffset.rotY * frontness;
	}

	handleHover(mouseNX: number, mouseNY: number): void {
		this.groupPivot.updateMatrixWorld(true);
		const camera = this.scene.camera;
		const uMode = this.scene.uniforms.uMode.value;
		const curveX = this.scene.uniforms.uCurveX.value;
		const curveZ = this.scene.uniforms.uCurveZ.value;
		const frontness = Math.abs(1 - uMode);
		const crtStrength = -1.85;

		let closestIndex: number | null = null;
		let closestZ = Infinity;

		for (let i = 0; i < this.cards.length; i++) {
			const mesh = this.cards[i].mesh;
			if (!mesh.visible) continue;

			const geometry = mesh.geometry;
			geometry.computeBoundingBox();
			const box = geometry.boundingBox!;

			this._camMV.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
			const planeDist = Math.abs(this._camMV.elements[13]);
			const curved = planeDist * planeDist;
			const curveXOffset = curved * curveX * frontness;
			const curveZCentre = -curved * curveZ * frontness;
			const curveZBase = crtStrength * 2 * frontness + curveZCentre;

			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			const corners: [number, number][] = [
				[box.min.x, box.min.y],
				[box.max.x, box.min.y],
				[box.min.x, box.max.y],
				[box.max.x, box.max.y]
			];
			for (const [cx, cy] of corners) {
				this._v.set(cx + curveXOffset, cy, curveZBase);
				this._v.applyMatrix4(mesh.matrixWorld);
				this._v.project(camera);
				if (this._v.x < minX) minX = this._v.x;
				if (this._v.x > maxX) maxX = this._v.x;
				if (this._v.y < minY) minY = this._v.y;
				if (this._v.y > maxY) maxY = this._v.y;
			}

			if (mouseNX >= minX && mouseNX <= maxX && mouseNY >= minY && mouseNY <= maxY) {
				this._hitV.set(curveXOffset, 0, curveZCentre).applyMatrix4(mesh.matrixWorld).project(camera);
				if (this._hitV.x < -1.2 || this._hitV.x > 1.2 || this._hitV.y < -1.2 || this._hitV.y > 1.2 || this._hitV.z >= 1) continue;
				if (this._hitV.z < closestZ) {
					closestZ = this._hitV.z;
					closestIndex = i;
				}
			}
		}

		if (closestIndex === this._hoveredIndex) return;
		if (this._hoveredIndex !== null) {
			this.cards[this._hoveredIndex].setInactive();
			this.videoCards[this._hoveredIndex].setOffsetOut();
		}
		this._hoveredIndex = closestIndex;
		if (this._hoveredIndex !== null) {
			this.cards[this._hoveredIndex].setActive();
			this.videoCards[this._hoveredIndex].setOffsetIn();
		}
	}

	playEntrance(): void {
		for (let i = 0; i < this.cards.length; i++) {
			const card = this.cards[i];
			card.material.uniforms.uProgress.value = 0;
			card.material.uniforms.uWarp.value = 0;
			const targetX = card.mesh.scale.x;
			const targetY = card.mesh.scale.y;
			card.mesh.scale.set(targetX * 0.001, targetY * 0.001, 1);
			const timeline = gsap
				.timeline({ delay: i * 0.1 })
				.to(card.mesh.scale, { x: targetX, y: targetY, duration: 1.2, ease: 'expo.out', overwrite: 'auto' }, 0)
				.to(card.material.uniforms.uProgress, { value: 1, duration: 1.6, ease: 'power2.out' }, 0)
				.to(card.material.uniforms.uWarp, { value: 1, duration: 1.4 }, 0.2);
			this.entranceTimelines.push(timeline);
		}
	}

	/** Called once per frame by Images/Video layers before rendering. */
	update(mouseNX: number, mouseNY: number): void {
		this.updateItems();
		this.updateGroup();
		this.handleHover(mouseNX, mouseNY);
	}

	dispose(): void {
		for (const timeline of this.entranceTimelines) timeline.kill();
		this.entranceTimelines = [];
		for (const card of this.cards) card.dispose();
		for (const videoCard of this.videoCards) videoCard.dispose();
		for (const title of this.titles) title.dispose();
	}
}
