<script lang="ts">
	import { useLoader, T } from '@threlte/core';
	import { Environment, Stars } from '@threlte/extras';
	import { mode } from 'mode-watcher';
	import { EquirectangularReflectionMapping, TextureLoader, Color } from 'three';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const initialCol = new Color('#D9CAD1');
	const bgTween = new Tween([initialCol.r, initialCol.g, initialCol.b], {
		duration: 1000,
		easing: cubicOut
	});

	$effect(() => {
		const targetCol = new Color(mode.current === 'dark' ? '#000000' : '#D9CAD1');
		bgTween.target = [targetCol.r, targetCol.g, targetCol.b];
	});

	const { load } = useLoader(TextureLoader);
	const map = load('/textures/enviorment/nebula.jpg', {
		transform(texture) {
			texture.mapping = EquirectangularReflectionMapping;
			return texture;
		}
	});
</script>

<T.Color attach="background" args={[bgTween.current[0], bgTween.current[1], bgTween.current[2]]} />

<Stars />

{#await map then texture}
	<Environment isBackground={false} {texture} />
{/await}
