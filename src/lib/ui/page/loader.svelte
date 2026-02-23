<script lang="ts">
	import { useProgress } from '@threlte/extras';
	import { fade } from 'svelte/transition';
	import { Progress } from '$lib/ui/cn/progress';
	import { m } from '$lib/paraglide/messages';
	import Helper from './helper.svelte';

	const { progress, item } = useProgress();

	let isLoaded = $state(false);
	let hasEntered = $state(false);
	let hasTargetStarted = $state(false);
	let percent = $state(0);

	$effect(() => {
		if ($item?.includes('/models/home-transformed.glb')) {
			hasTargetStarted = true;
		}
	});

	$effect(() => {
		if (!hasTargetStarted) return;

		const value = Math.round($progress * 100);

		if (value > percent) {
			percent = value;
		}

		if ($progress === 1) {
			isLoaded = true;
		}
	});

	function handleEnter(withSound = true) {
		if (!isLoaded) return;
		hasEntered = true;
	}
</script>

{#if !hasEntered}
	<div
		transition:fade={{ duration: 600 }}
		class="absolute inset-0 top-0 left-0 z-100 flex flex-col items-center justify-center bg-background p-4"
	>
		<div
			class="w-full max-w-md rounded-xl border-4 border-black bg-background p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
		>
			<h2
				class="mb-6 text-3xl font-black tracking-tighter text-black uppercase italic dark:text-white"
			>
				{isLoaded ? '~ 안녕하세요 ~' : m.catchline()}
			</h2>

			<div class="progress-wrapper space-y-6">
				{#if !isLoaded}
					<Progress
						role="progressbar"
						value={percent}
						max={100}
						class="h-12 w-full overflow-hidden border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-black"
					/>
				{/if}

				<button
					disabled={!isLoaded}
					onclick={() => handleEnter(true)}
					class="relative w-full cursor-pointer rounded-xl border-4 border-black bg-zinc-700 p-4 font-black
					 {isLoaded
						? 'text-gray-300 uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-0 active:translate-y-0'
						: 'cursor-not-allowed bg-gray-200 text-gray-400'}"
				>
					{isLoaded ? m.enter() : m.loading()}
				</button>
			</div>
		</div>
	</div>
{:else}
	<Helper />
{/if}

<style>
	.progress-wrapper :global([data-slot='progress-indicator']) {
		background-color: #a855f7 !important;
		border-right: 4px solid black;
	}
</style>
