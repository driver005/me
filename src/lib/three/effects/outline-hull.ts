import * as THREE from 'three';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import vertexShader from '$lib/shaders/outline-hull/vertex.glsl';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import skinnedVertexShader from '$lib/shaders/outline-hull/vertex-skinned.glsl';
// @ts-ignore - vite-plugin-glsl provides the module at build time; no ambient type is registered for it
import fragmentShader from '$lib/shaders/outline-hull/fragment.glsl';

function outlineUniforms() {
	return {
		outlineThickness: { value: 0.012 },
		outlineColor: { value: new THREE.Color(0x141414) }
	};
}

/**
 * Inverted-hull cartoon outline: a backface-only copy of a mesh, its vertices pushed out along
 * their own normals by `outlineThickness`, rendered in a flat `outlineColor`. Camera only sees the
 * pushed-out back faces peeking past the real (front-facing) mesh's silhouette, reading as an ink
 * line around it — no depth texture, no render target, no selection pass involved. See
 * postprocessing.ts's own comment: the two outline approaches that WERE tried (selection-based
 * OutlineEffect, custom depth-edge Effect) both crashed this GPU/driver because they depend on
 * depth-texture rendering; this technique doesn't touch depth at all.
 *
 * One shared THREE.ShaderMaterial for every ordinary (non-skinned) mesh in the scene (see room.ts's
 * own glassMaterial/waterMaterial for the same reasoning) — the whole point is adding exactly one
 * more compiled shader program total, not one per mesh, given how fragile shader-compile bursts have
 * been on this hardware (see gpu-diagnostics.ts's own history).
 */
export function createOutlineMaterial(): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		uniforms: outlineUniforms(),
		vertexShader,
		fragmentShader,
		side: THREE.BackSide
	});
}

/**
 * Same technique, for skinned/rigged meshes (e.g. the astronaut panda) — a plain THREE.Mesh sharing
 * a SkinnedMesh's geometry ignores its bone animation entirely (skinning only runs for an actual
 * THREE.SkinnedMesh instance), so it'd sit frozen in bind pose while the real mesh animates. This
 * variant's vertex shader pulls in three.js's own skinning_pars_vertex/skinbase_vertex/
 * skinning_vertex chunks (resolved via the standard `#include <name>` mechanism, same as any built-in
 * material's shader) so the extruded outline deforms with the same bone matrices as the mesh it
 * outlines.
 *
 * Kept as a SEPARATE material from createOutlineMaterial() above because the vertex shader SOURCE
 * itself differs (this one references `transformed`/skinIndex/skinWeight via the included chunks,
 * the plain one reads `position` directly) — not because of any material-level skinning flag: three.js
 * derives USE_SKINNING purely from `object.isSkinnedMesh` at render time, so it'd even be safe to
 * reuse one material across both mesh kinds as far as that goes. Two materials costs exactly one extra
 * compiled program, and only if a skinned mesh actually needs it — worth keeping given how fragile
 * shader compiles have been on this hardware (see gpu-diagnostics.ts's own history).
 */
export function createSkinnedOutlineMaterial(): THREE.ShaderMaterial {
	// No `skinning` flag to set here: three.js derives USE_SKINNING (and the skinIndex/skinWeight
	// attribute wiring the skinning_pars_vertex/skinbase_vertex/skinning_vertex chunks above need)
	// purely from `object.isSkinnedMesh` at render time — it's a property of the mesh being drawn,
	// not something the material itself declares.
	return new THREE.ShaderMaterial({
		uniforms: outlineUniforms(),
		vertexShader: skinnedVertexShader,
		fragmentShader,
		side: THREE.BackSide
	});
}

/**
 * Adds an outline mesh as a child of `mesh`, sharing its geometry (no extra buffer memory).
 * Parented rather than tracked separately so it rides along with every transform/animation `mesh`
 * already gets for free, and — just as importantly — inherits `mesh`'s own `visible` flag: three.js's
 * renderer skips a whole subtree the moment it hits an invisible object, so the outline
 * automatically respects room.ts's own staggered reveal (revealQueue) without any extra wiring here.
 *
 * For a THREE.SkinnedMesh, the outline itself is built as a SkinnedMesh too, bound to the SAME
 * skeleton/bindMatrix as `mesh` — that's what makes it deform identically instead of sitting frozen
 * in bind pose (see createSkinnedOutlineMaterial()'s own comment).
 */
export function addOutlineMesh(
	mesh: THREE.Mesh,
	material: THREE.ShaderMaterial,
	skinnedMaterial: THREE.ShaderMaterial
): THREE.Object3D {
	if (mesh instanceof THREE.SkinnedMesh) {
		const outline = new THREE.SkinnedMesh(mesh.geometry, skinnedMaterial);
		outline.name = `${mesh.name}-outline`;
		outline.castShadow = false;
		outline.receiveShadow = false;
		outline.userData.isOutlineHull = true;
		outline.bind(mesh.skeleton, mesh.bindMatrix);
		outline.bindMode = mesh.bindMode;
		mesh.add(outline);
		return outline;
	}

	const outline = new THREE.Mesh(mesh.geometry, material);
	outline.name = `${mesh.name}-outline`;
	outline.castShadow = false;
	outline.receiveShadow = false;
	outline.userData.isOutlineHull = true;
	mesh.add(outline);
	return outline;
}
