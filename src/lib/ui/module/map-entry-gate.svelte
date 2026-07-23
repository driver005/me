<script lang="ts">
	import { createAmbientPad } from '$lib/util/ambient-audio';

	let { entered = $bindable(false) }: { entered: boolean } = $props();

	const PHRASES = ['THE ROUTE SO FAR', 'FIVE CITIES', 'ONE STUDIO', 'STILL MOVING'];
	let phraseIndex = $state(0);
	let withAudio = $state(true);

	const pad = createAmbientPad();

	$effect(() => {
		const id = setInterval(() => { phraseIndex = (phraseIndex + 1) % PHRASES.length; }, 1400);
		return () => clearInterval(id);
	});

	function enter() {
		if (withAudio) pad.start();
		entered = true;
	}
</script>

{#if !entered}
	<div class="fixed inset-0 z-[200] bg-[#0A0A0A] text-[#F3F2EE] flex flex-col items-center justify-center gap-10 px-4 text-center">
		<span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/40">§ map</span>

		<div class="h-16 sm:h-20 flex items-center justify-center overflow-hidden">
			{#key phraseIndex}
				<span
					class="font-display uppercase text-3xl sm:text-5xl tracking-tighter block"
					style="animation: gate-phrase-in 0.5s var(--ease-out-expo) both;"
				>{PHRASES[phraseIndex]}</span>
			{/key}
		</div>

		<button
			type="button"
			onclick={enter}
			class="font-mono text-xs uppercase tracking-[0.3em] px-6 py-3 border border-[#F3F2EE] hover:bg-[#F3F2EE] hover:text-[#0A0A0A] transition-colors duration-300"
		>
			Enter the map
		</button>

		<label class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/50 cursor-pointer">
			<input type="checkbox" bind:checked={withAudio} class="accent-[#FF3B00]" />
			With ambient audio
		</label>
	</div>
{/if}

<style>
	@keyframes gate-phrase-in {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
