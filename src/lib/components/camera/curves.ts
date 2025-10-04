import type { CameraControlsRef } from "@threlte/extras";
import * as THREE from "three";

type CURVE_TYPE = "START" | "ME" | "Null";
type POSITIONS = { start: number, me: number };

function check_curve(positions: POSITIONS): CURVE_TYPE {
  if (
    !(positions.start == 1) && positions.me == 0
  ) {
    return "START";
  } else if (
    positions.start == 1 && !(positions.me == 0)
  ) {
    return "ME";
  }

  return "Null";
}

// STARTING

const STARTING_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(1, 0.4, 0),
  new THREE.Vector3(2, 0.8, -1),
  new THREE.Vector3(2, 1.2, -2),
  new THREE.Vector3(1, 1.6, -3),
  new THREE.Vector3(0, 2, -4)
]);


// CURVE

const ME_CURVE_CAMERA = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 2, -4),
  new THREE.Vector3(10, 3, 0)
]);

const ME_CURVE_Target = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 2, 0),
]);


export function change_camera(camera_ref: CameraControlsRef | undefined, positions: POSITIONS) {
  if (!camera_ref) return;

  let curve_type = check_curve(positions);

  if (
    curve_type == "START"
  ) {
    const point_camera = STARTING_CURVE_CAMERA.getPointAt(positions.start);
    camera_ref.setPosition(point_camera.x, point_camera.y, point_camera.z);
    camera_ref.setTarget(0, 0, 0);
  } else if (
    curve_type == "ME"
  ) {
    const point_camera = ME_CURVE_CAMERA.getPointAt(positions.me);
    const point_target = ME_CURVE_Target.getPointAt(positions.me);
    camera_ref.setPosition(point_camera.x, point_camera.y, point_camera.z);
    camera_ref.setTarget(point_target.x, point_target.y, point_target.z);
  }
}