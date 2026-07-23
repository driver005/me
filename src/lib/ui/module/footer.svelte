<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';
	import { social_links, socialLabels } from '$lib/data';
	import { SiGithub, SiInstagram, SiX } from '@icons-pack/svelte-simple-icons';
	import { Briefcase, Rss, Mail } from 'lucide-svelte';

	const socials = [
		{ icon: SiGithub, href: social_links.github, label: socialLabels.github },
		{ icon: SiX, href: social_links.twitter, label: socialLabels.x },
		{ icon: SiInstagram, href: social_links.instagram, label: socialLabels.instagram },
		{ icon: Briefcase, href: social_links.linkedin, label: socialLabels.linkedin },
		{ icon: Rss, href: social_links.blog, label: socialLabels.blog },
		{ icon: Mail, href: `mailto:${m.email()}`, label: socialLabels.email },
	];

	// ── Clip-path scroll fill ────────────────────────────────────────────────
	let nameEl = $state<HTMLElement | null>(null);
	let fillPct = $state(0); // 0..100

	const footerObs = useIntersectionObserver({ threshold: 0.1 });

	$effect(() => {
		if (!browser || !nameEl) return;
		const unsub = onScrollBounded(nameEl, (scrollY, vh, rect) => {
			// start when top hits 95% vh, end when top hits 30% vh
			const progress = Math.max(0, Math.min(1,
				1 - (rect.top - vh * 0.3) / (vh * 0.65)
			));
			fillPct = progress * 100;
		});
		return unsub;
	});

	import { useBerlinTime } from '$lib/util/berlin-time.svelte';

	const berlinTime = useBerlinTime();

	const year = new Date().getFullYear();
</script>

<footer data-testid="site-footer" class="bg-[#0A0A0A] text-[#F3F2EE]" style="content-visibility: auto; contain-intrinsic-size: 0 600px;">
	<div class="px-4 sm:px-8 pt-16 pb-6">

	<!-- Large name with scroll-fill clip-path -->
	<div bind:this={nameEl} class="relative font-display uppercase text-[22vw] sm:text-[18vw] leading-[0.8] tracking-tighter select-none overflow-hidden">

		<!-- Outline base (always visible) -->
		<span
			style="-webkit-text-stroke: 1.5px #F3F2EE; color: transparent; display: block;"
		>
			{m['name.first']()}Fern<span class="text-[#FF3B00]" style="-webkit-text-stroke: 0;">á</span>ndez
		</span>

		<!-- Solid fill — clip-path wipes in from left on scroll -->
		<span
			aria-hidden="true"
			class="absolute inset-0"
			style="display: block; color: #F3F2EE; -webkit-text-stroke: 0; clip-path: inset(0 {100 - fillPct}% 0 0); will-change: clip-path;"
		>
			{m['name.first']()}Fern<span class="text-[#FF3B00]">á</span>ndez
		</span>
	</div>

	<!-- Info grid: 12 cols / 4 sections -->
	<div bind:this={footerObs.element} class="mt-12 grid grid-cols-12 border-t border-[#F3F2EE]/20 pt-6 gap-4">
		<div class="col-span-6 sm:col-span-3" style:opacity={footerObs.isIntersecting ? '1' : '0'} style:transform={footerObs.isIntersecting ? 'translateY(0)' : 'translateY(16px)'} style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)" style:transition-delay="0ms">
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
				{berlinTime.value} {m['footer.clock_suffix']()}
			</div>
		</div>
		<div class="col-span-6 sm:col-span-3" style:opacity={footerObs.isIntersecting ? '1' : '0'} style:transform={footerObs.isIntersecting ? 'translateY(0)' : 'translateY(16px)'} style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)" style:transition-delay="60ms">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				{m['footer.built_with']()}
			</span>
			<div class="font-mono text-sm mt-2 text-[#F3F2EE]/50">
				{@html m['footer.tech_stack']()}
			</div>
		</div>
		<div class="col-span-6 sm:col-span-3 sm:text-right" style:opacity={footerObs.isIntersecting ? '1' : '0'} style:transform={footerObs.isIntersecting ? 'translateY(0)' : 'translateY(16px)'} style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)" style:transition-delay="120ms">
			<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/60">
				{m['footer.top']()}
			</span>
			<div class="mt-2">
				<a
					href="#top"
					data-testid="footer-back-top"
					class="font-mono text-sm hover:text-[#FF3B00] text-[#F3F2EE]/70 no-underline transition-colors duration-500 ease-[var(--ease-out-expo)]"
				>
					{m['footer.back_to_start']()}
				</a>
			</div>
		</div>
	</div>

	<!-- Bottom strip -->
	<div class="mt-8 pt-4 border-t border-[#F3F2EE]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			{#each socials as s}
				<a
					href={s.href}
					target="_blank"
					rel="noopener noreferrer"
					class="text-[#F3F2EE]/40 hover:text-[#FF3B00] transition-colors duration-500 ease-[var(--ease-out-expo)]"
					aria-label={s.label}
				>
					<s.icon size={18} />
				</a>
			{/each}
		</div>
		<span class="font-mono text-[9px] uppercase tracking-[0.3em] text-[#F3F2EE]/25">
			{m['footer.end']()}
		</span>
	</div>
	</div>
</footer>
