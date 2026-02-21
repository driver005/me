<script lang="ts">
	import { Button } from '$lib/ui/cn/button';
	import { Moon, Sun } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { setMode } from 'mode-watcher';

	const theme = getContext<{ value: string }>('theme');

	function toggleTheme() {
		let value: 'light' | 'dark' | 'system' = theme.value === 'light' ? 'dark' : 'light';
		setMode(value);
		theme.value = value;
	}
</script>

<Button
	variant="outline"
	onclick={toggleTheme}
	class="h-12 rounded-xl border-4 border-black bg-violet-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
	hover:bg-violet-400 active:translate-x-0.5 active:translate-y-0.5
	active:shadow-none dark:bg-red-400 dark:hover:bg-red-400"
>
	{#if theme.value === 'dark'}
		<Sun class="h-10 w-10 stroke-[3px]" />
	{:else}
		<Moon class="h-10 w-10 stroke-[3px]" />
	{/if}
</Button>
