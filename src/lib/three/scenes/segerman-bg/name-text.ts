import * as THREE from 'three';
import * as opentype from 'opentype.js';
import gsap from 'gsap';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Scene } from './scene';

/** Three.js camera layer this text renders on — kept off the default layer (0) so Images' front
 *  pass (see images.ts) can exclude it via camera.layers, the same way Card excludes itself from
 *  the back pass with its own uImageMode uniform. Cards can't use that same uniform trick here since
 *  this isn't a Card; camera layers is the general-purpose version of the same idea. */
export const NAME_TEXT_LAYER = 1;

/**
 * "ADRIAN" as glass tube-like 3D letters, one character per cell of an evenly-spaced grid (2
 * columns × `lines.length` rows here: "AD"/"RI"/"AN") rather than laid out as flowing words — a
 * cursive/monoline script font (Pacifico, SIL OFL) extruded with a bevel large enough, relative to
 * its thin uniform stroke width, to puff a flat ribbon into a roughly circular cross-section (the
 * same trick used for "glass tube text" effects — it only reads as a tube because the font's strokes
 * are thin and near-constant width; a normal sans-serif's varying stroke widths would self-intersect
 * at the same bevel size, exactly what broke on the first attempt with Helvetiker).
 *
 * TextGeometry/typeface.json isn't used here — that pipeline can't carry a script font's shapes
 * reliably (hole detection in particular). Instead: opentype.js parses the real .ttf and gives back
 * an SVG path per character, which THREE's own SVGLoader turns into properly-holed THREE.Shape
 * objects (its createShapes() already does the outer/hole winding logic), extruded one mesh per
 * glyph-contour. Each character is centered on its own cell's center independently — grid placement,
 * not the font's own (wildly uneven once split into short 2-char rows) advance widths/kerning.
 * Material is real glass (MeshPhysicalMaterial, opaque/no transmission per the current look) lit by a
 * procedural PMREM environment (RoomEnvironment) — this engine has no scene lights, and
 * clearcoat/metalness read as flat black without an environment map to reflect.
 */
export class NameText {
	private group = new THREE.Group();
	private material: THREE.MeshPhysicalMaterial;
	private envMap: THREE.Texture;
	private pmrem: THREE.PMREMGenerator;
	private meshes: THREE.Mesh[] = [];
	private floatTweens: gsap.core.Tween[] = [];

