<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { Moon, Sun } from 'lucide-svelte';

	let dark = $state(false);

	function toggleTheme() {
		dark = !dark;
		setMode(dark ? 'dark' : 'light');
	}
</script>

<button
	onclick={toggleTheme}
	class="h-12 rounded-xl border-4 border-black bg-violet-400 px-4 brutal-shadow transition-transform transition-shadow duration-500 ease-[var(--ease-out-expo)]
	hover:bg-violet-400 active:translate-x-0.5 active:translate-y-0.5
	active:shadow-none"
>
	{#if dark}
		<Sun class="h-10 w-10 stroke-[3px] text-black" />
	{:else}
		<Moon class="h-10 w-10 stroke-[3px] text-black" />
	{/if}
</button>
