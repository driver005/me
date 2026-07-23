<script lang="ts">
	import { goto } from '$app/navigation';
	import { pageTransition } from '$lib/stores/page-transition';
	import { browser } from '$app/environment';
	import { onScrollBounded } from '$lib/util/scroll-manager.svelte';
	import * as anime from 'animejs';

	let sectionRef = $state<HTMLElement | null>(null);
	let titleRef = $state<HTMLElement | null>(null);
	let videoRef = $state<HTMLVideoElement | null>(null);
	let animating = $state(false);
	let circleEl = $state<SVGCircleElement | null>(null);

	let curtainScale = $state(0);
	let hintOpacity = $state(0);
	let textColor = $state('#0A0A0A');
	let titleOpacity = $state(0);
	let titleY = $state(40);
	let titleScale = $state(1);
	let titleSpacing = $state(0);
	let kickerOpacity = $state(0);
	let ghostOpacity = $state(0);
	let accentOpacity = $state(0);

	const COLOR_START = '#F3F2EE';
	const COLOR_END = '#0A0A0A';

	const TITLE = ['L', 'A', 'C', 'A', 'S', 'A'];

	function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
		const m = hex.replace('#', '').match(/.{2}/g);
		if (!m) return null;
		return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
	}

	function lerpColor(a: string, b: string, t: number): string {
		const ca = hexToRgb(a);
		const cb = hexToRgb(b);
		if (!ca || !cb) return a;
		const r = Math.round(ca.r + (cb.r - ca.r) * t);
		const g = Math.round(ca.g + (cb.g - ca.g) * t);
		const bl = Math.round(ca.b + (cb.b - ca.b) * t);
		return `rgb(${r}, ${g}, ${bl})`;
	}

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function handleClick() {
		if (animating) return;
		animating = true;
		pageTransition.set(true);

		const duration = 1000;
		const start = performance.now();

		function tick() {
			const elapsed = performance.now() - start;
			const t = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - t, 3);
			circleEl?.setAttribute('r', String(eased * 71));
			if (t < 1) requestAnimationFrame(tick);
			else goto('/home');
		}
		requestAnimationFrame(tick);
	}

	function playEntrance() {
		const reduce = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const letters = titleRef?.querySelectorAll('.lc-letter') ?? [];

		if (reduce) {
			titleOpacity = 1;
			titleY = 0;
			kickerOpacity = 1;
			accentOpacity = 1;
			letters.forEach((l) => ((l as HTMLElement).style.opacity = '1'));
			return;
		}

		if (letters.length) {
			anime.animate(letters as unknown as Element[], {
				opacity: [0, 1],
				translateY: [80, 0],
				rotateX: [-90, 0],
				delay: anime.stagger(80, { start: 250 }),
				duration: 900,
				ease: 'outExpo'
			});
		}

		const titleProxy = { o: 0, y: 40, k: 0, a: 0 };
		anime.animate(titleProxy, {
			o: [0, 1],
			y: [40, 0],
			k: [0, 1],
			a: [0, 1],
			duration: 1100,
			ease: 'outExpo',
			onUpdate: () => {
				titleOpacity = titleProxy.o;
				titleY = titleProxy.y;
				kickerOpacity = titleProxy.k;
				accentOpacity = titleProxy.a;
			}
		});
	}

	function initScroll() {
		if (!browser || !sectionRef) return;

		return onScrollBounded(sectionRef, (scrollY: number, vh: number, rect: DOMRect) => {
			const raw = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 1.2)));
			const progress = easeInOutCubic(raw);

			curtainScale = progress;
			textColor = lerpColor(COLOR_END, COLOR_START, progress);

			titleY = 40 - raw * 90;
			titleScale = 1 + raw * 0.1;
			titleSpacing = raw * 0.16;
			titleOpacity = 1 - Math.max(0, raw - 0.7) / 0.3;
			kickerOpacity = 1 - Math.max(0, raw - 0.25) / 0.3;
			accentOpacity = 1 - Math.max(0, raw - 0.5) / 0.3;

			ghostOpacity = Math.max(0, (raw - 0.4) / 0.6);

			hintOpacity = raw > 0.3 && raw < 0.8 ? 1 : 0;
		});
	}

	$effect(() => {
		if (!browser) return;
		playEntrance();
		const unsub = initScroll();
		return () => unsub?.();
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') handleClick();
	}
</script>

<section
	id="room"
	bind:this={sectionRef}
	data-testid="room-section"
	class="grain relative flex h-[120vh] min-h-dvh cursor-pointer items-center justify-center overflow-hidden"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={onKeydown}
>
	<div class="absolute inset-0" style:background-color={COLOR_START}></div>

	<video
		bind:this={videoRef}
		class="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-50"
		src="/textures/video/screen.mp4"
		autoplay
		muted
		loop
		playsinline
	></video>

	<div
		class="absolute inset-0 z-1 bg-[#0A0A0A] will-change-transform"
		style:transform="scaleY({curtainScale})"
		style:transform-origin="bottom center"
		style:mask-image="linear-gradient(to top, #000 82%, transparent 100%)"
		style:-webkit-mask-image="linear-gradient(to top, #000 82%, transparent 100%)"
	></div>

	<div class="pointer-events-none absolute inset-0 z-2 grid place-items-center select-none">
		<span
			class="home-glow font-display text-[clamp(5rem,26vw,22rem)] leading-[0.82] font-bold tracking-tight"
			style:color="#FF3B00"
			style:opacity={ghostOpacity}>HOME</span
		>
	</div>

	<div
		bind:this={titleRef}
		class="pointer-events-none relative z-10 flex flex-col items-center text-center select-none perspective-midrange"
		style:opacity={titleOpacity}
		style:transform="translateY({titleY}px) scale({titleScale})"
	>
		<span
			class="mb-8 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-[#FF3B00] uppercase ring-1 ring-[#FF3B00]/40"
			style:opacity={kickerOpacity}>Room Transition · 001</span
		>

		<div class="flex items-baseline transform-3d" style:letter-spacing="{titleSpacing}em">
			<h2
				class="lc-title font-display leading-[0.85] font-bold text-white mix-blend-difference transform-3d"
			>
				{#each TITLE as ch, i}
					<span
						class="lc-letter inline-block"
						style:display="inline-block"
						style:opacity="0"
						style:transform-style="preserve-3d">{ch}</span
					>
				{/each}
			</h2>
			<span
				class="lc-letter inline-block text-[#FF3B00]"
				style:display="inline-block"
				style:opacity="0"
				style:transform-style="preserve-3d">.</span
			>
		</div>

		<p
			class="mt-10 font-mono text-[10px] tracking-[0.4em] uppercase opacity-70"
			style:color={textColor}
		>
			Est. MMXXIV — Milano
		</p>
	</div>

	<span
		class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] tracking-[0.25em] uppercase opacity-50"
		style:opacity={hintOpacity}
		style:color={textColor}
	>
		Scroll · Click to enter
	</span>
</section>

{#if $pageTransition}
	<div class="pointer-events-none fixed inset-0 z-200 overflow-hidden">
		<div class="grid h-full w-full place-items-center">
			<svg viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid slice" class="h-full w-full">
				<circle bind:this={circleEl} cx="0" cy="0" r="0" fill="#F3F2EE" />
			</svg>
		</div>
	</div>
{/if}

<style>
	:global(#room) {
		color: #0a0a0a;
	}

	.home-glow {
		filter: drop-shadow(0 0 24px rgba(255, 59, 0, 0.45));
		animation: homePulse 2.6s ease-in-out infinite;
	}

	@keyframes homePulse {
		0%,
		100% {
			filter: drop-shadow(0 0 18px rgba(255, 59, 0, 0.35));
		}
		50% {
			filter: drop-shadow(0 0 56px rgba(255, 59, 0, 0.75));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home-glow {
			animation: none;
		}
	}
</style>
