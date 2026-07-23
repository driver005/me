<script lang="ts">
	import { browser } from '$app/environment';
	import { favoriteMovies } from '$lib/data';
	import { useDragPan } from '$lib/util/drag-pan.svelte';

	const CARD_W = 220;
	const CARD_H = 320;
	const GAP = 28;
	const CELL_W = CARD_W + GAP;
	const CELL_H = CARD_H + GAP;
	const N = favoriteMovies.length;

	let containerRef: HTMLElement | null = $state(null);
	let containerW = $state(1200);
	let containerH = $state(700);

	const pan = useDragPan({ wrapX: CELL_W * N, wrapY: CELL_H * 100 });

	$effect(() => {
		if (!browser || !containerRef) return;
		const el = containerRef;
		const update = () => {
			containerW = el.clientWidth;
			containerH = el.clientHeight;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const cols = $derived(Math.ceil(containerW / CELL_W) + 2);
	const rows = $derived(Math.ceil(containerH / CELL_H) + 2);

	function mod(n: number, m: number) {
		return ((n % m) + m) % m;
	}

	const tiles = $derived.by(() => {
		const offX = mod(pan.x, CELL_W);
		const offY = mod(pan.y, CELL_H);
		const baseCol = Math.floor(pan.x / CELL_W);
		const baseRow = Math.floor(pan.y / CELL_H);
		const out: Array<{ id: string; left: number; top: number; movie: (typeof favoriteMovies)[number] }> = [];
		for (let r = -1; r < rows - 1; r++) {
			for (let c = -1; c < cols - 1; c++) {
				const col = baseCol + c;
				const row = baseRow + r;
				const idx = mod(col + row * 7, N);
				out.push({
					id: `${col}:${row}`,
					left: c * CELL_W + offX,
					top: r * CELL_H + offY,
					movie: favoriteMovies[idx]
				});
			}
		}
		return out;
	});
</script>

<section
	data-testid="movie-canvas-section"
	class="relative bg-[#0A0A0A] border-b border-black h-screen overflow-hidden"
>
	<span class="pointer-events-none absolute top-6 sm:top-10 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/40 z-20">
		Favorite films — drag to explore
	</span>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={containerRef}
		class="absolute inset-0 touch-none select-none {pan.dragging ? 'cursor-grabbing' : 'cursor-grab'}"
		onpointerdown={pan.onPointerDown}
		onpointermove={pan.onPointerMove}
		onpointerup={pan.onPointerUp}
		onpointercancel={pan.onPointerUp}
		onpointerleave={pan.onPointerUp}
	>
		{#each tiles as tile (tile.id)}
			<div
				class="absolute flex flex-col justify-between border-2 border-[#F3F2EE]/70 bg-[#0A0A0A] p-4"
				style:width="{CARD_W}px"
				style:height="{CARD_H}px"
				style:transform="translate({tile.left}px, {tile.top}px)"
			>
				<span class="font-mono text-xs text-[#FF3B00]">{String(tile.movie.id).padStart(2, '0')}</span>
				<div>
					<div class="font-display uppercase text-xl leading-[0.95] tracking-tight text-[#F3F2EE]">{tile.movie.title}</div>
					<div class="font-mono text-[10px] text-[#F3F2EE]/50 mt-2">{tile.movie.director}</div>
					<div class="font-mono text-[10px] text-[#F3F2EE]/30">{tile.movie.year}</div>
				</div>
			</div>
		{/each}
	</div>
</section>
