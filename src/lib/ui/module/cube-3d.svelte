<script lang="ts">
	import { browser } from '$app/environment';
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';
	import { works } from '$lib/data';

	let { size = 220 }: { size?: number } = $props();

	const prefersReduced = typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	const FACE_TRANSFORMS = [
		'rotateY(0deg)',
		'rotateY(90deg)',
		'rotateY(180deg)',
		'rotateX(-90deg)',
		'rotateX(90deg)',
		'rotateX(-90deg)',
	];

	const FACES = works.slice(0, 6).map((w, i) => ({
		tx: FACE_TRANSFORMS[i],
		img: w.img,
		label: w.title,
	}));

	const half = $derived(size / 2);
	let mx = useMotionValue(0);
	let my = useMotionValue(0);
	let smx = useSpring(mx, { stiffness: 160, damping: 22 });
	let smy = useSpring(my, { stiffness: 160, damping: 22 });

	let containerRef: HTMLElement | null = $state(null);
	let isVisible = $state(true);

	$effect(() => {
		if (!browser || !containerRef) return;
		const observer = new IntersectionObserver(
			([entry]) => { isVisible = entry.isIntersecting; },
			{ threshold: 0 }
		);
		observer.observe(containerRef);
		return () => observer.disconnect();
	});

	function onMove(e: MouseEvent) {
		const r = containerRef?.getBoundingClientRect();
		if (!r) return;
		const x = (e.clientX - r.left) / r.width - 0.5;
		const y = (e.clientY - r.top) / r.height - 0.5;
		mx.set(y * -30);
		my.set(x * 30);
	}

	function onLeave() {
		mx.set(0);
		my.set(0);
	}

	const shouldAnimate = $derived(!prefersReduced && isVisible);
</script>

<div
	bind:this={containerRef}
	onmousemove={onMove}
	onmouseleave={onLeave}
	role="presentation"
	data-testid="cube-3d"
	class="relative"
	style="width: {size}px; height: {size}px; perspective: 1200px; will-change: transform;"
>
	<Motion
		animate={shouldAnimate ? { rotateY: 360, rotateX: 360 } : { rotateY: 0, rotateX: 0 }}
		transition={{
			rotateY: { duration: shouldAnimate ? 22 : 0.01, ease: 'linear', repeat: shouldAnimate ? Infinity : 0 },
			rotateX: { duration: shouldAnimate ? 32 : 0.01, ease: 'linear', repeat: shouldAnimate ? Infinity : 0 },
		}}
		let:motion
	>
		<div use:motion class="relative w-full h-full" style="transform-style: preserve-3d;">
			<Motion style={{ rotateX: smx, rotateY: smy }} let:motion>
				<div use:motion class="absolute inset-0 w-full h-full" style="transform-style: preserve-3d;">
					{#each FACES as f}
						<div
							class="absolute inset-0 border border-black bg-[#E5E4E0] overflow-hidden"
							style="transform: {f.tx} translateZ({half}px); backface-visibility: hidden;"
						>
							<img src={f.img} alt={f.label} class="w-full h-full object-cover" draggable={false} />
							<span class="absolute bottom-1 left-1 font-mono text-[9px] uppercase tracking-[0.25em] bg-[#F3F2EE] px-1.5 py-0.5">
								{f.label}
							</span>
						</div>
					{/each}
				</div>
			</Motion>
		</div>
	</Motion>
</div>
