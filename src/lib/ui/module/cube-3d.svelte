<script lang="ts">
	import { Motion, useMotionValue, useSpring } from 'svelte-motion';

	let { size = 220 }: { size?: number } = $props();

	const FACES = [
		{ tx: 'rotateY(0deg)', img: 'https://images.unsplash.com/photo-1761083261633-5aa782b6ddfc', label: 'Heliograph' },
		{ tx: 'rotateY(90deg)', img: 'https://images.unsplash.com/photo-1760476943801-59ea26b13c3c', label: 'Field Notes' },
		{ tx: 'rotateY(180deg)', img: 'https://images.unsplash.com/photo-1761428961720-38db3883826b', label: 'Volta' },
		{ tx: 'rotateY(-90deg)', img: 'https://images.pexels.com/photos/20874864/pexels-photo-20874864.jpeg', label: 'Atlas' },
		{ tx: 'rotateX(90deg)', img: 'https://images.pexels.com/photos/32191170/pexels-photo-32191170.jpeg', label: 'Pale' },
		{ tx: 'rotateX(-90deg)', img: 'https://images.unsplash.com/photo-1714765761465-e7a4974fa05b', label: 'Half-Light' },
	];

	let half = size / 2;
	let mx = useMotionValue(0);
	let my = useMotionValue(0);
	let smx = useSpring(mx, { stiffness: 160, damping: 22 });
	let smy = useSpring(my, { stiffness: 160, damping: 22 });

	let containerRef: HTMLElement | null = $state(null);

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
</script>

<div
	bind:this={containerRef}
	onmousemove={onMove}
	onmouseleave={onLeave}
	data-testid="cube-3d"
	class="relative"
	style="width: {size}px; height: {size}px; perspective: 1200px;"
>
	<Motion
		animate={{ rotateY: 360, rotateX: 360 }}
		transition={{
			rotateY: { duration: 22, ease: 'linear', repeat: Infinity },
			rotateX: { duration: 32, ease: 'linear', repeat: Infinity },
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