	constructor(
		engineScene: Scene,
		targetScene: THREE.Scene,
		position: { x: number; y: number; z: number },
		lines: string[] = ['AD', 'RI', 'AN'],
		fontSize = 40,
		gridWidth = 80,
		gridHeight = 100
	) {
		this.pmrem = new THREE.PMREMGenerator(engineScene.renderer);
		this.envMap = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

		// A camera only sees layer 0 by default; NAME_TEXT_LAYER needs enabling here once so every
		// normal render (back pass, mesh Planet, etc.) still shows this text — images.ts's front pass
		// is the one place that deliberately disables it, then re-enables it right after.
		engineScene.camera.layers.enable(NAME_TEXT_LAYER);

		this.material = new THREE.MeshPhysicalMaterial({
			color: 0x1a5cff,
			metalness: 0.1,
			roughness: 0.15,
			transmission: 0,
			clearcoat: 1,
			clearcoatRoughness: 0.08,
			envMap: this.envMap,
			envMapIntensity: 1.4
		});

		this.group.position.set(position.x, position.y, position.z);
		targetScene.add(this.group);

		const cols = Math.max(...lines.map((line) => line.length));
		const rows = lines.length;
		const cellWidth = gridWidth / cols;
		const cellHeight = gridHeight / rows;

		fetch('/fonts/Pacifico-Regular.ttf')
			.then((res) => res.arrayBuffer())
			.then((buffer) => opentype.parse(buffer))
			.then((font) => {
				// Bevel sized against the font's own stroke width (measured off "l"'s vertical stem,
				// the thinnest/most uniform part of a script font) rather than a fraction of fontSize —
				// the two aren't proportional across glyphs, and guessing from fontSize alone is
				// exactly what self-intersected on the first (Helvetiker) attempt.
				const strokeWidth = measureStrokeWidth(font, fontSize);
				const bevelSize = strokeWidth * 0.42;

				lines.forEach((line, rowIndex) => {
					[...line].forEach((char, colIndex) => {
						const path = font.getPath(char, 0, 0, fontSize);
						const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${path.toPathData(3)}"/></svg>`;
						const { paths } = new SVGLoader().parse(svg);

						// This one character's own local (object-space) bounding box, and the meshes
						// that make it up — kept separate per character so each glyph can be centered
						// on its own cell independently of every other glyph's natural width/height.
						const charBox = new THREE.Box3();
						const charMeshes: THREE.Mesh[] = [];
						for (const shapePath of paths) {
							for (const shape of SVGLoader.createShapes(shapePath)) {
								const geometry = new THREE.ExtrudeGeometry(shape, {
									depth: bevelSize * 0.6,
									bevelEnabled: true,
									bevelThickness: bevelSize,
									bevelSize,
									bevelSegments: 8,
									curveSegments: 12
								});
								geometry.computeBoundingBox();
								if (geometry.boundingBox) charBox.union(geometry.boundingBox);
								const mesh = new THREE.Mesh(geometry, this.material);
								charMeshes.push(mesh);
							}
						}
						if (charMeshes.length === 0) return;

						// Grid cell center, in the group's own (Three Y-up) space — row 0 ("AD") at
						// top, last row ("AN") at bottom, reading order.
						const cellCenterX = -gridWidth / 2 + cellWidth * (colIndex + 0.5);
						const cellCenterY = gridHeight / 2 - cellHeight * (rowIndex + 0.5);

						// Each character gets its own group, parked at the cell center — the meshes
						// underneath stay glyph-local (see the Y-flip note below) so the group itself is
						// what floats, keeping every contour of a multi-part glyph (e.g. the two loops
						// of "A") moving together as one rigid piece.
						const charGroup = new THREE.Group();
						charGroup.position.set(cellCenterX, cellCenterY, 0);
						this.group.add(charGroup);

						// SVG/font path space is Y-down; the mesh's scale.y=-1 flips that to Y-up, which
						// means a vertex's final (group-local) Y is (mesh.position.y - rawGlyphVertex.y)
						// — so to land this glyph's own center exactly on the charGroup's origin,
						// position.y must be +glyphCenter.y (not minus, unlike X/Z), solving that
						// equation.
						const glyphCenter = new THREE.Vector3();
						charBox.getCenter(glyphCenter);
						for (const mesh of charMeshes) {
							mesh.position.set(-glyphCenter.x, glyphCenter.y, -glyphCenter.z);
							mesh.scale.y = -1;
							mesh.layers.set(NAME_TEXT_LAYER);
							this.meshes.push(mesh);
							charGroup.add(mesh);
						}

						// Gentle idle float — small vertical bob plus horizontal drift, each its own
						// independent tween. A per-index delay (0, 0.15, 0.3, ...) would just phase-
						// shift a shared wave, still reading as one coordinated motion; every axis on
						// every character instead gets its own random duration AND a random starting
						// phase within that duration (delay up to a full cycle, not a small stagger), so
						// the six drift genuinely independently rather than rippling in sequence.
						const floatRangeY = cellHeight * 0.06;
						const floatDurationY = 2 + Math.random() * 1.5;
						this.floatTweens.push(
							gsap.to(charGroup.position, {
								y: cellCenterY + floatRangeY,
								duration: floatDurationY,
								delay: Math.random() * floatDurationY,
								ease: 'sine.inOut',
								yoyo: true,
								repeat: -1
							})
						);
						const floatRangeX = cellWidth * 0.05;
						const floatDurationX = 2.5 + Math.random() * 1.8;
						this.floatTweens.push(
							gsap.to(charGroup.position, {
								x: cellCenterX + floatRangeX,
								duration: floatDurationX,
								delay: Math.random() * floatDurationX,
								ease: 'sine.inOut',
								yoyo: true,
								repeat: -1
							})
						);
					});
				});
			})
			.catch((err) => console.error('[NameText] failed:', err));
	}

	/** Home-only content — /works, /about, /gallery etc. all share this same imageScene (rendered by
	 *  Images regardless of route), so without this it would render on every page, not just "/". */
	setVisible(visible: boolean): void {
		this.group.visible = visible;
	}

	/** Whether the given raycaster hits any of this text's meshes — Mesh.raycast() doesn't itself
	 *  check .visible (that only affects the renderer's own traversal), so callers on a route where
	 *  this text is hidden (setVisible(false)) need to skip calling this entirely, not rely on it to
	 *  return false. */
	raycastHit(raycaster: THREE.Raycaster): boolean {
		return raycaster.intersectObjects(this.meshes, false).length > 0;
	}

	dispose(): void {
		for (const tween of this.floatTweens) tween.kill();
		for (const mesh of this.meshes) mesh.geometry.dispose();
		this.material.dispose();
		this.envMap.dispose();
		this.pmrem.dispose();
		this.group.parent?.remove(this.group);
	}
}

/** Font-unit stroke width of the lowercase "l" 's vertical stem (its bounding box width), scaled to
 *  the same fontSize passed to getPath() — used to size the bevel against the font's actual line
 *  weight instead of an arbitrary fraction of fontSize. */
function measureStrokeWidth(font: opentype.Font, fontSize: number): number {
	const glyph = font.charToGlyph('l');
	const glyphPath = glyph.getPath(0, 0, fontSize);
	const bbox = glyphPath.getBoundingBox();
	return Math.max(1, bbox.x2 - bbox.x1);
}
