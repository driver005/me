import * as THREE from 'three';

export function createPlaceholderTexture(): THREE.DataTexture {
	const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
	texture.needsUpdate = true;
	return texture;
}
