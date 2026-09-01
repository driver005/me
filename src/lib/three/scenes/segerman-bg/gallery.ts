import * as THREE from 'three';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';

export interface ProjectDef {
	slug: string;
	textureUrl: string;
	videoUrl: string;
}

const CARD_WIDTH = 52;
const CARD_HEIGHT = 32;
const GAP_FRONT = 26.7;
const GAP_BACK = 89;

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

	private scene: Scene;
	private group = new THREE.Group();
	private groupPivot = new THREE.Group();
	private gap = GAP_FRONT;
	/** Raw wheel-accumulated scroll position — see Task 5's temporary scroll-input substitute. */
	scrollPosition = 0;
	private mouseOffset = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };
	private mouseTarget = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };

	constructor(scene: Scene, projects: ProjectDef[]) {
		this.scene = scene;
		this.groupPivot.add(this.group);
		this.imageScene.add(this.groupPivot);

		for (const project of projects) {
			const card = new Card(scene, { textureUrl: project.textureUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.group.add(card.mesh);
			this.cards.push(card);

			const videoCard = new VideoCard(scene, { videoUrl: project.videoUrl, width: CARD_WIDTH, height: CARD_HEIGHT });
			this.videoScene.add(videoCard.mesh);
			this.videoCards.push(videoCard);
		}

		for (let i = 0; i < this.cards.length; i++) {
			this.cards[i].mesh.visible = true;
			this.cards[i].material.uniforms.uProgress.value = 1;
			this.cards[i].material.uniforms.uWarp.value = 1;
		}
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

		for (let i = 0; i < this.cards.length; i++) {
			let x = step * i - wrapped;
			x = ((x + totalWidth / 2) % totalWidth + totalWidth) % totalWidth - totalWidth / 2;
			this.cards[i].mesh.position.x = x;
			this.videoCards[i].mesh.position.x = x;
			this.videoCards[i].mesh.position.y = this.cards[i].mesh.position.y;
			this.videoCards[i].mesh.position.z = this.cards[i].mesh.position.z + 0.01;
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

	/** Called once per frame by Images/Video layers before rendering — Task 5 adds handleHover() to this same method. */
	update(): void {
		this.updateItems();
		this.updateGroup();
	}

	dispose(): void {
		for (const card of this.cards) card.dispose();
		for (const videoCard of this.videoCards) videoCard.dispose();
	}
}
