<script lang="ts">
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';
	const theme = getContext<{ value: string }>('theme');
</script>

{#if theme.value === 'light'}
	<!-- Key light — warm sun -->
	<T.DirectionalLight position={[10, 20, 10]} intensity={1.5} color="#fff5e0" />
	<!-- Fill light — cool sky bounce -->
	<T.DirectionalLight position={[-8, 8, -6]} intensity={0.4} color="#c8d8ff" />
	<!-- Ambient — soft warm base -->
	<T.AmbientLight intensity={0.3} color="#fffaf0" />
{:else}
	<!-- Key light — cold moonlight -->
	<T.DirectionalLight position={[10, 20, 10]} intensity={0.4} color="#4a6fa5" />
	<!-- Fill light — subtle cool bounce -->
	<T.DirectionalLight position={[-8, 8, -6]} intensity={0.15} color="#2a3f6f" />
	<!-- Ambient — near black, just enough to see shapes -->
	<T.AmbientLight intensity={0.08} color="#0d1520" />
{/if}
