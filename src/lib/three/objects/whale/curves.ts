import { create_rounded_corner, create_rounded_rect_orbit, offset_curve } from "$lib/utils/curves";
import { PROJECT_SCREEN_WIDTH, PROJECT_SCREEN_HEIGHT, PROJECT_SCREEN_RADIUS, PROJECT_OFFSET, LIFE_END, LIFE_STARTING_POSITION, STARTING_POSITION, LIFE_ENDING_POSITION } from "$lib/consts";
import * as THREE from 'three'

export const LIFE_IN_CURVE = new THREE.CatmullRomCurve3([
  STARTING_POSITION,
  LIFE_STARTING_POSITION,
]);

export const LIFE_CURVE = new THREE.CatmullRomCurve3([
  LIFE_STARTING_POSITION,
  new THREE.Vector3(0, 0, 10),
  new THREE.Vector3(2.5, 0, 15),
  new THREE.Vector3(0, 0, 22.5),
  new THREE.Vector3(-2.5, 0, 30),
  new THREE.Vector3(0, 0, 37.5),
  new THREE.Vector3(2.5, 0, 45),
  new THREE.Vector3(0, 0, 52.5),
  new THREE.Vector3(-2.5, 0, 60),
  LIFE_ENDING_POSITION
]);

export const LIFE_OUT_CURVE = new THREE.CatmullRomCurve3([
  LIFE_ENDING_POSITION,
  LIFE_END,
]);


export const PROJECT_IN_CURVE = new THREE.CatmullRomCurve3([
  LIFE_END,
  PROJECT_OFFSET,
]);


export const PROJECT_ONE_CURVE = offset_curve(
  create_rounded_rect_orbit({
    width: 40,
    height: 60,
    radius: PROJECT_SCREEN_RADIUS,
    depth: 0,
    center: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    end_point: new THREE.Vector3(0, 0, 0),
    flipX: false,
    flipZ: false,
  }),
  PROJECT_OFFSET
);

export const PROJECT_ONE_CURVE_TRANSITION = offset_curve(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(-20, 0, 0),
]), PROJECT_OFFSET);


export const PROJECT_TWO_CURVE = offset_curve(
  create_rounded_rect_orbit({
    width: PROJECT_SCREEN_HEIGHT,
    height: PROJECT_SCREEN_WIDTH,
    radius: PROJECT_SCREEN_RADIUS,
    depth: 0,
    center: new THREE.Vector3(-20, 0, 0),
    rotation: new THREE.Euler(-Math.PI / 2, -Math.PI / 2, -Math.PI / 2),
    end_point: new THREE.Vector3(0, 0, 0),
    flipX: false,
    flipZ: false,
  }),
  PROJECT_OFFSET
);

export const PROJECT_TWO_CURVE_TRANSITION = offset_curve(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-20, 0, 0),
  new THREE.Vector3(-20, 0, -20),
]), PROJECT_OFFSET);

export const PROJECT_THREE_CURVE = offset_curve(
  create_rounded_rect_orbit({
    width: PROJECT_SCREEN_HEIGHT,
    height: PROJECT_SCREEN_WIDTH,
    radius: PROJECT_SCREEN_RADIUS,
    depth: 0,
    center: new THREE.Vector3(-20, 0, -20),
    rotation: new THREE.Euler(-Math.PI, 0, -Math.PI),
    end_point: new THREE.Vector3(0, 0, 0),
    flipX: false,
    flipZ: false,
  }),
  PROJECT_OFFSET
);

export const PROJECTT_THREE_CURVE_TRANSITION = offset_curve(new THREE.CatmullRomCurve3([
  new THREE.Vector3(-20, 0, -20),
  new THREE.Vector3(0, 0, -20),
]), PROJECT_OFFSET);

export const PROJECT_FOUR_CURVE = offset_curve(
  create_rounded_rect_orbit({
    width: PROJECT_SCREEN_HEIGHT,
    height: PROJECT_SCREEN_WIDTH,
    radius: PROJECT_SCREEN_RADIUS,
    depth: 0,
    center: new THREE.Vector3(0, 0, -20),
    rotation: new THREE.Euler(-Math.PI / 2, Math.PI / 2, Math.PI / 2),
    end_point: new THREE.Vector3(0, 0, 0),
    flipX: false,
    flipZ: false,
  }),
  PROJECT_OFFSET
);

export const PROJECTT_FOUR_CURVE_TRANSITION = offset_curve(new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, -20),
  new THREE.Vector3(0, 0, 0),
]), PROJECT_OFFSET);

export const PROJECT_OUT_CURVE = offset_curve(
  create_rounded_corner({
    width: PROJECT_SCREEN_HEIGHT,
    height: PROJECT_SCREEN_WIDTH / 2,
    radius: PROJECT_SCREEN_RADIUS,
    depth: 0,
    center: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    flipX: true,
    flipZ: false,
  }),
  PROJECT_OFFSET
);