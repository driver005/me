import { LIFE_END, PROJECT_OFFSET, PROJECT_SCEEN_HEIGHT, PROJECT_SCEEN_WIDHT } from "$lib/consts";
import { offset_curve } from "$lib/utils/curves";
import type { CameraControlsRef } from "@threlte/extras";
import * as THREE from "three";

const STARTING_POSITION = new THREE.Vector3(0, 2, -4);

// STARTING

export const STARTING_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(1, 0.4, 0),
  new THREE.Vector3(2, 0.8, -1),
  new THREE.Vector3(2, 1.2, -2),
  new THREE.Vector3(1, 1.6, -3),
  STARTING_POSITION
]);


// CURVE

export const ME_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  STARTING_POSITION,
  new THREE.Vector3(10, 3, 0)
]);

export const ME_CURVE_TARGET = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 3, 0),
]);


// LIFE IN

export const LIFE_IN_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  STARTING_POSITION,
  new THREE.Vector3(0, 50, 20),
]);

export const LIFE_IN_CURVE_TARGET = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, 20),
]);

// LIFE OUT

export const LIFE_OUT_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 50, 20),
  new THREE.Vector3(0, 2, 36),
]);

export const LIFE_OUT_CURVE_TARGET = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 20),
  new THREE.Vector3(0, 0, 40),
]);

// PROJECT

export const PROJECT_IN_CURVE_CAMERA = offset_curve(new THREE.CatmullRomCurve3([
  STARTING_POSITION,
  new THREE.Vector3(20, 50, 40),
]), LIFE_END);

export const PROJECT_IN_CURVE_TARGET = offset_curve(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(20, 0, 40),
]), LIFE_END);

const CAMERA_HEIGHT = 50;
const CENTER_WIDHT = PROJECT_SCEEN_WIDHT / 2;
const CENTER_HEIGHT = PROJECT_SCEEN_HEIGHT / 2;
const FACTOR = 20;
// Maintain your start position
const startCamera = new THREE.Vector3(CENTER_HEIGHT, CAMERA_HEIGHT, CENTER_WIDHT);
const startTarget = new THREE.Vector3(CENTER_HEIGHT, 0, CENTER_WIDHT);

// Define the rectangular orbit, relative to start
export const PROJECT_ROTATE_CURVE_CAMERA = offset_curve(
  new THREE.CatmullRomCurve3([
    startCamera,
    new THREE.Vector3(-(CENTER_WIDHT + FACTOR), CAMERA_HEIGHT, CENTER_HEIGHT),
    new THREE.Vector3(-(CENTER_HEIGHT + FACTOR), CAMERA_HEIGHT, -(CENTER_WIDHT + FACTOR)),
    new THREE.Vector3((CENTER_WIDHT), CAMERA_HEIGHT, -(CENTER_HEIGHT + FACTOR)),
    startCamera // close loop smoothly
  ], true, 'centripetal'),
  PROJECT_OFFSET
);

export const PROJECT_ROTATE_TARGET = offset_curve(
  new THREE.CatmullRomCurve3([
    startTarget,
    new THREE.Vector3(-(CENTER_WIDHT + FACTOR), 0, CENTER_HEIGHT),
    new THREE.Vector3(-(CENTER_HEIGHT + FACTOR), 0, -(CENTER_WIDHT + FACTOR)),
    new THREE.Vector3((CENTER_WIDHT), 0, -(CENTER_HEIGHT + FACTOR)),
    startTarget // close loop smoothly
  ], true, 'centripetal'),
  PROJECT_OFFSET
);



export function move_camera({
  camera_ref,
  point_target,
  point_camera,
  angel_camera,
}: {
  camera_ref: CameraControlsRef,
  point_target: THREE.Vector3,
  point_camera: THREE.Vector3,
  angel_camera?: number,
}) {
  camera_ref.setPosition(point_camera.x, point_camera.y, point_camera.z);
  camera_ref.setTarget(point_target.x, point_target.y, point_target.z);
  if (angel_camera) {
    camera_ref.rotateAzimuthTo(angel_camera, false);
  }
}