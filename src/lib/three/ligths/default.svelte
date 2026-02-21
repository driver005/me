<script lang="ts">
	import { T } from '@threlte/core';
	import { getContext } from 'svelte';

	const theme = getContext<{ value: string }>('theme');
</script>

{#if theme.value === 'light'}
	<!-- <T.AmbientLight intensity={0.2} color="#e0eaff" /> -->

	<T.DirectionalLight position={[10, 20, 10]} intensity={1.5} color="#fff2db" />

	<!-- <T.DirectionalLight position={[10, 10, -10]} intensity={0.4} color="#f0f4ff" /> -->
{/if}
