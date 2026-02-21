<script lang="ts">
	import Rain from './rain.svelte';
	import Smoke from './smoke.svelte';
	import Caffee from './caffee.svelte';
	import { check_weather } from '$lib/weather'; // Use the exported function
	import { getContext } from 'svelte';

	const friendly = getContext<{ value: boolean }>('friendly');

	// This stores the Promise itself
	let weatherPromise = check_weather();
</script>

<Caffee />

{#await weatherPromise then isRaining}
	{#if isRaining}
		<Rain />
	{/if}
{:catch error}
	<p>Error loading weather: {error.message}</p>
{/await}

{#if !friendly.value}
	<Smoke />
{/if}
