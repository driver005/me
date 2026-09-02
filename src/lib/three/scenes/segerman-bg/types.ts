import type * as THREE from 'three';

export interface SceneUniforms {
	uTime: { value: number };
	uRes: { value: THREE.Vector2 };
	uDpr: { value: number };
	uMode: { value: number };
	uIsTouch: { value: number };
	uCurveX: { value: number };
	uCurveZ: { value: number };
	uToggleCoords: { value: THREE.Vector2 };
	uToggleProgress: { value: number };
}

export interface PointerState {
	x: number;
	y: number;
	dx: number;
	dy: number;
	nx: number;
	ny: number;
	speed: number;
	isDown: boolean;
}
