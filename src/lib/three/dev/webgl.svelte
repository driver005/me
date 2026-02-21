<script lang="ts">
	import { getContext, onMount, type Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	let { children }: { children: Snippet } = $props();

	let status = $state('checking');

	const manual_override = getContext<{ value: boolean }>('manual_override');

	onMount(() => {
		const canvas = document.createElement('canvas');
		const gl = (canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl')) as WebGLRenderingContext;

		if (!gl) {
			status = 'fail';
		} else {
			status = 'ok';
		}
		console.log('WebGL support status:', status);
	});
</script>

{#if status === 'fail' && !manual_override.value}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-10 text-center"
	>
		<h1
			class="rounded-xl border-4 border-black bg-white p-4 text-2xl font-black text-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:text-black"
		>
			{m['webgl.title']()}
		</h1>
		<p class="mt-6 max-w-sm leading-tight font-bold uppercase">
			{m['webgl.description']()}
		</p>

		<div class="mt-8 flex flex-col gap-4">
			<a
				href="https://get.webgl.org/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-bold underline"
			>
				{m['webgl.link']()}
			</a>

			<button
				onclick={() => (manual_override.value = true)}
				class="rounded-xl border-2 border-black bg-yellow-400 px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none dark:text-black"
			>
				{m['webgl.button']()}
			</button>
		</div>
	</div>
{:else if status === 'ok' && !manual_override.value}
	{@render children()}
{/if}
