<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { services } from '$lib/data';
	import RevealText from './reveal-text.svelte';
</script>

<section
	id="services"
	data-testid="services-section"
	class="relative bg-[#F3F2EE] text-[#0A0A0A] border-b border-[#0A0A0A]/10 overflow-hidden"
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
					{m['services.marquee']()}
				</span>
			{/each}
		</div>
	</div>

	<!-- Main grid -->
	<div class="relative z-10 grid grid-cols-12 px-4 sm:px-8 py-10 sm:py-16 gap-6 sm:gap-8">
		<!-- Left col: 5 cols -->
		<div class="col-span-12 md:col-span-5">
			<span class="section-meta">{m['services.meta']()}</span>

		<!-- Line-reveal heading -->
		<h2 class="font-display uppercase text-5xl sm:text-7xl mt-4 tracking-tighter leading-[0.9] text-[#0A0A0A]">
			<RevealText delay={0}>{m['services.headline_1']()}</RevealText>
			<RevealText delay={100}>{@html m['services.headline_2']()}</RevealText>
		</h2>

			<p class="mt-6 font-mono text-sm sm:text-base leading-relaxed text-[#0A0A0A]/70 max-w-md">
				{m['services.description']()}
			</p>
		</div>

		<!-- Right col: 7 cols — 2×2 card grid -->
		<div class="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-[#0A0A0A]/15">
			{#each services as svc, i}
				<div
					data-testid="service-{i}"
					class="border-r border-b border-[#0A0A0A]/15 p-5 sm:p-6 group hover:bg-[#FF3B00] transition-colors duration-300"
				>
					<div class="flex items-center justify-between">
						<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#0A0A0A]/50 group-hover:text-[#0A0A0A] border border-[#0A0A0A]/20 group-hover:border-[#0A0A0A]/40 px-2 py-0.5">
							{svc.code}
						</span>
						<span class="font-mono text-xs text-[#0A0A0A]/50 group-hover:text-[#0A0A0A] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
							↗
						</span>
					</div>

					<h3 class="font-display uppercase text-3xl sm:text-4xl mt-6 tracking-tighter leading-none group-hover:text-[#0A0A0A]">
						{svc.title}
					</h3>

					<div class="mt-2 h-px bg-[#0A0A0A]/15 group-hover:bg-[#0A0A0A]/30 relative overflow-hidden">
						<span class="absolute inset-y-0 left-0 w-0 group-hover:w-full bg-[#0A0A0A]/40 transition-[width] duration-500 ease-out" />
					</div>

					<p class="font-mono text-xs sm:text-sm mt-4 leading-relaxed text-[#0A0A0A]/60 group-hover:text-[#0A0A0A]">
						{svc.description}
					</p>

					<ul class="mt-6 flex flex-wrap gap-2">
						{#each svc.tags as tag}
							<li class="font-mono text-[10px] uppercase tracking-[0.2em] border border-[#0A0A0A]/25 px-2 py-1 group-hover:border-[#0A0A0A] group-hover:text-[#0A0A0A]">
								{tag}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>
