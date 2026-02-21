<script lang="ts">
	import { Wrapper } from '$lib/ui/helper';
	import { Skills } from '$lib/ui/page';

	let { open = $bindable() }: { open: boolean } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (
			e.key.toLowerCase() === 's' &&
			!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
		) {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<Wrapper bind:open>
	<Skills />
</Wrapper>
