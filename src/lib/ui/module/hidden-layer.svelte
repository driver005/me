<script lang="ts">
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	const prefersReduced =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	let sectionRef: HTMLElement | null = $state(null);
	let topLayerRef: HTMLElement | null = $state(null);

	const ANNOTATIONS = [
		{ x: '8%', y: '14%', text: 'grid: 12-col' },
		{ x: '62%', y: '10%', text: 'z-index: 40' },
		{ x: '18%', y: '78%', text: 'flex: 1 1 0%' },
		{ x: '70%', y: '68%', text: 'ease: power3.out' },
		{ x: '40%', y: '46%', text: 'rem(--gap: 1.5)' }
	];

	$effect(() => {
		if (!browser || !sectionRef || !topLayerRef || prefersReduced) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				topLayerRef,
				{ clipPath: 'inset(0 0 0 0)' },
				{
					clipPath: 'inset(0 0 0 100%)',
					ease: 'none',
					scrollTrigger: {
						trigger: sectionRef,
						start: 'top top',
						end: '+=150%',
						scrub: 1,
						pin: true
					}
				}
			);
		}, sectionRef);

		return () => ctx.revert();
	});
</script>

{#if prefersReduced}
	<section
		data-testid="hidden-layer-section"
		class="relative flex items-center justify-center border-b border-black bg-[#0A0A0A] px-4 py-24"
	>
		<div
			class="flex aspect-[16/10] w-full max-w-2xl items-center justify-center border-2 border-[#F3F2EE] bg-[#F3F2EE]"
		>
			<span class="font-display text-3xl tracking-tighter text-[#0A0A0A] uppercase sm:text-5xl"
				>The big picture.</span
			>
		</div>
	</section>
{:else}
	<section
		bind:this={sectionRef}
		data-testid="hidden-layer-section"
		class="relative flex h-screen items-center justify-center overflow-hidden border-b border-black bg-[#0A0A0A]"
	>
		<span
			class="absolute top-6 left-1/2 z-30 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-[#F3F2EE]/40 uppercase sm:top-10"
		>
			§ under the hood
		</span>

		<!-- Bottom layer — the structure beneath -->
		<div class="absolute inset-0 z-0">
			<!-- <svg class="w-full h-full" preserveAspectRatio="none"> -->
			<!-- 	<defs> -->
			<!-- 		<pattern id="blueprint-grid" width="48" height="48" patternUnits="userSpaceOnUse"> -->
			<!-- 			<path d="M 48 0 L 0 0 0 48" fill="none" stroke="#F3F2EE" stroke-opacity="0.08" stroke-width="1" /> -->
			<!-- 		</pattern> -->
			<!-- 	</defs> -->
			<!-- 	<rect width="100%" height="100%" fill="url(#blueprint-grid)" /> -->
			<!-- </svg> -->
			{#each ANNOTATIONS as a}
				<span
					class="absolute border border-[#FF3B00]/30 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.15em] text-[#FF3B00]/70 uppercase sm:text-xs"
					style:left={a.x}
					style:top={a.y}>{a.text}</span
				>
			{/each}
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="font-display text-4xl tracking-tighter text-[#F3F2EE]/15 uppercase sm:text-6xl"
					>Under the hood.</span
				>
			</div>
		</div>

		<!-- Top layer — the finished product, wipes away on scroll -->
		<div
			bind:this={topLayerRef}
			class="absolute inset-0 z-10 flex items-center justify-center bg-[#F3F2EE]"
			style="clip-path: inset(0 0 0 0);"
		>
			<div class="w-[80vw] max-w-xl border-2 border-[#0A0A0A] bg-[#F3F2EE] sm:w-[60vw]">
				<div class="flex items-center gap-1.5 border-b-2 border-[#0A0A0A] px-3 py-2">
					<span class="h-2 w-2 rounded-full bg-[#0A0A0A]/20"></span>
					<span class="h-2 w-2 rounded-full bg-[#0A0A0A]/20"></span>
					<span class="h-2 w-2 rounded-full bg-[#0A0A0A]/20"></span>
				</div>
				<div class="p-6 sm:p-8">
					<div class="h-3 w-2/3 bg-[#0A0A0A]/80"></div>
					<div class="mt-2 h-3 w-1/2 bg-[#0A0A0A]/80"></div>
					<div class="mt-5 aspect-video bg-[#0A0A0A]/10"></div>
					<div class="mt-5 flex gap-2">
						<div class="h-8 w-24 bg-[#FF3B00]"></div>
						<div class="h-8 w-24 border border-[#0A0A0A]"></div>
					</div>
				</div>
			</div>
			<span
				class="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-[#0A0A0A]/50 uppercase"
			>
				The big picture.
			</span>
		</div>
	</section>
{/if}
