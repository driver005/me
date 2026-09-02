<script lang="ts">
	import { T, useTask } from '@threlte/core';

	let { vertexShader, fragmentShader, uniforms }: { vertexShader: string; fragmentShader: string; uniforms: Record<string, { value: unknown }> } =
		$props();

	let rotationY = $state(0);

	useTask((delta) => {
		rotationY += delta * 0.12;
	});
</script>

<T.Mesh rotation.y={rotationY}>
	<T.SphereGeometry args={[1, 64, 64]} />
	<T.ShaderMaterial {vertexShader} {fragmentShader} {uniforms} />
</T.Mesh>
