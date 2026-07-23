<script lang="ts">
	import { browser } from '$app/environment';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { m } from '$lib/paraglide/messages';

	const FAQS = [
		{
			q: () => m['faq_section.q_1'](),
			a: () => m['faq_section.a_1']()
		},
		{
			q: () => m['faq_section.q_2'](),
			a: () => m['faq_section.a_2']()
		},
		{
			q: () => m['faq_section.q_3'](),
			a: () => m['faq_section.a_3']()
		},
		{
			q: () => m['faq_section.q_4'](),
			a: () => m['faq_section.a_4']()
		},
		{
			q: () => m['faq_section.q_5'](),
			a: () => m['faq_section.a_5']()
		}
	];

	let listRef: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser || !listRef) return;
		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced) return;

		const ctx = gsap.context(() => {
			const rows = gsap.utils.toArray<HTMLElement>(listRef!.children);
			gsap.from(rows, {
				opacity: 0,
				y: 24,
				duration: 0.6,
				ease: 'power3.out',
				stagger: 0.1,
				scrollTrigger: {
					trigger: listRef,
					start: 'top 80%',
					toggleActions: 'play none none reverse'
				}
			});
		}, listRef);

		return () => ctx.revert();
	});
</script>

<section
	id="faq"
	data-testid="faq-section"
	class="relative border-b border-black bg-[#F3F2EE] text-[#0A0A0A]"
>
	<SectionHeaderMarquee text={m['faq_section.marquee']()} reverse separator="✦" />

	<div bind:this={listRef}>
		{#each FAQS as item, i}
			<details
				class="group {i < FAQS.length - 1 ? 'border-b border-black' : ''} px-4 py-5 sm:px-6 sm:py-6"
			>
				<summary
					class="font-display flex cursor-pointer list-none items-center justify-between gap-4 text-lg tracking-tight uppercase sm:text-2xl"
				>
					{item.q()}
					<span
						class="shrink-0 font-mono text-xl transition-transform duration-300 group-open:rotate-45"
						>+</span
					>
				</summary>
				<p class="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-[#0A0A0A]/65 sm:text-base">
					{item.a()}
				</p>
			</details>
		{/each}
	</div>
</section>
