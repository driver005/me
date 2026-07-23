<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';

	const prefersReduced = typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	const text = $derived(m['footer.credit']());

	function tokenize(str: string) {
		const raw = str.split(' ');
		const out: string[] = [];
		for (let i = 0; i < raw.length; i++) {
			if (raw[i] === '&' && i + 1 < raw.length) {
				out.push(`${raw[i]} ${raw[i + 1]}`);
				i++;
			} else {
				out.push(raw[i]);
			}
		}
		return out;
	}

	const words = $derived(tokenize(text));

	// deterministic per-word scatter (no Math.random — avoids SSR/client hydration mismatch)
	function rotFor(i: number) {
		return ((i * 47) % 50) - 25;
	}
	function xFor(i: number) {
		return ((i * 71) % 60) - 30;
	}

	let wrapperRef: HTMLElement | null = $state(null);
	let progress = $state(0);

	function clamp01(n: number) {
		return Math.max(0, Math.min(1, n));
	}
	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	$effect(() => {
		if (!browser || !wrapperRef || prefersReduced) return;
		const unsub = onScrollBounded(wrapperRef, (scrollY, vh, rect) => {
			const range = rect.height - vh;
			progress = clamp01(range > 0 ? -rect.top / range : 0);
		});
		return unsub;
	});

	function wordEase(i: number, n: number) {
		const distance = progress * n - i;
		return easeOutCubic(clamp01(distance));
	}
</script>

{#if prefersReduced}
	<section data-testid="kinetic-statement-section" class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-black py-24 px-4 sm:px-8">
		<p class="font-display uppercase text-[12vw] sm:text-[7vw] leading-[0.92] tracking-tighter text-center">
			{text}
		</p>
	</section>
{:else}
	<section
		bind:this={wrapperRef}
		data-testid="kinetic-statement-section"
		class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-black"
		style="height: 320vh;"
	>
		<div class="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-4 sm:px-10">
			<p class="font-display uppercase text-[13vw] sm:text-[8.5vw] lg:text-[7vw] leading-[0.92] tracking-tighter text-center flex flex-wrap justify-center gap-x-5 gap-y-1 w-full">
				{#each words as w, i}
					{@const e = wordEase(i, words.length)}
					{@const isLast = i === words.length - 1}
					<span
						class="inline-block"
						style:opacity={e}
						style:color={isLast ? '#FF3B00' : '#F3F2EE'}
						style:transform="translateY({(1 - e) * 60}px) translateX({(1 - e) * xFor(i)}px) rotate({(1 - e) * rotFor(i)}deg) scale({0.4 + 0.6 * e})"
					>{w}</span>
				{/each}
			</p>
		</div>
	</section>
{/if}
