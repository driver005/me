<script>
	import { fade } from 'svelte/transition';
	import * as m from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';

	let visible = $state(true);

	const fullTip = $derived(`${m['tip.first']()} • ${m['tip.second']()} • `);

	onMount(() => {
		const timer = setTimeout(() => {
			visible = false;
		}, 30000);

		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div
		transition:fade={{ duration: 800 }}
		class="pointer-events-none fixed -right-24 bottom-16 z-50 hidden w-100 select-none md:block"
	>
		<div
			class="animate-scale-pulse relative overflow-hidden border-y-2 border-white/30 bg-indigo-700 py-2.5 text-white shadow-2xl"
		>
			<div class="animate-marquee flex whitespace-nowrap">
				{#each Array(6) as _}
					<div
						class="flex shrink-0 items-center px-1 text-[10px] font-black tracking-[0.2em] uppercase"
					>
						<span>{fullTip}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Moves exactly half the width for a seamless infinite loop */
	@keyframes marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	/* Combined keyframe to prevent transform conflicts */
	@keyframes scale-pulse {
		0%,
		100% {
			transform: rotate(-45deg) scale(1);
		}
		50% {
			transform: rotate(-45deg) scale(1.1);
		}
	}

	.animate-marquee {
		display: flex;
		width: max-content;
		animation: marquee 10s linear infinite;
	}

	.animate-scale-pulse {
		animation: scale-pulse 3s infinite ease-in-out;
		transform-origin: center;
	}
</style>
