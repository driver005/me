<script lang="ts">
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from '$lib/util/reduced-motion';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { m } from '$lib/paraglide/messages';
	import SectionHeaderMarquee from './section-header-marquee.svelte';

	let sectionRef: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser || !sectionRef) return;
		const prefersReduced = prefersReducedMotion();
		if (prefersReduced) return;

		const ctx = gsap.context(() => {
			const gif = sectionRef!.querySelector('[data-gif]');
			const stamp = sectionRef!.querySelector('[data-stamp]');
			const cap = sectionRef!.querySelector('[data-cap]');

			if (gif) {
				gsap.fromTo(
					gif,
					{ scale: 0.95, opacity: 0 },
					{
						scale: 1,
						opacity: 1,
						duration: 0.6,
						ease: 'power3.out',
						scrollTrigger: {
							trigger: sectionRef,
							start: 'top 80%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			}
			if (stamp) {
				gsap.fromTo(
					stamp,
					{ rotation: 20, scale: 1.4, opacity: 0 },
					{
						rotation: -6,
						scale: 1,
						opacity: 1,
						duration: 0.4,
						ease: 'back.out(2)',
						delay: 0.25,
						scrollTrigger: {
							trigger: sectionRef,
							start: 'top 70%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			}
			if (cap) {
				gsap.fromTo(
					cap,
					{ y: 12, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						duration: 0.4,
						ease: 'power2.out',
						delay: 0.35,
						scrollTrigger: {
							trigger: sectionRef,
							start: 'top 65%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			}
		}, sectionRef);

		return () => ctx.revert();
	});
</script>

<section
	bind:this={sectionRef}
	data-testid="penguin-slide-section"
	class="relative border-b border-black bg-[#F3F2EE] text-[#0A0A0A]"
>
	<SectionHeaderMarquee text={m['penguin_slide.marquee']()} reverse separator="★" />

	<div class="relative flex flex-col items-center px-4 py-12 sm:py-20">
		<div data-gif class="w-full max-w-xl overflow-hidden">
			<img
				src="/images/penguins-gold-vault.gif"
				alt={m['penguin_slide.alt']()}
				class="mx-auto block h-auto w-64 sm:w-72 md:w-80"
				loading="lazy"
			/>
		</div>

		<div
			data-stamp
			class="pointer-events-none absolute top-10 right-6 -rotate-6 select-none sm:top-14 sm:right-[calc(50%-240px)]"
		>
			<div class="rounded-sm border-2 border-[#cc2222]/50 px-3 py-1">
				<span
					class="font-mono text-xs font-bold tracking-[0.2em] text-[#cc2222]/50 uppercase sm:text-sm"
				>
					{m['penguin_slide.classified']()}
				</span>
			</div>
		</div>

		<div data-cap class="mt-6 flex flex-col items-center gap-1.5 sm:mt-8">
			<p class="font-mono text-[10px] tracking-[0.3em] text-[#0A0A0A]/30 uppercase">
				{m['penguin_slide.operation']()}
			</p>
			<p class="font-mono text-[9px] tracking-[0.2em] text-[#0A0A0A]/20">
				{m['penguin_slide.division']()}
			</p>
		</div>
	</div>
</section>
