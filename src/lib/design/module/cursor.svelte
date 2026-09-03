<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '$lib/util/reduced-motion';
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';

	let x = useMotionValue(-100);
	let y = useMotionValue(-100);
	let ghostX = useMotionValue(-100);
	let ghostY = useMotionValue(-100);

	const prefersReduced = prefersReducedMotion();

	const springConfig = prefersReduced
		? { stiffness: 9999, damping: 9999 }
		: { damping: 25, stiffness: 350, mass: 0.4 };

	const ghostConfig = prefersReduced
		? { stiffness: 9999, damping: 9999 }
		: { damping: 40, stiffness: 200, mass: 0.6 };

	let springX = useSpring(x, springConfig);
	let springY = useSpring(y, springConfig);
	let springGhostX = useSpring(ghostX, ghostConfig);
	let springGhostY = useSpring(ghostY, ghostConfig);
	let hover = $state(false);
	let hidden = $state(true);
	let cursorLabel = $state('');
	let dotColor = $state('#FFFFFF');
	let ringColor = $state('#FFFFFF');
	let cursorMode = $derived(
		cursorLabel === 'view'
			? 'view'
			: cursorLabel === 'drag'
				? 'drag'
				: cursorLabel === 'link'
					? 'link'
					: hover
						? 'hover'
						: 'default'
	);

	function parseRgb(str: string): [number, number, number] | null {
		const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
		return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
	}

	function luminance(r: number, g: number, b: number): number {
		return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	function sampleBgColor(cx: number, cy: number): string {
		const el = document.elementFromPoint(cx, cy);
		if (!el) return '#000000';
		let current: HTMLElement | null = el as HTMLElement;
		while (current && current !== document.documentElement) {
			const bg = getComputedStyle(current).backgroundColor;
			const rgb = parseRgb(bg);
			if (rgb) {
				const a = parseFloat(bg.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)?.[1] ?? '1');
				if (a > 0.1) return bg;
			}
			current = current.parentElement;
		}
		return '#000000';
	}

	onMount(() => {
		const move = (e: MouseEvent) => {
			x.set(e.clientX);
			y.set(e.clientY);
			ghostX.set(e.clientX);
			ghostY.set(e.clientY);
			hidden = false;

			const bg = sampleBgColor(e.clientX, e.clientY);
			const rgb = parseRgb(bg);
			if (rgb) {
				const l = luminance(rgb[0], rgb[1], rgb[2]);
				const c = l > 0.5 ? '#0A0A0A' : '#FFFFFF';
				dotColor = c;
				ringColor = c;
			}
		};
		const over = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			const el = t.closest('[data-cursor], a, button, input, textarea, [role="button"]');
			if (el) {
				cursorLabel = el.getAttribute('data-cursor') || '';
				hover = true;
			} else {
				cursorLabel = '';
				hover = false;
			}
		};
		const leave = () => {
			hidden = true;
		};

		window.addEventListener('mousemove', move);
		window.addEventListener('mouseover', over);
		window.addEventListener('mouseleave', leave);
		return () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseover', over);
			window.removeEventListener('mouseleave', leave);
		};
	});
</script>

<Motion style={{ translateX: springX, translateY: springY }} let:motion>
	<div
		use:motion
		data-testid="custom-cursor"
		aria-hidden="true"
		class="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block"
	>
		<Motion
			animate={{
				scale: hover ? 3.5 : 1,
				opacity: hidden ? 0 : 1,
				backgroundColor: hover ? '#FF3B00' : dotColor
			}}
			transition={{ type: 'spring', stiffness: 400, damping: 28 }}
			let:motion
		>
			<div use:motion class="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
		</Motion>
		{#if cursorLabel}
			<span
				class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] tracking-wider whitespace-nowrap text-white uppercase"
				class:opacity-0={hidden}
				class:opacity-100={!hidden}
				style="transition: opacity 0.15s ease; margin-top: 0.375rem; margin-left: 0.375rem;"
			>
				{cursorLabel}
			</span>
		{/if}
	</div>
</Motion>

<Motion style={{ translateX: springGhostX, translateY: springGhostY }} let:motion>
	<div
		use:motion
		aria-hidden="true"
		class="pointer-events-none fixed top-0 left-0 z-[99] hidden md:block"
	>
		<Motion
			animate={{
				scale: hover ? 1 : 0.6,
				opacity: hidden ? 0 : 0.3,
				borderColor: hover ? '#FF3B00' : ringColor
			}}
			transition={{ type: 'spring', stiffness: 300, damping: 35 }}
			let:motion
		>
			<div use:motion class="h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border"></div>
		</Motion>
	</div>
</Motion>
