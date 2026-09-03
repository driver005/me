<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { social_links, socialLabels } from '$lib/data';
	import MagneticButton from './magnetic-button.svelte';
	import RevealText from './reveal-text.svelte';
	import LineHoverText from '$lib/design/custom/line-hover-text.svelte';
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';
	import { useScrollReveal } from '$lib/util/scroll-reveal.svelte';

	const socials = [
		{ label: socialLabels.instagram, href: social_links.instagram },
		{ label: socialLabels.github, href: social_links.github },
		{ label: socialLabels.linkedin, href: social_links.linkedin },
		{ label: socialLabels.x, href: social_links.twitter },
		{ label: socialLabels.blog, href: social_links.blog },
		{ label: socialLabels.email, href: `mailto:${m.email()}` },
	];

	const sidebarObs = useIntersectionObserver({ threshold: 0.15 });
	const headlineReveal = useScrollReveal({ threshold: 0.1, amount: 50 });
	const ctaReveal = useScrollReveal({ threshold: 0.2, amount: 30 });
</script>

<section
	id="contact"
	data-testid="contact-section"
	class="bg-[#FF3B00] text-[#0A0A0A] border-b border-black"
	style="content-visibility: auto; contain-intrinsic-size: 0 900px;"
>
	<!-- Marquee row -->
	<div class="overflow-hidden border-b border-black py-3 sm:py-4">
		<div
			class="flex gap-0 whitespace-nowrap will-change-transform"
			style="animation: marquee 18s linear infinite; --gap: 0rem;"
		>
			{#each Array(4) as _, i}
				<a
					href="mailto:{m.email()}"
					data-testid="contact-marquee-{i}"
					class="font-display uppercase text-[18vw] sm:text-[14vw] mx-6 tracking-tighter leading-none hover:italic text-[#0A0A0A] no-underline"
				>
					{m['contact.marquee']()}
				</a>
			{/each}
		</div>
	</div>

	<!-- Content grid: 7/5 -->
	<div class="grid grid-cols-12 px-4 sm:px-8 py-12 sm:py-20">
		<!-- Left: 7 cols -->
		<div bind:this={headlineReveal.element} class="col-span-12 md:col-span-7">

		<!-- Line-reveal headline with scroll reveal -->
		<h2
			data-testid="contact-headline"
			class="font-display uppercase text-5xl sm:text-7xl tracking-tighter leading-[0.9] text-[#0A0A0A]"
			style:opacity={headlineReveal.progress}
			style:transform="translateY({(1 - headlineReveal.progress) * 40}px)"
			style:transition="opacity 0.1s linear, transform 0.1s linear"
		>
			<RevealText delay={0}>{m['contact.headline_1']()}</RevealText>
			<RevealText delay={100}>{m['contact.headline_2']()}</RevealText>
			<RevealText delay={200}>{@html m['contact.headline_3']()}</RevealText>
		</h2>

			<p class="font-mono text-base sm:text-lg max-w-lg leading-relaxed">
				{m['contact.description']()}
			</p>

			<!-- CTAs -->
			<div class="flex flex-wrap gap-3">
				<MagneticButton strength={0.3}>
					<a
						href="mailto:{m.email()}?subject=Hello"
						data-testid="contact-email-cta"
						class="font-mono text-xs uppercase tracking-[0.25em] px-5 py-3 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#F3F2EE] hover:text-[#0A0A0A] transition-colors duration-300 no-underline inline-block press-feedback"
					>
						{m['contact.email_cta']()}
					</a>
				</MagneticButton>

				<MagneticButton strength={0.3}>
					<a
						href="https://cal.com"
						target="_blank"
						rel="noopener noreferrer"
						data-testid="contact-call-cta"
						class="font-mono text-xs uppercase tracking-[0.25em] px-5 py-3 border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F3F2EE] transition-colors duration-300 no-underline inline-block press-feedback"
					>
						{m['contact.call_cta']()}
					</a>
				</MagneticButton>
			</div>
		</div>

		<!-- Right: 5 cols sidebar -->
		<div bind:this={sidebarObs.element} class="col-span-12 md:col-span-5 mt-12 md:mt-0 md:pl-10 border-l-0 md:border-l border-black">
			<div class="md:pl-8 grid grid-cols-2 gap-y-8">
				<div
					style:opacity={sidebarObs.isIntersecting ? '1' : '0'}
					style:transform={sidebarObs.isIntersecting ? 'translateY(0)' : 'translateY(20px)'}
					style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)"
					style:transition-delay="0ms"
				>
				<span class="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">{m['contact.sidebar_studio']()}</span>
				<div class="mt-2 font-mono text-sm">
					{m['contact.sidebar_address_1']()}<br />{m['contact.sidebar_address_2']()}
				</div>
				</div>
				<div
					style:opacity={sidebarObs.isIntersecting ? '1' : '0'}
					style:transform={sidebarObs.isIntersecting ? 'translateY(0)' : 'translateY(20px)'}
					style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)"
					style:transition-delay="60ms"
				>
				<span class="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">{m['contact.sidebar_press']()}</span>
				<div class="mt-2 font-mono text-sm">
					{m['contact.sidebar_press_email_1']()}<br />{m['contact.sidebar_press_email_2']()}
				</div>
				</div>
				<div
					class="col-span-2"
					style:opacity={sidebarObs.isIntersecting ? '1' : '0'}
					style:transform={sidebarObs.isIntersecting ? 'translateY(0)' : 'translateY(20px)'}
					style:transition="opacity var(--duration-reveal) var(--ease-out-expo), transform var(--duration-reveal) var(--ease-out-expo)"
					style:transition-delay="120ms"
				>
					<span class="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">{m['contact.sidebar_elsewhere']()}</span>
					<ul class="mt-3 grid grid-cols-2 gap-2">
						{#each socials as s}
							<li>
								<a
									href={s.href}
									target="_blank"
									rel="noopener noreferrer"
									data-testid="contact-social-{s.label.toLowerCase()}"
									class="group relative font-mono text-sm border-b border-[#0A0A0A] hover:border-[#FF3B00] inline-block text-[#0A0A0A] no-underline transition-colors duration-300"
								>
									→ <LineHoverText text={s.label} />
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>
