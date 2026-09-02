import * as THREE from 'three';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

/**
 * Big extruded "ADRIAN" 3D text, dropped into an existing THREE.Scene (the Home gallery's own
 * `imageScene` — same scene/camera/render pass as the gallery cards, so it composites through the
 * same pipeline without needing a new render target or a new back-fragment uniform). Two meshes
 * share the one geometry: a near-transparent fill for a glass-like body, and an edge-outline
 * (EdgesGeometry, not a mesh wireframe — cleaner silhouette) for definition. Both unlit
 * (MeshBasicMaterial) since this engine's scenes carry no THREE.Light.
 */
export class NameText {
	private group = new THREE.Group();
	private fillMesh: THREE.Mesh | null = null;
	private edges: THREE.LineSegments | null = null;
	private geometry: TextGeometry | null = null;
	private fillMaterial: THREE.MeshBasicMaterial;
	private edgeMaterial: THREE.LineBasicMaterial;

	constructor(
		targetScene: THREE.Scene,
		position: { x: number; y: number; z: number },
		text = 'ADRIAN',
		size = 40
	) {
		this.fillMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.14,
			side: THREE.DoubleSide,
			depthWrite: false
		});
		this.edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

		this.group.position.set(position.x, position.y, position.z);
		targetScene.add(this.group);

		new FontLoader().load('/fonts/helvetiker_bold.typeface.json', (font: Font) => {
			this.geometry = new TextGeometry(text, {
				font,
				size,
				depth: size * 0.22,
				curveSegments: 6,
				bevelEnabled: true,
				bevelThickness: size * 0.02,
				bevelSize: size * 0.015,
				bevelSegments: 2
			});
			this.geometry.center();

			this.fillMesh = new THREE.Mesh(this.geometry, this.fillMaterial);
			this.edges = new THREE.LineSegments(new THREE.EdgesGeometry(this.geometry, 20), this.edgeMaterial);
			this.group.add(this.fillMesh, this.edges);
		});
	}

	dispose(): void {
		this.geometry?.dispose();
		this.fillMaterial.dispose();
		this.edgeMaterial.dispose();
		this.group.parent?.remove(this.group);
	}
}
