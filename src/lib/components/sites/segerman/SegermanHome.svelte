<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import SegermanPlanetBackground from './SegermanPlanetBackground.svelte';
	import { SEGERMAN_WORKS } from './data';

	const N = SEGERMAN_WORKS.length;

	let hoveredIndex = $state<number | null>(null);
	let activeIndex = $state(0);
	let workEl: HTMLElement;
	let itemEls: HTMLAnchorElement[] = [];

	const previewIndex = $derived(hoveredIndex ?? activeIndex);

	// Infinite looping virtual scroll — ported line-for-line from the real
	// `updateItems()` in segerman.dev's own HomeScroller class
	// (static/sites/segerman-dev-86ede42f/root-7944de32/js/home-pretty.txt):
	//   const t = gap, i = itemHeight + gap, s = i * count
	//   o = ((scroll % s) + s) % s
	//   y = i*x - o + t
	//   y = ((y - centerAdjust + s/2) % s + s) % s - s/2 + centerAdjust
	// `scroll` there comes from a Lenis instance run with `infinite: true`
	// (confirmed in node_modules/lenis — `.scroll` getter is literally
	// `modulo(animatedScroll, limit)` when infinite is on); we accumulate our
	// own unbounded wheel/drag value into the same formula instead of wiring
	// up a scrollable Lenis DOM host, since nothing here needs real scrollbars.
	let desktop = $state(false);
	let containerH = $state(0);
	let cardH = $state(0); // card content height only, px
	let gap = $state(0); // px
	let scrollCurrent = $state(0); // unbounded accumulator
	let positions = $state<number[]>(Array(N).fill(0));

	function layout() {
		if (!desktop || !cardH || !containerH) return;
		const itemSize = cardH + gap;
		const total = itemSize * N;
		const wrapped = ((scrollCurrent % total) + total) % total;
		const half = total / 2;
		const centerAdjust = (containerH - cardH) / 2;

		const next = SEGERMAN_WORKS.map((_, i) => {
			let y = itemSize * i - wrapped + gap;
			y = (((y - centerAdjust + half) % total) + total) % total - half + centerAdjust;
			return y;
		});
		positions = next;

		// whichever card is nearest the container's vertical center is "active"
		const centerY = containerH / 2;
		let closest = 0;
		let closestDist = Infinity;
		next.forEach((y, i) => {
			const dist = Math.abs(y + cardH / 2 - centerY);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		});
		activeIndex = closest;
	}

	onMount(() => {
		if (!browser) return;

		const mq = window.matchMedia('(min-width: 1100px)');
		const applyMq = () => {
			desktop = mq.matches;
			if (!desktop) positions = Array(N).fill(0);
			measure();
		};
		mq.addEventListener('change', applyMq);

		function measure() {
			if (!desktop) return;
			containerH = workEl.clientHeight;
			cardH = itemEls[0]?.offsetHeight ?? 0;
			gap = parseFloat(getComputedStyle(workEl).getPropertyValue('--unit')) || 0;
			layout();
		}
		applyMq();

		const ro = new ResizeObserver(measure);
		ro.observe(workEl);

		let target = 0;
		let current = 0;
		const onWheel = (e: WheelEvent) => {
			if (!workEl.contains(e.target as Node)) return;
			e.preventDefault();
			target += e.deltaY;
		};

		let dragStartY = 0;
		let dragStartTarget = 0;
		let dragging = false;
		const onPointerDown = (e: PointerEvent) => {
			if (!workEl.contains(e.target as Node)) return;
			dragging = true;
			dragStartY = e.clientY;
			dragStartTarget = target;
		};
		const onPointerMove = (e: PointerEvent) => {
			if (!dragging) return;
			target = dragStartTarget - (e.clientY - dragStartY) * 2;
		};
		const onPointerUp = () => (dragging = false);

		let raf = 0;
		const tick = () => {
			current += (target - current) * 0.09;
			scrollCurrent = current;
			layout();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		workEl.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);

		return () => {
			ro.disconnect();
			cancelAnimationFrame(raf);
			workEl.removeEventListener('wheel', onWheel);
			window.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		};
	});
</script>

<SegermanPlanetBackground
	position={[62, -26, -10]}
	scale={90}
	uGlowBiasX={-0.6}
	uRimPow={4.5}
	uGlowPow={3.2}
	uGlowStr={1}
	uRimStr={0}
	uTerrainScale={3.9}
/>

<main class="page-content">
	<div class="home-text-wrapper" data-reveal>
		<h1 class="home-title">
			<span class="line">Creative</span>
			<span class="line">Developer</span>
		</h1>
		<p class="home-tagline">Building high-performance websites with more to discover beneath the surface.</p>
	</div>

	<section class="work" aria-label="Selected work" bind:this={workEl}>
		<ul class="projects">
			{#each SEGERMAN_WORKS as work, i (work.slug)}
				<li class="project-item">
					<a
						class="project"
						bind:this={itemEls[i]}
						href="/segerman/work/{work.slug}"
						style="transform: translateY({positions[i]}px); --reveal-delay: {120 + i * 40}ms"
						data-reveal
					>
						<div class="media-wrapper">
							<video class="media" src={work.video} poster={work.image} autoplay muted loop playsinline preload="auto"
							></video>
						</div>
						<div class="project-meta">
							<span class="project-title-text">{work.title}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<nav class="project-index desktop-only" aria-hidden="true">
		<span class="project-index-title">Index</span>
		<ul class="project-titles">
			{#each SEGERMAN_WORKS as work, i (work.slug)}
				<li
					class="project-title"
					class:is-active={previewIndex === i}
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
				>
					{work.title}
				</li>
			{/each}
		</ul>
		<div class="project-videos">
			{#each SEGERMAN_WORKS as work, i (work.slug)}
				<div class="project-video" class:is-active={previewIndex === i}>
					<div class="media-wrapper">
						<video class="media" src={work.video} poster={work.image} autoplay muted loop playsinline preload="auto"
						></video>
					</div>
				</div>
			{/each}
		</div>
	</nav>
</main>
