import * as THREE from 'three';

export interface RTPair {
	read: THREE.WebGLRenderTarget;
	write: THREE.WebGLRenderTarget;
	swap(): void;
	setSize(width: number, height: number): void;
	dispose(): void;
}

export function createRTPair(
	width: number,
	height: number,
	options: THREE.RenderTargetOptions
): RTPair {
	const pair: RTPair = {
		read: new THREE.WebGLRenderTarget(width, height, options),
		write: new THREE.WebGLRenderTarget(width, height, options),
		swap() {
			const r = pair.read;
			pair.read = pair.write;
			pair.write = r;
		},
		setSize(w, h) {
			pair.read.setSize(w, h);
			pair.write.setSize(w, h);
		},
		dispose() {
			pair.read.dispose();
			pair.write.dispose();
		}
	};
	return pair;
}
