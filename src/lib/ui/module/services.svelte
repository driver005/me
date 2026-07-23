<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { services } from '$lib/data';
	import RevealText from './reveal-text.svelte';
	import { useScrollReveal } from '$lib/util/scroll-reveal.svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	const headingReveal = useScrollReveal({ threshold: 0.1, amount: 50 });

	let cardsContainer: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser || !cardsContainer) return;
		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		const ctx = gsap.context(() => {
			const cards = gsap.utils.toArray<HTMLElement>(cardsContainer!.children);
			gsap.from(cards, {
				opacity: 0,
				y: 44,
				scale: 0.96,
				duration: 0.8,
				ease: 'power3.out',
				stagger: 0.1,
				scrollTrigger: {
					trigger: cardsContainer,
					start: 'top 82%',
					toggleActions: 'play none none reverse'
				}
			});
		}, cardsContainer);

		return () => ctx.revert();
	});
</script>

<section
	id="services"
	data-testid="services-section"
	class="relative bg-[#F3F2EE] text-[#0A0A0A] border-b border-black overflow-hidden"
	style="content-visibility: auto; contain-intrinsic-size: 0 800px;"
>
	<!-- Marquee heading strip -->
	<div class="overflow-hidden border-b border-black py-4 sm:py-6">
		<div
			class="flex gap-0 whitespace-nowrap will-change-transform"
			style="animation: marquee 20s linear infinite; --gap: 0rem;"
		>
			{#each Array(12) as _, i}
				{@const words = ['Capabilities', 'Capabilities', 'Capabilities']}
				{#each words as word, j}
					{@const idx = i * words.length + j}
					<span class="flex items-center gap-6 sm:gap-10">
						<span
							class="font-display uppercase text-5xl sm:text-7xl mx-6 sm:mx-10 tracking-tighter"
							style="color: {idx % 4 === 0 ? '#FF3B00' : '#0A0A0A'}"
						>{word}</span>
						<span class="text-5xl sm:text-7xl text-[#0A0A0A]/20">✷</span>
					</span>
				{/each}
			{/each}
		</div>
	</div>

	<!-- Main grid -->
	<div class="relative z-10 grid grid-cols-12 px-4 sm:px-8 py-10 sm:py-16 gap-6 sm:gap-8">
		<!-- Left col: 5 cols -->
		<div bind:this={headingReveal.element} class="col-span-12 md:col-span-5">
			<span class="section-meta" style:opacity={headingReveal.progress} style:transform="translateY({(1 - headingReveal.progress) * 20}px)" style:transition="opacity 0.1s linear, transform 0.1s linear">{m['services.meta']()}</span>

		<!-- Line-reveal heading with scroll reveal -->
		<h2
			class="font-display uppercase text-5xl sm:text-7xl mt-4 tracking-tighter leading-[0.9] text-[#0A0A0A]"
			style:opacity={headingReveal.progress}
			style:transform="translateY({(1 - headingReveal.progress) * 40}px)"
			style:transition="opacity 0.1s linear, transform 0.1s linear"
		>
			<RevealText delay={0}>{m['services.headline_1']()}</RevealText>
			<RevealText delay={100}>{@html m['services.headline_2']()}</RevealText>
		</h2>

			<p class="mt-6 font-mono text-sm sm:text-base leading-relaxed text-[#0A0A0A]/70 max-w-md">
				{m['services.description']()}
			</p>
		</div>

		<!-- Right col: 7 cols — 2×2 card grid -->
		<div bind:this={cardsContainer} class="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-black">
			{#each services as svc, i}
				<div
					data-testid="service-{i}"
					class="border-r border-b border-black p-5 sm:p-6 group hover:bg-[#FF3B00] transition-colors duration-300"
				>
					<div class="flex items-center justify-between">
						<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/50 group-hover:text-[#0A0A0A] border border-black group-hover:border-black px-2 py-0.5">
							{svc.code}
						</span>
						<span class="font-mono text-xs text-[#0A0A0A]/50 group-hover:text-[#0A0A0A] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
							↗
						</span>
					</div>

					<h3 class="font-display uppercase text-3xl sm:text-4xl mt-6 tracking-tighter leading-none group-hover:text-[#0A0A0A]">
						{svc.title}
					</h3>

					<div class="mt-2 h-px bg-black/15 group-hover:bg-black/30 relative overflow-hidden">
						<span class="absolute inset-y-0 left-0 w-0 group-hover:w-full bg-[#0A0A0A]/40 transition-[width] duration-500 ease-out"></span>
					</div>

					<p class="font-mono text-xs sm:text-sm mt-4 leading-relaxed text-[#0A0A0A]/60 group-hover:text-[#0A0A0A]">
						{svc.description}
					</p>

					<ul class="mt-6 flex flex-wrap gap-2">
						{#each svc.tags as tag}
							<li class="font-mono text-[10px] uppercase tracking-[0.2em] border border-black px-2 py-1 group-hover:border-black group-hover:text-[#0A0A0A]">
								{tag}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>
