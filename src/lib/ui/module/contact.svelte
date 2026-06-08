<script lang="ts">
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';
	import MagneticButton from './magnetic-button.svelte';

	const headObs = useIntersectionObserver({ threshold: 0.2 });

	const socials = [
		{ label: 'Instagram', href: 'https://instagram.com' },
		{ label: 'Are.na', href: 'https://are.na' },
		{ label: 'Read.cv', href: 'https://read.cv' },
		{ label: 'GitHub', href: 'https://github.com' },
		{ label: 'LinkedIn', href: 'https://linkedin.com' },
		{ label: 'Vimeo', href: 'https://vimeo.com' },
	];
</script>

<section
	id="contact"
	data-testid="contact-section"
	class="bg-[#FF3B00] text-[#0A0A0A] border-b border-black"
>
	<!-- Header strip: 3 cols -->
	<div class="grid grid-cols-12 border-b border-black">
		<div class="col-span-12 sm:col-span-4 px-4 sm:px-8 py-4 border-r-0 sm:border-r border-black">
			<span class="font-mono text-xs uppercase tracking-[0.25em]">§ 06 — Contact</span>
		</div>
		<div class="col-span-12 sm:col-span-5 px-4 sm:px-8 py-4 border-r-0 sm:border-r border-black border-t sm:border-t-0">
			<span class="font-mono text-xs uppercase tracking-[0.25em]">One inbox, two timezones, zero retainers</span>
		</div>
		<div class="col-span-12 sm:col-span-3 px-4 sm:px-8 py-4 border-t sm:border-t-0">
			<span class="font-mono text-xs uppercase tracking-[0.25em]">●REC — 2026</span>
		</div>
	</div>

	<!-- Marquee row -->
	<div class="overflow-hidden border-b border-black py-3 sm:py-4">
		<div
			class="flex gap-0 whitespace-nowrap"
			style="animation: marquee 18s linear infinite; --gap: 0rem;"
		>
			{#each Array(8) as _, i}
				<a
					href="mailto:real4drian@gmail.com"
					data-testid="contact-marquee-{i < 4 ? i : i % 4}"
					class="font-display text-[18vw] sm:text-[14vw] leading-[0.85] tracking-tighter text-[#0A0A0A] no-underline hover:text-[#F3F2EE] transition-colors duration-300 mx-4 sm:mx-6"
				>
					Let's Talk ✷&nbsp;
				</a>
			{/each}
		</div>
	</div>

	<!-- Content grid: 7/5 -->
	<div class="grid grid-cols-1 lg:grid-cols-12 px-4 sm:px-8 py-16 sm:py-24 gap-0">
		<!-- Left: 7 cols -->
		<div class="lg:col-span-7 pr-0 lg:pr-20 mb-16 lg:mb-0 border-b lg:border-b-0 lg:border-r border-black pb-16 lg:pb-0">

			<!-- Line-reveal headline -->
			<h2
				bind:this={headObs.element}
				class="font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.03em] text-[#0A0A0A] mb-10"
			>
				<span class="block overflow-hidden">
					<span
						class="block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:transform={headObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
					>
						Got a brief,
					</span>
				</span>
				<span class="block overflow-hidden">
					<span
						class="block transition-transform duration-700 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:transform={headObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
					>
						a half-idea,
					</span>
				</span>
				<span class="block overflow-hidden">
					<span
						class="block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:transition-delay="200ms"
						style:transform={headObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
					>
						or a problem?
					</span>
				</span>
			</h2>

			<p class="font-sans text-base leading-relaxed text-[#0A0A0A]/70 max-w-md mb-12">
				I work with founders, studios, and teams who want something that doesn't look like
				everything else. Send a brief or just say hello — either works.
			</p>

			<!-- CTAs -->
			<div class="flex flex-wrap gap-4">
				<MagneticButton strength={0.3}>
					<a
						href="mailto:real4drian@gmail.com"
						data-testid="contact-email-cta"
						class="inline-flex items-center gap-3 border border-[#0A0A0A] bg-[#0A0A0A] text-[#F3F2EE] px-8 py-4 font-mono text-sm uppercase tracking-[0.15em] no-underline hover:bg-transparent hover:text-[#0A0A0A] transition-colors duration-300"
					>
						Send a brief →
					</a>
				</MagneticButton>

				<MagneticButton strength={0.3}>
					<a
						href="https://cal.com"
						target="_blank"
						rel="noopener noreferrer"
						data-testid="contact-call-cta"
						class="inline-flex items-center gap-3 border border-[#0A0A0A] bg-transparent text-[#0A0A0A] px-8 py-4 font-mono text-sm uppercase tracking-[0.15em] no-underline hover:bg-[#0A0A0A] hover:text-[#F3F2EE] transition-colors duration-300"
					>
						Book a call →
					</a>
				</MagneticButton>
			</div>
		</div>

		<!-- Right: 5 cols sidebar -->
		<div class="lg:col-span-5 lg:pl-20">
			<div class="space-y-10">
				<!-- Studio address -->
				<div>
					<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A]/50 mb-3">Studio</p>
					<p class="font-sans text-sm leading-relaxed text-[#0A0A0A]/80">
						Berlin, Germany<br />
						Remote-first · Worldwide
					</p>
				</div>

				<!-- Press -->
				<div>
					<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A]/50 mb-3">Press</p>
					<a
						href="mailto:real4drian@gmail.com"
						class="font-sans text-sm text-[#0A0A0A]/80 no-underline hover:text-[#0A0A0A] transition-colors"
					>
						real4drian@gmail.com
					</a>
				</div>

				<!-- Elsewhere -->
				<div>
					<p class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A]/50 mb-3">Elsewhere</p>
					<ul class="space-y-2">
						{#each socials as s}
							<li>
								<a
									href={s.href}
									target="_blank"
									rel="noopener noreferrer"
									data-testid="contact-social-{s.label.toLowerCase()}"
									class="font-sans text-sm text-[#0A0A0A]/80 no-underline hover:text-[#0A0A0A] transition-colors flex items-center gap-2 group"
								>
									<span class="inline-block w-3 h-px bg-[#0A0A0A]/40 group-hover:w-5 transition-all duration-300"></span>
									{s.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>
