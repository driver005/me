<script lang="ts">
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { m } from '$lib/paraglide/messages';
	import SectionHeaderMarquee from './section-header-marquee.svelte';

	const characters = [
		{ name: 'Skipper', img: '/images/skipper.gif', rotation: -3 },
		{ name: 'Kowalski', img: '/images/kowalski.gif', rotation: 2 },
		{ name: 'Rico', img: '/images/rico.gif', rotation: -1.5 },
		{ name: 'Private', img: '/images/private.gif', rotation: 3.5 },
		{ name: 'Po', img: '/images/kungfu_panda.gif', rotation: -2.5 },
		{ name: 'Tai Lung', img: '/images/tai_lung.gif', rotation: 1 }
	];

	let sectionRef: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser || !sectionRef) return;
		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		const ctx = gsap.context(() => {
			const cards = gsap.utils.toArray<HTMLElement>(sectionRef!.querySelectorAll('[data-card]'));
			gsap.fromTo(cards,
				{ y: 30, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 0.5,
					ease: 'power3.out',
					stagger: 0.1,
					scrollTrigger: {
						trigger: sectionRef,
						start: 'top 80%',
						toggleActions: 'play none none reverse'
					}
				}
			);
		}, sectionRef);

		return () => ctx.revert();
	});
</script>

<section
	bind:this={sectionRef}
	data-testid="penguin-curtain-section"
	class="relative bg-[#FF3B00] text-[#0A0A0A] border-b border-black"
>
	<SectionHeaderMarquee text={m['penguin_curtain.marquee']()} accent="#0A0A0A" separator="✷" />

	<div class="flex flex-col items-center gap-8 sm:gap-10 py-12 sm:py-20 px-4">
		<p class="font-mono text-xs tracking-[0.25em] uppercase text-[#0A0A0A]/60">
			{m['penguin_curtain.subtitle']()}
		</p>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 max-w-5xl w-full">
			{#each characters as character, i}
				<div data-card class="flex flex-col items-center gap-3" style="transform: rotate({character.rotation}deg)">
					<div class="border border-[#0A0A0A]/15 rounded-lg overflow-hidden w-full aspect-square">
						<img
							src={character.img}
							alt="{character.name}"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
					<span
						class="font-mono text-xs tracking-[0.2em] uppercase text-[#0A0A0A]"
					>
						{character.name}
					</span>
				</div>
			{/each}
		</div>

		<p class="font-mono text-[10px] tracking-[0.3em] uppercase text-[#0A0A0A]/30">
			{m['penguin_curtain.footer']()}
		</p>
	</div>
</section>
