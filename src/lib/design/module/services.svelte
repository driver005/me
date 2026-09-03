<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { services } from '$lib/data';
	import RevealText from './reveal-text.svelte';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import { useScrollReveal } from '$lib/util/scroll-reveal.svelte';
	import { gsapStaggerReveal } from '$lib/util/gsap-reveal';
	import { Badge } from '$lib/design/cn/badge';
	import { MetaLabel, Section } from '$lib/design/shared';

	const headingReveal = useScrollReveal({ threshold: 0.1, amount: 50 });

	let cardsContainer: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser || !cardsContainer) return;
		return gsapStaggerReveal(cardsContainer, {
			y: 44,
			scale: 0.96,
			duration: 0.8,
			stagger: 0.1,
			start: 'top 82%'
		});
	});
</script>

<Section
	id="services"
	testid="services-section"
	class="overflow-hidden"
	style="content-visibility: auto; contain-intrinsic-size: 0 800px;"
>
	<!-- Marquee heading strip -->
	<SectionHeaderMarquee text="Capabilities" separator="✷" />

	<!-- Main grid -->
	<div class="relative z-10 grid grid-cols-12 gap-6 px-4 py-10 sm:gap-8 sm:px-8 sm:py-16">
		<!-- Left col: 5 cols -->
		<div bind:this={headingReveal.element} class="col-span-12 md:col-span-5">
			<MetaLabel
				class="text-xs"
				style={`opacity: ${headingReveal.progress}; transform: translateY(${(1 - headingReveal.progress) * 20}px); transition: opacity 0.1s linear, transform 0.1s linear;`}
				>{m['services.meta']()}</MetaLabel
			>

			<!-- Line-reveal heading with scroll reveal -->
			<h2
				class="font-display mt-4 text-5xl leading-[0.9] tracking-tighter text-[#0A0A0A] uppercase sm:text-7xl"
				style:opacity={headingReveal.progress}
				style:transform="translateY({(1 - headingReveal.progress) * 40}px)"
				style:transition="opacity 0.1s linear, transform 0.1s linear"
			>
				<RevealText delay={0}>{m['services.headline_1']()}</RevealText>
				<RevealText delay={100}>{@html m['services.headline_2']()}</RevealText>
			</h2>

			<p class="mt-6 max-w-md font-mono text-sm leading-relaxed text-[#0A0A0A]/70 sm:text-base">
				{m['services.description']()}
			</p>
		</div>

		<!-- Right col: 7 cols — 2×2 card grid -->
		<div
			bind:this={cardsContainer}
			class="col-span-12 grid grid-cols-1 border-t border-l border-black sm:grid-cols-2 md:col-span-7"
		>
			{#each services as svc, i}
				<div
					data-testid="service-{i}"
					class="group border-r border-b border-black p-5 transition-colors duration-300 hover:bg-[#FF3B00] sm:p-6"
				>
					<div class="flex items-center justify-between">
						<Badge
							variant="mono"
							class="px-2 py-0.5 transition-colors duration-300 group-hover:border-black group-hover:text-[#0A0A0A]"
						>
							{svc.code}
						</Badge>
						<span
							class="font-mono text-xs text-[#0A0A0A]/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0A0A0A]"
						>
							↗
						</span>
					</div>

					<h3
						class="font-display mt-6 text-3xl leading-none tracking-tighter uppercase sm:text-4xl group-hover:text-[#0A0A0A]"
					>
						{svc.title}
					</h3>

					<div class="relative mt-2 h-px overflow-hidden bg-black/15 group-hover:bg-black/30">
						<span
							class="absolute inset-y-0 left-0 w-0 bg-[#0A0A0A]/40 transition-[width] duration-500 ease-out group-hover:w-full"
						></span>
					</div>

					<p
						class="mt-4 font-mono text-xs leading-relaxed text-[#0A0A0A]/60 sm:text-sm group-hover:text-[#0A0A0A]"
					>
						{svc.description}
					</p>

					<ul class="mt-6 flex flex-wrap gap-2">
						{#each svc.tags as tag}
							<li>
								<Badge
									variant="mono"
									class="px-2 py-1 transition-colors duration-300 group-hover:border-black group-hover:text-[#0A0A0A]"
								>
									{tag}
								</Badge>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</Section>
