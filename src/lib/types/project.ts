import * as THREE from "three";

export type IFRAME = {
  position: THREE.Vector3,
  rotation: [x: number, y: number, z: number, order?: THREE.EulerOrder | undefined],
}
