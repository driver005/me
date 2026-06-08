<script lang="ts">
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';

	const headObs = useIntersectionObserver({ threshold: 0.2 });

	const services = [
		{
			code: 'S/01',
			title: 'Brand Systems',
			description: 'Complete identity systems from naming through launch. Built to scale, designed to last.',
			tags: ['Identity', 'Naming', 'Type', 'Guidelines'],
		},
		{
			code: 'S/02',
			title: 'Web Experiences',
			description: 'Immersive, performant sites and apps — from editorial to full-stack product builds.',
			tags: ['Next.js', 'React', 'WebGL', 'Framer'],
		},
		{
			code: 'S/03',
			title: 'Art Direction',
			description: 'Visual strategy and creative leadership across campaigns, editorial, and print.',
			tags: ['Campaigns', 'Photo', 'Layout', 'Print'],
		},
		{
			code: 'S/04',
			title: 'Software',
			description: 'Custom tooling, APIs, and back-end systems that disappear into the background.',
			tags: ['Python', 'TS', 'Postgres', 'APIs'],
		},
	];
</script>

<section
	id="services"
	data-testid="services-section"
	class="bg-[#F3F2EE] border-b border-[#0A0A0A]/10"
>
	<!-- Marquee heading strip -->
	<div class="overflow-hidden border-b border-[#0A0A0A]/10 py-4 sm:py-6">
		<div
			class="flex gap-0 whitespace-nowrap"
			style="animation: marquee 20s linear infinite; --gap: 0rem;"
		>
			{#each Array(12) as _}
				<span
					class="font-display uppercase text-5xl sm:text-7xl mx-6 sm:mx-10 tracking-tighter"
					style="-webkit-text-stroke: 1.5px #0A0A0A; color: transparent;"
				>
					Capabilities ✷ Capabilities ✷ Capabilities ✷
				</span>
			{/each}
		</div>
	</div>

	<!-- Header strip -->
	<div class="grid grid-cols-12 border-b border-[#0A0A0A]/10">
		<div class="col-span-12 sm:col-span-6 px-4 sm:px-8 py-4 border-r-0 sm:border-r border-[#0A0A0A]/10">
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">§ 04 — Services</span>
		</div>
		<div class="col-span-12 sm:col-span-6 px-4 sm:px-8 py-4 border-t sm:border-t-0 border-[#0A0A0A]/10">
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">Four disciplines, one studio</span>
		</div>
	</div>

	<!-- Main grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-0 px-4 sm:px-8 py-16 sm:py-24 max-w-none">
		<!-- Left col: 5 cols -->
		<div class="lg:col-span-5 pr-0 lg:pr-16 mb-16 lg:mb-0 border-b lg:border-b-0 lg:border-r border-[#0A0A0A]/10 pb-12 lg:pb-0">
			<p class="font-mono text-xs uppercase tracking-[0.25em] text-[#555] mb-10">§ 04 — Services</p>

			<!-- Line-reveal heading -->
			<h2
				bind:this={headObs.element}
				class="font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.03em] text-[#0A0A0A] mb-10"
			>
				<span class="block overflow-hidden">
					<span
						class="block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:transform={headObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
					>
						What I
					</span>
				</span>
				<span class="block overflow-hidden">
					<span
						class="block transition-transform duration-700 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:transform={headObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
					>
						<span class="italic text-[#FF3B00]">actually</span> do.
					</span>
				</span>
			</h2>

			<p class="font-sans text-base leading-relaxed text-[#0A0A0A]/60 max-w-sm">
				Seven years sharpening four skills. Not a full-service agency — a focused one.
				Each engagement is hands-on, strategy through delivery.
			</p>
		</div>

		<!-- Right col: 7 cols — 2×2 card grid -->
		<div class="lg:col-span-7 lg:pl-16">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-0">
				{#each services as svc, i}
					<div
						data-testid="service-{i}"
						class="group relative border-b border-[#0A0A0A]/10 p-8 cursor-default transition-colors duration-300 hover:bg-[#FF3B00] {i % 2 === 0 ? 'sm:border-r border-[#0A0A0A]/10' : ''}"
					>
						<!-- Card number -->
						<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A]/40 group-hover:text-[#0A0A0A]/60 transition-colors">
							{svc.code}
						</span>

						<!-- Card title -->
						<h3 class="font-display text-2xl sm:text-3xl tracking-tighter text-[#0A0A0A] mt-4 mb-3 group-hover:text-[#0A0A0A] transition-colors">
							{svc.title}
						</h3>

						<!-- Border-fill animation line -->
						<div class="mt-2 h-px bg-[#0A0A0A]/15 relative overflow-hidden">
							<span class="absolute inset-y-0 left-0 w-0 group-hover:w-full bg-[#0A0A0A]/40 transition-[width] duration-500 ease-out" />
						</div>

						<!-- Description -->
						<p class="font-sans text-sm leading-relaxed text-[#0A0A0A]/60 group-hover:text-[#0A0A0A]/70 mt-4 mb-6 transition-colors">
							{svc.description}
						</p>

						<!-- Tag pills -->
						<div class="flex flex-wrap gap-2">
							{#each svc.tags as tag}
								<span class="rounded-full border border-[#0A0A0A]/20 group-hover:border-[#0A0A0A]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#0A0A0A]/50 group-hover:text-[#0A0A0A]/70 transition-colors">
									{tag}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
