<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { works as projects } from '$lib/data';
	import ScrambleText from './scramble-text.svelte';
	import Cube3d from './cube-3d.svelte';
	import SectionHeader from './section-header.svelte';

	// --- Scroll-driven heading slide ---
	let headingEl = $state<HTMLElement | null>(null);
	let selectedX = $state('-8%');
	let worksX = $state('8%');

	$effect(() => {
		const onScroll = () => {
			if (!headingEl) return;
			const rect = headingEl.getBoundingClientRect();
			const vh = window.innerHeight;
			const progress = Math.max(0, Math.min(1, 1 - (rect.top - vh * 0.2) / (vh * 0.7)));
			const x = progress * 8;
			selectedX = `${-8 + x}%`;
			worksX = `${8 - x}%`;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	});

	// --- Image trail ---
	interface TrailItem { id: number; x: number; y: number; img: string; rot: number }
	let trail = $state<TrailItem[]>([]);
	let idCounter = 0;
	let lastSpawn = { x: 0, y: 0, t: 0, projectId: 0 };
	let containerEl = $state<HTMLElement | null>(null);

	function spawn(clientX: number, clientY: number, project: { id: number; img: string }) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		const dx = x - lastSpawn.x;
		const dy = y - lastSpawn.y;
		const dist = Math.hypot(dx, dy);
		const now = performance.now();
		if (dist < 70 && project.id === lastSpawn.projectId && now - lastSpawn.t < 80) return;
		lastSpawn = { x, y, t: now, projectId: project.id };
		idCounter += 1;
		const id = idCounter;
		const rot = (Math.random() - 0.5) * 16;
		trail = [...trail, { id, x, y, img: project.img, rot }];
		const MAX_TRAIL = 5;
		if (trail.length > MAX_TRAIL) trail = trail.slice(trail.length - MAX_TRAIL);
		setTimeout(() => { trail = trail.filter(t => t.id !== id); }, 900);
	}
</script>

<section
	id="work"
	data-testid="works-section"
	class="border-b border-black bg-[#F3F2EE]"
>
	<!-- Header strip -->
	<SectionHeader items={[
		{ label: m['works.meta'], span: 'col-span-6 sm:col-span-3' },
		{ label: m['works.meta_sub'], span: 'col-span-6 sm:col-span-6' },
		{ label: m['works.meta_hint'], span: 'hidden sm:block col-span-3' },
	]} /> 

	<!-- Large heading with scroll-driven slide -->
	<div
		bind:this={headingEl}
		class="px-4 sm:px-8 pt-10 sm:pt-16 grid grid-cols-12 gap-6 items-end"
	>
		<h2 class="col-span-12 md:col-span-9 font-display uppercase text-[14vw] sm:text-[11vw] leading-[0.85] tracking-tighter overflow-hidden">
			<span
				class="block"
				style:transform="translateX({selectedX})"
			>
				{m['works.title_selected']()}
			</span>
			<span
				class="block text-stroke italic"
				style:transform="translateX({worksX})"
			>
				{m['works.title_works']()}
			</span>
		</h2>
		<!-- Cube3D -->
		<div class="hidden md:flex col-span-3 justify-end items-end pb-4">
			<Cube3d size={220} />
		</div>
	</div>

	<!-- Project rows -->
	<div
		bind:this={containerEl}
		class="relative mt-12 sm:mt-20 border-t border-black"
		onmouseleave={() => { lastSpawn = { x: 0, y: 0, t: 0, projectId: 0 }; }}
		role="list"
	>
			{#each projects as p, i (p.id)}
			<a
				href="#contact"
				data-testid="work-row-{p.id}"
				data-cursor="hover"
				class="group block border-b border-black opacity-0 text-[#0A0A0A] no-underline"
				style:animation="fadeUp 0.6s {i * 0.07}s cubic-bezier(0.22,1,0.36,1) both"
				onmousemove={(e) => spawn(e.clientX, e.clientY, p)}
				role="listitem"
			>
				<div class="grid grid-cols-12 items-center px-4 sm:px-8 py-6 sm:py-8 hover:bg-[#0A0A0A] hover:text-[#F3F2EE] transition-colors duration-300">
					<span class="col-span-1 font-mono text-xs uppercase tracking-[0.25em] opacity-50">
						( {String(i + 1).padStart(2, '0')} )
					</span>
					<span class="col-span-7 sm:col-span-5 font-display uppercase text-3xl sm:text-5xl lg:text-6xl leading-none tracking-tighter">
						<ScrambleText text={p.title} />
					</span>
					<span class="col-span-4 sm:col-span-3 font-mono text-xs sm:text-sm uppercase tracking-[0.2em]">
						{p.client}
					</span>
					<span class="hidden sm:block col-span-2 font-mono text-xs uppercase tracking-[0.2em] opacity-70 italic">
						{p.category}
					</span>
					<span class="hidden sm:flex col-span-1 font-mono text-xs uppercase tracking-[0.25em] justify-end items-center">
						<span class="relative overflow-hidden inline-flex flex-col" style:height="1.1em" style:line-height="1.1em">
							<span class="block transition-transform duration-300 ease-out group-hover:-translate-y-full">{p.year}</span>
							<span class="block absolute inset-x-0 top-full transition-transform duration-300 ease-out group-hover:-translate-y-full text-[#FF3B00]">{m['works.row_view']()}</span>
						</span>
					</span>
				</div>
			</a>
		{/each}

		<!-- Image trail layer -->
			<div class="pointer-events-none absolute inset-0 z-30 hidden md:block">
			{#each trail as t (t.id)}
				<div
					class="absolute border border-black bg-[#E5E4E0] overflow-hidden shadow-[6px_6px_0_0_#0A0A0A]"
					style:left="{t.x}px"
					style:top="{t.y}px"
					style:width="260px"
					style:aspect-ratio="4/5"
					style:translate="-50% -50%"
					style:rotate="{t.rot}deg"
					style:animation="trailIn 0.5s cubic-bezier(0.22,1,0.36,1) both"
				>
					<img src={t.img} alt="" class="w-full h-full object-cover" />
				</div>
			{/each}
		</div>
	</div>

	<!-- Footer strip -->
	<div class="px-4 sm:px-8 py-8 flex items-center justify-between">
		<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">
			{m['works.footer_end']()}
		</span>
		<a
			href="#contact"
			data-testid="works-cta"
			class="font-mono text-xs uppercase tracking-[0.25em] px-4 py-2 bg-[#0A0A0A] text-[#F3F2EE] hover:bg-[#FF3B00] transition-colors"
		>
			{m['works.footer_cta']()}
		</a>
	</div>
</section>

<style>
	:global {
		@keyframes trailIn {
			from {
				clip-path: inset(100% 0 0 0);
				transform: scale(0.95);
			}
			to {
				clip-path: inset(0% 0 0 0);
				transform: scale(1);
			}
		}

		@keyframes fadeUp {
			from {
				opacity: 0;
				transform: translateY(32px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
