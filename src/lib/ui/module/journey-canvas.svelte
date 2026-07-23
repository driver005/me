<script lang="ts">
	import { browser } from '$app/environment';
	import { journey } from '$lib/data';
	import { m } from '$lib/paraglide/messages';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import { useDragPan } from '$lib/util/drag-pan.svelte';

	const CARD_W = 320;
	const GAP = 100;
	const CELL_W = CARD_W + GAP;
	const PADDING = 80;

	let containerRef: HTMLElement | null = $state(null);
	let containerW = $state(1200);

	$effect(() => {
		if (!browser || !containerRef) return;
		const el = containerRef;
		const update = () => { containerW = el.clientWidth; };
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const contentW = $derived(PADDING * 2 + journey.length * CELL_W - GAP);
	const minX = $derived(Math.min(0, containerW - contentW));

	const pan = useDragPan({ boundsX: () => [minX, 0] });
</script>

<section id="journey" data-testid="journey-section" class="relative bg-[#0A0A0A] text-[#F3F2EE] border-b border-black">
	<SectionHeaderMarquee text={m['journey.marquee']()} dark separator="—" />

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={containerRef}
		data-testid="journey-canvas"
		class="relative h-[420px] sm:h-[460px] overflow-hidden touch-none select-none border-t border-[#F3F2EE]/15 {pan.dragging ? 'cursor-grabbing' : 'cursor-grab'}"
		onpointerdown={pan.onPointerDown}
		onpointermove={pan.onPointerMove}
		onpointerup={pan.onPointerUp}
		onpointercancel={pan.onPointerUp}
		onpointerleave={pan.onPointerUp}
	>
		<div
			class="absolute top-1/2 h-px bg-[#F3F2EE]/15"
			style:left="{PADDING / 2}px"
			style:width="{contentW - PADDING}px"
			style:transform="translate({pan.x}px, -50%)"
		></div>

		{#each journey as milestone, i}
			<div
				class="absolute top-1/2 -translate-y-1/2 border border-[#F3F2EE]/25 bg-[#0A0A0A] p-5 sm:p-6"
				style:width="{CARD_W}px"
				style:transform="translate({PADDING + i * CELL_W + pan.x}px, -50%)"
			>
				<span class="w-2.5 h-2.5 rounded-full bg-[#FF3B00] absolute -top-[9px] left-5"></span>
				<span class="font-mono text-2xl sm:text-3xl text-[#FF3B00] tabular-nums">{milestone.time}</span>
				<h3 class="font-display uppercase text-lg sm:text-xl tracking-tight leading-tight mt-2">
					{milestone.name}
				</h3>
				<p class="font-mono text-xs text-[#F3F2EE]/55 mt-2 leading-relaxed">
					{milestone.text}
				</p>
			</div>
		{/each}
	</div>
</section>
