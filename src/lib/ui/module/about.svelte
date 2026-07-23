<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';
	import { useScrollReveal } from '$lib/util/scroll-reveal.svelte';
	import { useParallax } from '$lib/util/parallax.svelte';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import RevealText from './reveal-text.svelte';
	import CountUp from './count-up.svelte';

	// ── Stats data ──────────────────────────────────────────────────────────────
	const stats: { v: string; l: string }[] = [
		{ v: '07+', l: m['about.stat_years']() },
		{ v: '42', l: m['about.stat_projects']() },
		{ v: '09', l: m['about.stat_awards']() },
		{ v: '11', l: m['about.stat_countries']() },
	];

	// ── Bio paragraph reveal ─────────────────────────────────────────────────
	const bioObs = useIntersectionObserver({ threshold: 0.15 });

	// ── Stats reveal ─────────────────────────────────────────────────────────
	const statsObs = useIntersectionObserver({ threshold: 0.2 });

	// ── Scroll reveal for headline ──────────────────────────────────────────
	const headlineReveal = useScrollReveal({ threshold: 0.1, amount: 60 });

	// ── Portrait parallax ───────────────────────────────────────────────────
	const portraitParallax = useParallax({ speed: 0.15 });

	// ── Portrait 3-D card ────────────────────────────────────────────────────
	let rx = $state(0);
	let ry = $state(0);
	let px = $state(0);
	let py = $state(0);

	function onMove(e: MouseEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width - 0.5;
		const y = (e.clientY - r.top) / r.height - 0.5;
		ry = x * 16;
		rx = -y * 12;
		px = x * -18;
		py = y * -18;
	}

	function onLeave() {
		rx = 0;
		ry = 0;
		px = 0;
		py = 0;
	}
</script>

<section
	id="about"
	class="border-b border-black"
	data-testid="about-section"
