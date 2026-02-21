<script lang="ts">
	import { WrapperHome } from '$lib/ui/helper';
	import { Home } from '$lib/ui/page';

	let active_tab = $state('home');
	let manual_override = $state(false);

	let { open = $bindable() }: { open: boolean } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (
			e.key.toLowerCase() === 'h' &&
			manual_override === true &&
			!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
		) {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<WrapperHome bind:active={active_tab} bind:open>
	<Home bind:manual_override bind:active={active_tab} />
</WrapperHome>
