<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { useTexture } from '@threlte/extras';
	import * as THREE from 'three';
	// @ts-ignore
	import smokeVertexShader from '$lib/shaders/smoke/vertex.glsl';
	// @ts-ignore
	import smokeFragmentShader from '$lib/shaders/smoke/fragment.glsl';

	const perlinStore = useTexture('/textures/shaders/perlin.png', {
		transform: (t) => {
			t.wrapS = t.wrapT = THREE.RepeatWrapping;
			return t;
		}
	});

	interface SmokeUniforms {
		[key: string]: THREE.IUniform<any>;
	}

	const uniforms: SmokeUniforms = {
		uTime: { value: 0 },
		uPerlinTexture: { value: null }
	};

	$effect(() => {
		if ($perlinStore) {
			uniforms.uPerlinTexture.value = $perlinStore;
		}
	});

	useTask((delta) => {
		uniforms.uTime.value += delta;
	});
</script>

<T.Mesh position={[-0.5, 1, -1.575]}>
	<T.PlaneGeometry
		args={[1, 1, 16, 64]}
		oncreate={(ref) => {
			ref.translate(0, 0.5, 0);
			ref.scale(0.33, 1, 0.33);
		}}
	/>

	<T.ShaderMaterial
		vertexShader={smokeVertexShader}
		fragmentShader={smokeFragmentShader}
		{uniforms}
		side={THREE.DoubleSide}
		transparent
		depthWrite={false}
	/>
</T.Mesh>