>
	<!-- Header strip -->
	<SectionHeaderMarquee text="{m['about.meta']()} × {m['about.meta_sub']()}" reverse separator="■" />

	<!-- Main grid: 7 col text | 5 col portrait -->
	<div class="grid grid-cols-12 gap-0">
		<!-- ── Text column (7 cols) ───────────────────────────────────────── -->
		<div class="col-span-12 md:col-span-7 px-4 sm:px-8 py-12 sm:py-20 md:border-r border-black">
			<!-- Headline with scroll-driven parallax reveal -->
			<h2
				bind:this={headlineReveal.element}
				data-testid="about-headline"
				class="font-display uppercase text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-black"
				style:opacity={headlineReveal.progress}
				style:transform="translateY({(1 - headlineReveal.progress) * 30}px)"
				style:transition="opacity 0.1s linear, transform 0.1s linear"
			>
				<RevealText delay={0}>{@html m['about.headline_1']()}</RevealText>
				<RevealText delay={80}>{@html m['about.headline_2']()}</RevealText>
				<RevealText delay={160}>{@html m['about.headline_3']()}</RevealText>
			</h2>

			<!-- Bio paragraphs -->
			<div bind:this={bioObs.element} class="mt-10 max-w-xl font-mono text-sm sm:text-base leading-relaxed text-[#0A0A0A]">
				<p
					class="transition-opacity transition-transform duration-500 ease-[var(--ease-out-expo)]"
					style:opacity={bioObs.isIntersecting ? '1' : '0'}
					style:transform={bioObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
				>
					{m['about.bio_1']()}
				</p>
				<p
					class="mt-4 text-[#555] transition-opacity transition-transform duration-500 ease-[var(--ease-out-expo)]"
					style:opacity={bioObs.isIntersecting ? '1' : '0'}
					style:transform={bioObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
					style:transition-delay="60ms"
				>
					{m['about.bio_2']()}
				</p>
				<!-- Currently block -->
				<div
					class="mt-6 pt-5 border-t border-black/10 transition-opacity transition-transform duration-500 ease-[var(--ease-out-expo)]"
					style:opacity={bioObs.isIntersecting ? '1' : '0'}
					style:transform={bioObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
					style:transition-delay="120ms"
				>
					<span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[#555]">{m['about.current_label']()}</span>
					<p class="mt-2 font-mono text-sm text-[#0A0A0A]">
						{m['about.current_text']()}
						<span class="text-[#FF3B00] font-medium">{m['about.current_open']()}</span>
					</p>
				</div>
			</div>

			<!-- Stats grid with CountUp -->
			<div
				bind:this={statsObs.element}
				class="mt-10 grid grid-cols-2 sm:grid-cols-4 border-t border-l border-black"
			>
				{#each stats as s, i}
					<div
						data-testid="about-stat-{i}"
						class="border-r border-b border-black p-4 sm:p-5 transition-opacity transition-transform duration-500 ease-[var(--ease-out-expo)]"
						style:opacity={statsObs.isIntersecting ? '1' : '0'}
						style:transform={statsObs.isIntersecting ? 'translateY(0)' : 'translateY(20px)'}
						style:transition-delay="{i * 60}ms"
					>
						<div class="font-display text-4xl sm:text-5xl">
							<CountUp value={s.v} suffix={String(s.v).match(/\D+$/)?.[0] || ''} />
						</div>
						<div class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555] mt-2">
							{s.l}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── Portrait column (5 cols) — inline sub-component ──────────── -->
		<div class="col-span-12 md:col-span-5 relative border-t md:border-t-0 border-black">
			<a href="/me" class="block">
			<div class="sticky top-20" style:perspective="1200px">
				<!-- 3-D card wrapper -->
				<div
				role="img"
				aria-label="Portrait of {m['name.first']()} {m['name.last_plain']()}"
					onmousemove={onMove}
					onmouseleave={onLeave}
					bind:this={portraitParallax.element}
					style:transform="rotateX({rx}deg) rotateY({ry}deg) translateY({portraitParallax.y}px)"
					style:transform-style="preserve-3d"
					style:transition="transform 0.35s var(--ease-out-expo)"
					class="relative aspect-[4/5] w-full cursor-none overflow-hidden border-b border-black bg-[#0A0A0A]"
				>
					<!-- Portrait image with inner parallax -->
					<img
						src="https://images.pexels.com/photos/33675021/pexels-photo-33675021.jpeg"
						alt="Portrait — {m['name.first']()} {m['name.last_plain']()}"
						style:transform="translate({px}px, {py}px) scale(1.08)"
						style:transition="transform 0.4s var(--ease-out-expo)"
						class="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.1]"
						draggable="false"
					/>

					<!-- SVG depth lines — receding box -->
					<svg
						aria-hidden="true"
						class="pointer-events-none absolute inset-0 h-full w-full"
						viewBox="0 0 100 125"
						preserveAspectRatio="none"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="10" y="12.5" width="80" height="100" stroke="#F3F2EE" stroke-opacity="0.18" stroke-width="0.18" vector-effect="non-scaling-stroke"/>
						<rect x="18" y="22.5" width="64" height="80" stroke="#F3F2EE" stroke-opacity="0.145" stroke-width="0.18" vector-effect="non-scaling-stroke"/>
						<rect x="28" y="35" width="44" height="55" stroke="#F3F2EE" stroke-opacity="0.11" stroke-width="0.18" vector-effect="non-scaling-stroke"/>
						<rect x="40" y="50" width="20" height="25" stroke="#F3F2EE" stroke-opacity="0.075" stroke-width="0.18" vector-effect="non-scaling-stroke"/>
						<line x1="0" y1="0" x2="100" y2="125" stroke="#F3F2EE" stroke-opacity="0.1" stroke-width="0.1" vector-effect="non-scaling-stroke"/>
						<line x1="100" y1="0" x2="0" y2="125" stroke="#F3F2EE" stroke-opacity="0.1" stroke-width="0.1" vector-effect="non-scaling-stroke"/>
					</svg>

					<!-- Corner labels -->
					<span class="pointer-events-none absolute top-2 left-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#F3F2EE]/80 z-10">
						{m['about.portrait_label']()}
					</span>
					<span class="pointer-events-none absolute top-2 right-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#F3F2EE]/80 z-10">
						{m['about.portrait_number']()}
					</span>
					<span class="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#F3F2EE]/80 z-10">
						{m['about.portrait_iso']()}
					</span>
					<span class="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF3B00] z-10">
						{m['about.portrait_rec']()}
					</span>
				</div>

				<!-- Caption -->
				<div class="px-4 sm:px-8 py-5 flex items-center justify-between">
				<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
					{m['about.portrait_caption']()}
				</span>
					<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF3B00]">
						●REC
					</span>
				</div>
			</div>
			</a>
		</div>
	</div>
</section>
