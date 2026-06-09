<script lang="ts">
	import { browser } from '$app/environment';

	let { img, shapeIndex }: { img: { src: string; row: number; col: number; randomY: number }; shapeIndex: number } = $props();

	const SHAPES: Array<{ clip?: string; grawlix?: string }> = [
		{ clip: 'circle(44%)' },
		{ clip: 'ellipse(44% 40% at 50% 50%)' },
		{ clip: 'inset(4% round 18%)' },
		{ clip: 'inset(12% 6% round 24%)' },
		{ clip: 'polygon(50% 5%, 61% 38%, 97% 38%, 68% 58%, 79% 91%, 50% 72%, 21% 91%, 32% 58%, 3% 38%, 39% 38%)' },
		{ clip: 'polygon(50% 0%, 60% 38%, 100% 50%, 60% 62%, 50% 100%, 40% 62%, 0% 50%, 40% 38%)' },
		{ clip: 'polygon(0% 0%, 100% 0%, 100% 78%, 60% 78%, 50% 100%, 40% 78%, 0% 78%)' },
		{ clip: 'polygon(0% 0%, 100% 0%, 100% 78%, 22% 78%, 8% 100%, 18% 78%, 0% 78%)' },
		{ grawlix: '@' },
		{ grawlix: '#' },
		{ grawlix: '$' },
		{ grawlix: '%' },
		{ grawlix: '!' },
		{ grawlix: '*' },
	];

	let itemRef: HTMLElement | null = $state(null);
	let translateY = $state('0%');

	$effect(() => {
		if (!browser) return;
		const el = itemRef;
		if (!el) return;
		const onScroll = () => {
			const rect = el.getBoundingClientRect();
			const total = window.innerHeight + rect.height;
			const scrolled = window.innerHeight - rect.top;
			const progress = Math.max(0, Math.min(1, scrolled / total));
			translateY = `${progress * img.randomY}%`;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const shape = SHAPES[shapeIndex % SHAPES.length];
	const gId = `g${shapeIndex}`;
</script>

<div bind:this={itemRef} style="grid-row: {img.row}; grid-column: {img.col};">
	{#if shape.grawlix}
		<div
			class="relative w-full overflow-hidden"
			style="aspect-ratio: 3/4; transform: translateY({translateY});"
		>
			<svg viewBox="0 0 75 100" class="absolute inset-0 w-full h-full">
				<defs>
					<filter id={`htf-${gId}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
						<feColorMatrix in="SourceGraphic" type="saturate" values="2.5" result="sat"/>
						<feGaussianBlur in="sat" stdDeviation="0.6" result="blurred"/>
						<feComponentTransfer in="blurred">
							<feFuncR type="linear" slope="12.75" intercept="-7"/>
							<feFuncG type="linear" slope="12.75" intercept="-7"/>
							<feFuncB type="linear" slope="12.75" intercept="-7"/>
						</feComponentTransfer>
					</filter>
					<radialGradient id={`rg-${gId}`} cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="black" />
						<stop offset="100%" stopColor="white" />
					</radialGradient>
					<pattern id={`dt-${gId}`} x="0" y="0" width="7" height="7" patternUnits="userSpaceOnUse">
						<rect width="7" height="7" fill="white" />
						<circle cx="3.5" cy="3.5" r="3.5" fill={`url(#rg-${gId})`} />
					</pattern>
					<clipPath id={`cp-${gId}`}>
						<text x="37.5" y="90" textAnchor="middle" fontSize="88" fontFamily="Impact, 'Arial Black', sans-serif" fontWeight="900">
							{shape.grawlix}
						</text>
					</clipPath>
				</defs>
				<g filter={`url(#htf-${gId})`} clipPath={`url(#cp-${gId})`}>
					<rect width="75" height="100" fill={`url(#dt-${gId})`} />
					<image href={img.src} width="75" height="100" preserveAspectRatio="xMidYMid slice" style="mix-blend-mode: hard-light;" />
				</g>
			</svg>
		</div>
	{:else}
		<div
			class="relative w-full overflow-hidden"
			style="aspect-ratio: 3/4; transform: translateY({translateY}); clip-path: {shape.clip};"
		>
			<div class="absolute inset-0" style="filter: saturate(2.5) brightness(0.85) blur(1.2px) contrast(1500%);">
				<div class="absolute inset-0" style="background: radial-gradient(circle at center, #000, #fff); background-size: 7px 7px;"></div>
				<div class="absolute inset-0" style="background-image: url({img.src}); background-size: cover; background-position: center; mix-blend-mode: hard-light;"></div>
			</div>
		</div>
	{/if}
</div>
