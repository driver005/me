<script lang="ts">
	import { useIntersectionObserver } from '$lib/util/intersection.svelte';
	import CountUp from './count-up.svelte';

	// ── Stats data ──────────────────────────────────────────────────────────────
	const stats: { v: string; l: string }[] = [
		{ v: '07', l: 'Years' },
		{ v: '42', l: 'Projects' },
		{ v: '09', l: 'Awards' },
		{ v: '11', l: 'Countries' },
	];

	// ── Headline line-by-line reveal ─────────────────────────────────────────
	const headlineObs = useIntersectionObserver({ threshold: 0.2 });

	// ── Bio paragraph reveal ─────────────────────────────────────────────────
	const bioObs = useIntersectionObserver({ threshold: 0.15 });

	// ── Stats reveal ─────────────────────────────────────────────────────────
	const statsObs = useIntersectionObserver({ threshold: 0.2 });

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
	class="relative overflow-hidden bg-[#F3F2EE] px-6 py-32 md:px-12 border-b border-black"
	data-testid="about-section"
>
	<!-- Header strip -->
	<div class="grid grid-cols-12 border-b border-black">
  <div class="col-span-12 sm:col-span-6 px-4 sm:px-8 py-4 border-r-0 sm:border-r border-black">
    <span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">§ 02 — About</span>
  </div>
  <div class="col-span-12 sm:col-span-6 px-4 sm:px-8 py-4 border-t sm:border-t-0 border-black">
    <span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">A short, unreliable biography</span>
  </div>
</div>

	<!-- Main grid: 7 col text | 5 col portrait -->
	<div class="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
		<!-- ── Text column (7 cols) ───────────────────────────────────────── -->
		<div class="lg:col-span-7 md:border-r border-black">
			<!-- Headline with line-by-line slide-up reveal -->
			<div bind:this={headlineObs.element} class="mb-14">
				<h2 class="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[0.92] tracking-[-0.03em] text-black">
					{#each [
						{ text: 'I make things', delay: '0ms' },
						{ text: 'that feel loud', delay: '80ms' },
						{ text: 'in quiet rooms.', delay: '160ms' },
					] as line}
						<span class="block overflow-hidden">
							<span
								class="block transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
								style:transform={headlineObs.isIntersecting ? 'translateY(0)' : 'translateY(110%)'}
								style:transition-delay={line.delay}
							>
								{line.text}
							</span>
						</span>
					{/each}
				</h2>
			</div>

			<!-- Bio paragraphs -->
			<div bind:this={bioObs.element} class="mb-16 space-y-6">
				<p
					class="max-w-prose font-sans text-lg leading-relaxed text-black/70 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
					style:opacity={bioObs.isIntersecting ? '1' : '0'}
					style:transform={bioObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
					style:transition-delay="0ms"
				>
					I'm a designer and developer who lives at the intersection of craft and code.
					I obsess over the milliseconds between interaction and response — that pause
					where something either feels alive or doesn't.
				</p>
				<p
					class="max-w-prose font-sans text-base leading-relaxed text-black/50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
					style:opacity={bioObs.isIntersecting ? '1' : '0'}
					style:transform={bioObs.isIntersecting ? 'translateY(0)' : 'translateY(24px)'}
					style:transition-delay="120ms"
				>
					From interactive installations to campaign sites, I build things that
					move people — literally and otherwise. Based in Berlin, working worldwide.
				</p>
			</div>

			<!-- Stats grid with CountUp -->
			<div
				bind:this={statsObs.element}
				class="grid grid-cols-2 gap-x-10 gap-y-8 border-t border-black/10 pt-10 sm:grid-cols-4"
			>
				{#each stats as s, i}
					<div
						class="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
						style:opacity={statsObs.isIntersecting ? '1' : '0'}
						style:transform={statsObs.isIntersecting ? 'translateY(0)' : 'translateY(20px)'}
						style:transition-delay="{i * 80}ms"
					>
						<CountUp
							value={s.v}
							suffix={s.v === '07' ? '+' : ''}
							class="font-display text-4xl font-black text-black sm:text-5xl"
						/>
						<span class="mt-1 block font-mono text-xs uppercase tracking-[0.15em] text-black/40">
							{s.l}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- ── Portrait column (5 cols) — inline sub-component ──────────── -->
		<div class="lg:col-span-5">
			<div class="sticky top-20" style:perspective="1200px">
				<!-- 3-D card wrapper -->
				<div
					role="img"
					aria-label="Portrait of A. Cartér"
					onmousemove={onMove}
					onmouseleave={onLeave}
					style:transform="rotateX({rx}deg) rotateY({ry}deg)"
					style:transform-style="preserve-3d"
					style:transition="transform 0.35s cubic-bezier(0.22,1,0.36,1)"
					class="relative aspect-[4/5] w-full cursor-none overflow-hidden border-b border-black bg-[#0A0A0A]"
				>
					<!-- Portrait image with inner parallax -->
					<img
						src="https://images.pexels.com/photos/33675021/pexels-photo-33675021.jpeg"
						alt="Portrait — A. Cartér"
						style:transform="translate({px}px, {py}px) scale(1.08)"
						style:transition="transform 0.4s cubic-bezier(0.22,1,0.36,1)"
						class="absolute inset-0 h-full w-full object-cover grayscale contrast-[1.1]"
						draggable="false"
					/>

					<!-- SVG depth lines: 4 nested rects + 2 diagonal lines -->
					<svg
						class="pointer-events-none absolute inset-0 h-full w-full"
						viewBox="0 0 400 500"
						preserveAspectRatio="none"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="8"  y="8"  width="384" height="484" stroke="white" stroke-opacity="0.08" stroke-width="1"/>
						<rect x="16" y="16" width="368" height="468" stroke="white" stroke-opacity="0.06" stroke-width="0.75"/>
						<rect x="24" y="24" width="352" height="452" stroke="white" stroke-opacity="0.04" stroke-width="0.5"/>
						<rect x="32" y="32" width="336" height="436" stroke="white" stroke-opacity="0.03" stroke-width="0.5"/>
						<!-- diagonal depth lines -->
						<line x1="8"   y1="8"   x2="32"  y2="32"  stroke="white" stroke-opacity="0.08" stroke-width="0.5"/>
						<line x1="392" y1="8"   x2="368" y2="32"  stroke="white" stroke-opacity="0.08" stroke-width="0.5"/>
					</svg>

					<!-- Corner labels -->
					<span class="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
						▌Specimen
					</span>
					<span class="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
						01/01
					</span>
					<span class="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-white/50">
						ISO 800
					</span>
					<span class="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-widest text-[#FF6B35]">
						●REC
					</span>
				</div>

				<!-- Caption -->
				<div class="mt-4 flex items-center justify-between px-1">
					<p class="font-mono text-[11px] text-black/40">
						Fig. 1 — A. Cartér, photographed in Mitte, 2025.
					</p>
					<span class="font-mono text-[11px] text-[#FF6B35]">●REC</span>
				</div>
			</div>
		</div>
	</div>
</section>
