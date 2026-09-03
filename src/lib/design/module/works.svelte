<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { works as projects } from '$lib/data';
	import { browser } from '$app/environment';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';
	import ScrambleText from './scramble-text.svelte';
	import Cube3d from './cube-3d.svelte';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import { MetaLabel, StaggerReveal } from '$lib/design/shared';

	// --- Scroll-driven heading slide ---
	let headingEl = $state<HTMLElement | null>(null);
	let selectedX = $state('-8%');
	let worksX = $state('8%');

	$effect(() => {
		if (!browser || !headingEl) return;
		const unsub = onScrollBounded(headingEl, (scrollY, vh, rect) => {
			const progress = Math.max(0, Math.min(1, 1 - (rect.top - vh * 0.2) / (vh * 0.7)));
			const x = progress * 8;
			selectedX = `${-8 + x}%`;
			worksX = `${8 - x}%`;
		});
		return unsub;
	});

	// --- Image trail ---
	interface TrailItem {
		id: number;
		x: number;
		y: number;
		img: string;
		rot: number;
	}
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
		setTimeout(() => {
			const el = document.getElementById(`trail-${id}`);
			if (el) el.classList.add('trail-exit');
			setTimeout(() => {
				trail = trail.filter((t) => t.id !== id);
			}, 300);
		}, 600);
	}
</script>

<section id="work" data-testid="works-section" class="border-b border-black bg-[#F3F2EE]">
	<!-- Header strip -->
	<SectionHeaderMarquee text="{m['works.meta']()} × {m['works.meta_sub']()}" separator="?" />

	<!-- Large heading with scroll-driven slide -->
	<div bind:this={headingEl} class="grid grid-cols-12 items-end gap-6 px-4 pt-10 sm:px-8 sm:pt-16">
		<h2
			class="font-display col-span-12 overflow-hidden text-[14vw] leading-[0.85] tracking-tighter uppercase sm:text-[11vw] md:col-span-9"
		>
			<span class="block" style:transform="translateX({selectedX})" style:will-change="transform">
				{m['works.title_selected']()}
			</span>
			<span
				class="text-stroke block italic"
				style:transform="translateX({worksX})"
				style:will-change="transform"
			>
				{m['works.title_works']()}
			</span>
		</h2>
		<!-- Cube3D -->
		<div class="col-span-3 hidden items-end justify-end pb-4 md:flex">
			<Cube3d size={220} />
		</div>
	</div>

	<!-- Project rows -->
	<div
		bind:this={containerEl}
		class="relative mt-12 border-t border-black sm:mt-20"
		onmouseleave={() => {
			lastSpawn = { x: 0, y: 0, t: 0, projectId: 0 };
		}}
		role="list"
	>
		{#each projects as p, i (p.id)}
			<StaggerReveal index={i}>
				<a
					href={p.href}
					target="_blank"
					rel="noopener noreferrer"
					data-testid="work-row-{p.id}"
					data-cursor="hover"
					class="group block border-b border-black text-[#0A0A0A] no-underline transition-transform duration-200 ease-[var(--ease-out-back)] hover:translate-x-1"
					onmousemove={(e) => spawn(e.clientX, e.clientY, p)}
				>
					<div
						class="grid grid-cols-12 items-center px-4 py-6 transition-colors duration-300 hover:bg-[#0A0A0A] hover:text-[#F3F2EE] sm:px-8 sm:py-8"
					>
						<span class="col-span-1 font-mono text-xs tracking-[0.25em] uppercase opacity-50">
							( {String(i + 1).padStart(2, '0')} )
						</span>
						<span
							class="font-display col-span-7 text-3xl leading-none tracking-tighter uppercase sm:col-span-5 sm:text-5xl lg:text-6xl"
						>
							<ScrambleText text={p.title} />
						</span>
						<span
							class="col-span-4 font-mono text-xs tracking-[0.2em] uppercase sm:col-span-3 sm:text-sm"
						>
							{p.client}
						</span>
						<span
							class="col-span-2 hidden font-mono text-xs tracking-[0.2em] uppercase italic opacity-70 sm:block"
						>
							{p.category}
						</span>
						<span
							class="col-span-1 hidden items-center justify-end font-mono text-xs tracking-[0.25em] uppercase sm:flex"
						>
							<span
								class="relative inline-flex flex-col overflow-hidden"
								style:height="1.1em"
								style:line-height="1.1em"
							>
								<span
									class="block transition-transform duration-300 ease-out group-hover:-translate-y-full"
									>{p.year}</span
								>
								<span
									class="absolute inset-x-0 top-full block text-[#FF3B00] transition-transform duration-300 ease-out group-hover:-translate-y-full"
									>{m['works.row_view']()}</span
								>
							</span>
						</span>
					</div>
				</a>
			</StaggerReveal>
		{/each}

		<!-- Image trail layer -->
		<div class="pointer-events-none absolute inset-0 z-30 hidden md:block">
			{#each trail as t (t.id)}
				<div
					class="absolute overflow-hidden border border-black bg-[#E5E4E0] shadow-[6px_6px_0_0_#0A0A0A]"
					style:left="{t.x}px"
					style:top="{t.y}px"
					style:width="260px"
					style:aspect-ratio="4/5"
					style:translate="-50% -50%"
					style:rotate="{t.rot}deg"
					style:animation="trailIn 0.4s var(--ease-out-expo) both"
				>
					<img src={t.img} alt="" class="h-full w-full object-cover" />
				</div>
			{/each}
		</div>
	</div>

	<!-- Footer strip -->
	<div class="flex items-center justify-between px-4 py-8 sm:px-8">
		<MetaLabel class="text-xs text-[#555]">
			{m['works.footer_end']()}
		</MetaLabel>
		<a
			href="#contact"
			data-testid="works-cta"
			class="bg-[#0A0A0A] px-4 py-2 font-mono text-xs tracking-[0.25em] text-[#F3F2EE] uppercase transition-colors duration-500 ease-[var(--ease-out-expo)] hover:bg-[#FF3B00]"
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

		.trail-exit {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
			transition:
				opacity 0.3s var(--ease-out-expo),
				transform 0.3s var(--ease-out-expo);
		}
	}
</style>
