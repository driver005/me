<script lang="ts">
	import { UserSearchIcon } from '@lucide/svelte';
	import { Button } from '$lib/ui/cn/button';
	import { m } from '$lib/paraglide/messages';
	import { Helper, Lang, Gallery, FriendlyMode } from '$lib/ui/dialog';
	import { ThemeSwitcher, Tip } from '$lib/ui/helper';
	import { getContext } from 'svelte';

	function handleHelpClick() {
		const email = m.email();
		const subject = encodeURIComponent('Contact Me');

		window.location.href = `mailto:${email}?subject=${subject}`;
	}
	const helper = getContext<{ value: boolean }>('helper');
</script>

<Tip />

{#if helper.value}
	<div class="absolute top-4 right-4 z-200 flex gap-4">
		<FriendlyMode />
		<Helper />
		<ThemeSwitcher />
		<Button
			variant="outline"
			onclick={handleHelpClick}
			class="h-12 rounded-xl border-4 border-black bg-orange-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-orange-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:bg-orange-400 dark:hover:bg-orange-400"
		>
			<UserSearchIcon class="h-6 w-6 text-black" />
		</Button>
		<Gallery />
		<Lang />
	</div>
{/if}
