<script lang="ts">
	import { Contact, Helper, Lang, Gallery, FriendlyMode } from '$lib/ui/dialog';
	import { ThemeSwitcher, Tip } from '$lib/ui/helper';
	import { getContext } from 'svelte';

	const helper = getContext<{ value: boolean }>('helper');
</script>

<Tip />

{#if helper.value}
	<div class="absolute top-4 right-4 z-200 flex gap-4">
		<FriendlyMode />
		<Helper />
		<ThemeSwitcher />
		<Contact />
		<Gallery />
		<Lang />
	</div>
{/if}
