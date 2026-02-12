<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import fragment from '$lib/shaders/rock/fragment.glsl';
	import vertex from '$lib/shaders/rock/vertex.glsl';
	import { Vector2 } from 'three';
	let time = 0;

	useTask(() => {
		time += 0.01;
	});
</script>

<T.Mesh rotation={[-Math.PI / 2, 0, 0]}>
	<T.SphereGeometry args={[100, 100, 512, 512]} />
	<T.ShaderMaterial
		uniforms={{
		  uScale: { value: 2.0 },
			u_time: { value: time },
			u_resolution: { value: new Vector2(1000, 1000) }
		}}
		vertexShader={vertex}
		fragmentShader={fragment}
	/>
</T.Mesh>
