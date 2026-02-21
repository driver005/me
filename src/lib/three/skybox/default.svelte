<script lang="ts">
	import { useLoader, T } from '@threlte/core';
	import { Environment, Stars } from '@threlte/extras';
	import { getContext } from 'svelte';
	import { EquirectangularReflectionMapping, TextureLoader } from 'three';

	const theme = getContext<{ value: string }>('theme');

	const { load } = useLoader(TextureLoader);
	const map = load('/textures/nebula.jpg', {
		transform(texture) {
			texture.mapping = EquirectangularReflectionMapping;
			return texture;
		}
	});
</script>

{#await map then texture}
	<Environment isBackground={false} {texture} />
{/await}

{#if theme.value === 'dark'}
	<T.Color attach="background" args={['#000']} />
	<Stars />
{:else}
	<T.Color attach="background" args={['#D9CAD1']} />
{/if}
