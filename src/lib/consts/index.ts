import * as THREE from "three";

export const START = new THREE.Vector3(0, 0, 0);
export const LIFE_END = new THREE.Vector3(0, 0, 80);

export const STARTING_POSITION = new THREE.Vector3(0, 0, 0);
export const LIFE_STARTING_POSITION = new THREE.Vector3(0, 0, 5);
export const LIFE_ENDING_POSITION = LIFE_END.clone().sub(new THREE.Vector3(0, 0, 10));

export const PROJECT_OFFSET = LIFE_END.clone().add(new THREE.Vector3(0, 0, 50));
export const SKILL_OFFSET = PROJECT_OFFSET.clone().add(new THREE.Vector3(-40, 0, 30));
export const SKILL_ROTATION = new THREE.Euler(0, Math.PI / 2, 0);
export const SKILL_ROTATION_TEXT = new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2);

export const PROJECT_SCREEN_WIDTH = 60;
export const PROJECT_SCREEN_HEIGHT = 40;
export const PROJECT_SCREEN_RADIUS = 1.2;

export const DEFAULT_RESOLUTION_WIDTH = 1920;
export const DEFAULT_RESOLUTION_HEIGHT = 1080;