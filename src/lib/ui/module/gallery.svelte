<script lang="ts">
	import { browser } from '$app/environment';
	import { useScrollStretchY } from '$lib/util/scroll-stretch.svelte';
	import InfiniteGallerySection from './infinite-gallery-section.svelte';

	function mulberry32(seed: number) {
		return function () {
			seed |= 0;
			seed = (seed + 0x6D2B79F5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const COLS = 8;
	const GALLERY_ROWS = 25;

	function buildImages() {
		const rand = mulberry32(42);
		const rng = (lo: number, hi: number) => lo + rand() * (hi - lo);
		const images: Array<{ src: string; row: number; col: number; randomY: number }> = [];
		let seedId = 1;

		for (let row = 1; row <= GALLERY_ROWS; row++) {
			const count = rand() < 0.28 ? 2 : 1;
			const used = new Set<number>();

			for (let k = 0; k < count; k++) {
				let col: number, tries = 0;
				do {
					col = Math.floor(rng(0, COLS)) + 1;
					tries++;
				} while (used.has(col) && tries < 20);
				used.add(col);

				const size = Math.round(rng(300, 600));
				images.push({
					src: `https://picsum.photos/seed/pg${seedId++}/${size}/${size}`,
					row,
					col,
					randomY: Math.round(rng(-100, 100)),
				});
			}
		}

		return images;
	}

	const IMAGES = buildImages();

	let headingRef: HTMLElement | null = $state(null);
	let visualX = $state('-8%');
	let archiveX = $state('8%');

	$effect(() => {
		if (!browser) return;
		const el = headingRef;
		if (!el) return;
		const onScroll = () => {
			const rect = el.getBoundingClientRect();
			const vh = window.innerHeight;
			// matches useScroll offset: ["start 90%", "start 20%"]
			const progress = Math.max(0, Math.min(1, (vh * 0.9 - rect.top) / (vh * 0.7)));
			visualX = `${-8 + progress * 8}%`;
			archiveX = `${8 - progress * 8}%`;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	let scaleY = useScrollStretchY({ amount: 0.07 });
</script>

<section class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-[#F3F2EE]/20">
	<div class="grid grid-cols-12 border-b border-[#F3F2EE]/20">
		<div class="col-span-6 sm:col-span-3 px-4 sm:px-8 py-4 border-r border-[#F3F2EE]/20">
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">
				§ 06 — Gallery
			</span>
		</div>
		<div class="col-span-6 sm:col-span-6 px-4 sm:px-8 py-4 border-r border-[#F3F2EE]/20">
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">
				Selected works 2023—2026
			</span>
		</div>
		<div class="hidden sm:block col-span-3 px-4 sm:px-8 py-4">
			<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#555]">
				Scroll ↳ explore
			</span>
		</div>
	</div>
	<div bind:this={headingRef} class="px-4 sm:px-8 py-12 sm:py-20">
		<h2 class="font-display uppercase text-[14vw] sm:text-[11vw] leading-[0.85] tracking-tighter overflow-hidden">
			<span
				class="block"
				style="transform: scaleY({scaleY.value}) translateX({visualX}); transform-origin: 50% 100%;"
			>
				Visual
			</span>
			<span
				class="block text-stroke-inverted italic"
				style="transform: scaleY({scaleY.value}) translateX({archiveX}); transform-origin: 50% 0%;"
			>
				Archive<span class="text-[#FF3B00] not-italic">.</span>
			</span>
		</h2>
	</div>
</section>

<InfiniteGallerySection {IMAGES} />
