<script lang="ts">
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

	// ── Berlin clock ─────────────────────────────────────────────────────────
	function getBerlinTime(): string {
		return new Date().toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});
	}

	let berlinTime = $state(getBerlinTime());

	$effect(() => {
		if (!browser) return;
		const id = setInterval(() => {
			berlinTime = getBerlinTime();
		}, 1000);
		return () => clearInterval(id);
	});

	const year = new Date().getFullYear();
</script>

<footer data-testid="site-footer" class="bg-[#0A0A0A] text-[#F3F2EE]">

	<!-- Large name with scroll-fill clip-path -->
	<div bind:this={nameEl} class="relative overflow-hidden border-b border-[#F3F2EE]/10 px-2 sm:px-4 pt-16 sm:pt-24 pb-4">

		<!-- Outline layer -->
		<span
			aria-hidden="false"
			class="block font-display uppercase text-[22vw] sm:text-[18vw] leading-[0.8] tracking-tighter"
			style="-webkit-text-stroke: 1.5px #F3F2EE; color: transparent;"
		>
			AlexCart<span class="text-[#FF3B00]" style="-webkit-text-stroke: 0;">é</span>r
		</span>

		<!-- Solid fill overlay — clip-path wipe from left -->
		<span
			aria-hidden="true"
			class="absolute inset-0 block font-display uppercase text-[22vw] sm:text-[18vw] leading-[0.8] tracking-tighter text-[#F3F2EE] pt-16 sm:pt-24 pb-4 px-2 sm:px-4"
			style:clip-path="inset(0 {100 - fillPct}% 0 0)"
		>
			AlexCart<span class="text-[#FF3B00]">é</span>r
		</span>
	</div>

	<!-- Info grid: 12 cols / 4 sections -->
	<div class="grid grid-cols-2 sm:grid-cols-4 border-b border-[#F3F2EE]/10">
		<!-- © year -->
		<div class="px-4 sm:px-8 py-6 border-r border-[#F3F2EE]/10">
			<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3F2EE]/40 mb-2">Copyright</p>
			<p class="font-mono text-sm text-[#F3F2EE]/70">&copy; {year}</p>
		</div>

		<!-- Berlin live clock -->
		<div class="px-4 sm:px-8 py-6 border-r-0 sm:border-r border-[#F3F2EE]/10">
			<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3F2EE]/40 mb-2">Berlin</p>
			<p
				data-testid="footer-clock"
				class="font-mono text-sm text-[#F3F2EE]/70 tabular-nums"
			>
				{berlinTime}
			</p>
		</div>

		<!-- Built with -->
		<div class="px-4 sm:px-8 py-6 border-t sm:border-t-0 border-r border-[#F3F2EE]/10">
			<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3F2EE]/40 mb-2">Built With</p>
			<p class="font-mono text-[11px] text-[#F3F2EE]/50 leading-relaxed">
				SvelteKit · Svelte 5<br />
				Lenis · Stubbornness
			</p>
		</div>

		<!-- Back to top -->
		<div class="px-4 sm:px-8 py-6 border-t sm:border-t-0 flex items-center">
			<a
				href="#top"
				data-testid="footer-back-top"
				class="font-mono text-xs uppercase tracking-[0.2em] text-[#F3F2EE]/40 hover:text-[#FF3B00] transition-colors duration-300 group flex items-center gap-2"
			>
				<span class="inline-block transition-transform duration-300 group-hover:-translate-y-1">↑</span>
				Back to start
			</a>
		</div>
	</div>

	<!-- Bottom strip -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-8 py-6">
		<p class="font-mono text-[10px] text-[#F3F2EE]/20">
			Designed &amp; built by hand in Berlin. No templates, no shortcuts.
		</p>
		<p class="font-mono text-[10px] text-[#F3F2EE]/20">
			End of scroll — Vol. 001
		</p>
	</div>
</footer>
