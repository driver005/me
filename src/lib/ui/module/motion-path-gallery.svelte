<script lang="ts">
	import { browser } from '$app/environment';
	import { works } from '$lib/data';
	import gsap from 'gsap';
	import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

	if (browser) gsap.registerPlugin(MotionPathPlugin);

	const GAP = 10;
	let isOpen = $state(false);
	let thumbnailsEl: HTMLElement[] = $state([]);
	let numbersEl: HTMLElement[] = $state([]);
	let featuredEl: HTMLElement | null = $state(null);
	let openBtnEl: HTMLButtonElement | null = $state(null);

	let tl: gsap.core.Timeline | null = null;

	const scale = $derived(
		typeof window !== 'undefined' && window.innerWidth < 768 ? 0.6 : 0.4
	);

	function getThumbnailRect() {
		if (thumbnailsEl.length === 0) return { width: 200, height: 280, top: 0, right: 0, left: 0 };
		const rect = thumbnailsEl[0].getBoundingClientRect();
		return {
			width: rect.width,
			height: rect.height,
			top: rect.top,
			right: rect.right,
			left: rect.left
		};
	}

	function buildTimeline() {
		if (tl) tl.kill();
		if (thumbnailsEl.length === 0) return;

		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const thumb = getThumbnailRect();
		const scaledWidth = thumb.width * scale;

		// Target position: right-aligned vertical strip, centered vertically
		const targetX = vw - thumb.right + (thumb.width - scaledWidth) / 2;
		const targetY = (vh - thumb.height * scale + thumb.top - GAP * 2) / 2;

		tl = gsap.timeline({
			defaults: { duration: 1.2, ease: 'expo.inOut' },
			paused: true
		});

		// Step 1: Fade out open button
		if (openBtnEl) {
			tl.to(openBtnEl, { opacity: 0, duration: 0.5 }, 0);
		}

		// Step 2: Animate thumbnails along MotionPath
		// @ts-ignore — MotionPathPlugin types are incomplete
		tl.to(
			thumbnailsEl,
			{
				motionPath: (index: number) => {
					const targetYItem = targetY - index * (thumb.height * scale + GAP);
					return {
						path: [
							{
								x: targetX * 0.95,
								y: -targetYItem * 0.095,
								scale: (1 - scale) * 0.25 + scale
							},
							{
								x: targetX,
								y: -targetYItem,
								scale
							}
						],
						curviness: 0.45
					};
				},
				stagger: { from: 'start', each: 0.02 }
			},
			'<'
		);

		// Step 3: Fade in number labels
		tl.fromTo(
			numbersEl,
			{ opacity: 0, yPercent: 50 },
			{ opacity: 1, yPercent: 0, stagger: 0.045 },
			'<'
		);

		// Step 4: Show featured content
		if (featuredEl) {
			tl.to(featuredEl, { scale: 1, opacity: 1 }, '<');
		}
	}

	function openGallery() {
		if (!isOpen) {
			buildTimeline();
			tl?.play();
			isOpen = true;
		}
	}

	function closeGallery() {
		if (isOpen && tl) {
			tl.reverse();
			isOpen = false;
		}
	}

	function onResize() {
		if (tl) {
			const progress = tl.progress();
			tl.progress(0).pause();
			buildTimeline();
			tl.progress(progress).pause();
		}
	}

	$effect(() => {
		if (!browser) return;
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<section
	data-testid="motion-path-gallery"
	class="relative bg-[#0A0A0A] text-[#F3F2EE] min-h-screen overflow-hidden flex flex-col justify-center"
>
	<span
		class="absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/40 z-20"
	>
		§ 07 — Motion Path Gallery
	</span>

	<div class="relative w-full h-[80vh]">
		<!-- Thumbnails (all stacked at bottom-left) -->
		{#each works as work, i}
			<div
				bind:this={thumbnailsEl[i]}
				class="absolute left-0 bottom-0 will-change-transform"
				style:width="200px"
				style:height="280px"
				style:z-index={works.length - i}
				style:transform="translate(1.5rem, -1.5rem)"
			>
				<div
					class="absolute top-0 left-0 w-full h-full border-2 border-[#F3F2EE]/70 bg-[#0A0A0A] p-4 flex flex-col justify-between"
				>
					<span class="font-mono text-xs text-[#FF3B00]"
						>{String(work.id).padStart(2, '0')}</span
					>
					<div>
						<div
							class="font-display uppercase text-lg leading-[0.95] tracking-tight text-[#F3F2EE]"
						>
							{work.title}
						</div>
						<div class="font-mono text-[10px] text-[#F3F2EE]/50 mt-2">{work.client}</div>
						<div class="font-mono text-[10px] text-[#F3F2EE]/30">{work.year}</div>
					</div>
				</div>
				<!-- Number label (hidden initially) -->
				<span
					bind:this={numbersEl[i]}
					class="absolute top-0 left-0 font-mono text-base text-[#FF3B00] opacity-0 px-3 py-1"
					style:transform="translateX(-100%)"
				>
					{String(i + 1).padStart(2, '0')}
				</span>
			</div>
		{/each}

		<!-- Featured content (hidden initially) -->
		<div
			bind:this={featuredEl}
			class="absolute right-12 top-1/2 -translate-y-1/2 max-w-[20vw] opacity-0"
			style:transform="translateY(-50%) scale(0.9)"
		>
			<div class="border-2 border-[#F3F2EE]/40 bg-[#0A0A0A] p-6">
				<div class="font-display uppercase text-2xl tracking-tight text-[#F3F2EE]">
					Featured Work
				</div>
				<div class="font-mono text-xs text-[#F3F2EE]/50 mt-2">
					Click a thumbnail to explore
				</div>
			</div>
		</div>

		<!-- Open button -->
		<button
			bind:this={openBtnEl}
			type="button"
			onclick={openGallery}
			class="absolute bottom-8 left-8 font-mono text-xs uppercase tracking-[0.2em] px-6 py-3 border border-[#F3F2EE]/40 text-[#F3F2EE] hover:bg-[#FF3B00] hover:border-[#FF3B00] transition-colors duration-300 z-30"
		>
			+ Open
		</button>

		<!-- Close button (fixed, hidden by default) -->
		<button
			type="button"
			onclick={closeGallery}
			class="fixed bottom-6 right-6 font-mono text-xs uppercase tracking-[0.2em] px-4 py-2 border border-[#F3F2EE]/40 text-[#F3F2EE] bg-[#0A0A0A]/80 backdrop-blur-sm hover:bg-[#FF3B00] hover:border-[#FF3B00] transition-colors duration-300 z-50"
			class:opacity-100={isOpen}
			class:pointer-events-auto={isOpen}
			class:opacity-0={!isOpen}
			class:pointer-events-none={!isOpen}
		>
			<div class="w-3 h-0.5 bg-current mb-1"></div>
			Close
		</button>
	</div>
</section>
