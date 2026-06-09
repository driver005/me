<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';

	// ── Clip-path scroll fill ────────────────────────────────────────────────
	let nameEl = $state<HTMLElement | null>(null);
	let fillPct = $state(0); // 0..100

	$effect(() => {
		if (!browser) return;
		const onScroll = () => {
			if (!nameEl) return;
			const rect = nameEl.getBoundingClientRect();
			const vh = window.innerHeight;
			// start when top hits 95% vh, end when top hits 30% vh
			const progress = Math.max(0, Math.min(1,
				1 - (rect.top - vh * 0.3) / (vh * 0.65)
			));
			fillPct = progress * 100;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	});

	import { useBerlinTime } from '$lib/util/berlin-time.svelte';

	const berlinTime = useBerlinTime();

	const year = new Date().getFullYear();
</script>

<footer data-testid="site-footer" class="bg-[#0A0A0A] text-[#F3F2EE]">
	<div class="px-4 sm:px-8 pt-16 pb-6">

	<!-- Large name with scroll-fill clip-path -->
	<div bind:this={nameEl} class="relative font-display uppercase text-[22vw] sm:text-[18vw] leading-[0.8] tracking-tighter select-none overflow-hidden">

		<!-- Outline base (always visible) -->
		<span
			style="-webkit-text-stroke: 1.5px #F3F2EE; color: transparent; display: block;"
		>
			AdrianFern<span class="text-[#FF3B00]" style="-webkit-text-stroke: 0;">á</span>ndez
		</span>

		<!-- Solid fill — clip-path wipes in from left on scroll -->
		<span
			aria-hidden="true"
			class="absolute inset-0"
			style="display: block; color: #F3F2EE; -webkit-text-stroke: 0; clip-path: inset(0 {100 - fillPct}% 0 0);"
		>
			AdrianFern<span class="text-[#FF3B00]">á</span>ndez
		</span>
	</div>

	<!-- Info grid: 12 cols / 4 sections -->
	<div class="mt-12 grid grid-cols-12 border-t border-[#F3F2EE]/20 pt-6 gap-4">
		<div class="col-span-6 sm:col-span-3">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				&copy; {year} {m['footer.copyright']()}
			</span>
			<div class="font-mono text-sm mt-2 text-[#F3F2EE]/70">
				{m['footer.rights']()}
			</div>
		</div>
		<div class="col-span-6 sm:col-span-3">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				{m['footer.berlin_time']()}
			</span>
			<div data-testid="footer-clock" class="font-mono text-sm mt-2 text-[#F3F2EE]/70">
				{berlinTime} {m['footer.clock_suffix']()}
			</div>
		</div>
		<div class="col-span-6 sm:col-span-3">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				{m['footer.built_with']()}
			</span>
			<div class="font-mono text-sm mt-2 text-[#F3F2EE]/50">
				{@html m['footer.tech_stack']()}
			</div>
		</div>
		<div class="col-span-6 sm:col-span-3 sm:text-right">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				{m['footer.top']()}
			</span>
			<div class="mt-2">
				<a
					href="#top"
					data-testid="footer-back-top"
					class="font-mono text-sm hover:text-[#FF3B00] text-[#F3F2EE]/70 no-underline transition-colors"
				>
					{m['footer.back_to_start']()}
				</a>
			</div>
		</div>
	</div>

	<!-- Bottom strip -->
	<div class="mt-8 pt-4 border-t border-[#F3F2EE]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
		<span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
			{m['footer.credit']()}
		</span>
		<span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
			{m['footer.end']()}
		</span>
		</div>
	</div>
</footer>
