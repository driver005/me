<script lang="ts">
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	if (browser) gsap.registerPlugin(ScrollTrigger);

	let sectionRef: HTMLElement | null = $state(null);
	let circleEl: HTMLElement | null = $state(null);
	let svgRef: SVGSVGElement | null = $state(null);
	let glowText1 = $state('AWARENESS: SILENCE');
	let glowText2 = $state('STATE: VOID');
	let glowText3 = $state('ENERGY: DORMANT');
	let glowText4 = $state('PRESENCE: SOLID');

	interface CircleTransition {
		initial: { cx: number; cy: number; r: number };
		final: { cx: number; cy: number; r: number };
		outlineEl?: SVGCircleElement;
		filledEl?: SVGCircleElement;
	}

	const circleTransitions: CircleTransition[] = [];

	function setupGeometricBackground() {
		if (!svgRef) return;
		const gridGroup = svgRef.querySelector('#grid-lines') as SVGGElement;
		const outlineGroup = svgRef.querySelector('#circles-outline') as SVGGElement;
		const filledGroup = svgRef.querySelector('#circles-filled-g') as SVGGElement;
		if (!gridGroup || !outlineGroup || !filledGroup) return;

		// Grid: 48px spacing, 1920x1080 viewBox
		const gridSpacing = 48;
		for (let i = 0; i <= 40; i++) {
			const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			vLine.setAttribute('class', 'geo-grid-line');
			vLine.setAttribute('x1', String(i * gridSpacing));
			vLine.setAttribute('y1', '0');
			vLine.setAttribute('x2', String(i * gridSpacing));
			vLine.setAttribute('y2', '1080');
			gridGroup.appendChild(vLine);

			if (i <= 22) {
				const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				hLine.setAttribute('class', 'geo-grid-line');
				hLine.setAttribute('x1', '0');
				hLine.setAttribute('y1', String(i * gridSpacing));
				hLine.setAttribute('x2', '1920');
				hLine.setAttribute('y2', String(i * gridSpacing));
				gridGroup.appendChild(hLine);
			}
		}

		// 13 circles — exact positions from reference
		const d = 80;
		const centerX = 960;
		const centerY = 540;

		const configs = [
			// 4 cardinal at 3d distance, r = d * 0.8
			{ cx: centerX - 3 * d, cy: centerY, r: d * 0.8 },
			{ cx: centerX + 3 * d, cy: centerY, r: d * 0.8 },
			{ cx: centerX, cy: centerY - 3 * d, r: d * 0.8 },
			{ cx: centerX, cy: centerY + 3 * d, r: d * 0.8 },
			// 4 diagonal at 2d distance, r = d * 0.6
			{ cx: centerX - 2 * d, cy: centerY - 2 * d, r: d * 0.6 },
			{ cx: centerX + 2 * d, cy: centerY - 2 * d, r: d * 0.6 },
			{ cx: centerX - 2 * d, cy: centerY + 2 * d, r: d * 0.6 },
			{ cx: centerX + 2 * d, cy: centerY + 2 * d, r: d * 0.6 },
			// 4 cardinal at 4d distance, r = d * 0.4
			{ cx: centerX - 4 * d, cy: centerY, r: d * 0.4 },
			{ cx: centerX + 4 * d, cy: centerY, r: d * 0.4 },
			{ cx: centerX, cy: centerY - 4 * d, r: d * 0.4 },
			{ cx: centerX, cy: centerY + 4 * d, r: d * 0.4 },
			// 1 center, r = d * 0.3
			{ cx: centerX, cy: centerY, r: d * 0.3 }
		];

		configs.forEach((cfg) => {
			const finalCx = centerX;
			const finalCy = centerY;
			const finalR = 4 * d; // 320

			const transition: CircleTransition = {
				initial: { cx: cfg.cx, cy: cfg.cy, r: cfg.r },
				final: { cx: finalCx, cy: finalCy, r: finalR }
			};

			// Outline circle
			const outline = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			outline.setAttribute('class', 'geo-circle-outline');
			outline.setAttribute('cx', String(cfg.cx));
			outline.setAttribute('cy', String(cfg.cy));
			outline.setAttribute('r', String(cfg.r));
			outlineGroup.appendChild(outline);
			transition.outlineEl = outline;

			// Filled circle (clipped to right half)
			const filled = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			filled.setAttribute('class', 'geo-circle-filled');
			filled.setAttribute('cx', String(cfg.cx));
			filled.setAttribute('cy', String(cfg.cy));
			filled.setAttribute('r', String(cfg.r));
			filled.setAttribute('clip-path', 'url(#right-half)');
			filledGroup.appendChild(filled);
			transition.filledEl = filled;

			circleTransitions.push(transition);
		});
	}

	function updateAnimations(progress: number) {
		if (!circleEl || !svgRef) return;

		// Glowing circle: scale + box-shadow
		const scale = 1 + progress * 1.8;
		const shadowSize = progress * 150;
		const shadowSpread = progress * 35;
		const shadowOpacity = progress;

		circleEl.style.transform = `scale(${scale})`;
		circleEl.style.boxShadow = `0 0 ${shadowSize}px ${shadowSpread}px rgba(255, 59, 0, ${shadowOpacity})`;

		// Grid fade: fully visible until ~33% scroll, then fades to 0 at ~67%
		const gridOpacity = Math.max(0, 0.3 * (1 - progress * 1.5));
		svgRef.querySelectorAll('.geo-grid-line').forEach((line) => {
			line.setAttribute('stroke-opacity', String(gridOpacity));
		});

		// Circle convergence
		circleTransitions.forEach((t, index) => {
			const cx = t.initial.cx + (t.final.cx - t.initial.cx) * progress;
			const cy = t.initial.cy + (t.final.cy - t.initial.cy) * progress;
			const r = t.initial.r + (t.final.r - t.initial.r) * progress;
			const rotation = progress * 360 * (index % 2 === 0 ? 1 : -1);
			const opacity = Math.max(0.1, 1 - progress * 0.7);

			if (t.outlineEl) {
				t.outlineEl.setAttribute('cx', String(cx));
				t.outlineEl.setAttribute('cy', String(cy));
				t.outlineEl.setAttribute('r', String(r));
				t.outlineEl.setAttribute('transform', `rotate(${rotation} ${cx} ${cy})`);
				t.outlineEl.setAttribute('stroke-opacity', String(opacity));
			}
			if (t.filledEl) {
				t.filledEl.setAttribute('cx', String(cx));
				t.filledEl.setAttribute('cy', String(cy));
				t.filledEl.setAttribute('r', String(r));
				t.filledEl.setAttribute('transform', `rotate(${rotation} ${cx} ${cy})`);
				t.filledEl.setAttribute('fill-opacity', String(opacity * 0.05));
			}
		});

		// Dynamic text labels (exact from reference)
		const freq1 = (432 + progress * 108).toFixed(1);
		const freq2 = (528 - progress * 156).toFixed(1);
		const energy = (progress * 99.9).toFixed(1);
		const presence = ((1 - progress) * 100).toFixed(1);

		if (progress <= 0.1) {
			glowText1 = `[${freq1}] AWARENESS: SILENCE`;
			glowText2 = `.${freq2} STATE: VOID`;
			glowText3 = `{${energy}} ENERGY: DORMANT`;
		} else if (progress <= 0.25) {
			glowText1 = `[${freq1}] AWARENESS: STIRRING`;
			glowText2 = `.${freq2} STATE: EMERGING`;
			glowText3 = `{${energy}} ENERGY: AWAKENING`;
		} else if (progress <= 0.5) {
			glowText1 = `[${freq1}] AWARENESS: FLOWING`;
			glowText2 = `.${freq2} STATE: EXPANDING`;
			glowText3 = `{${energy}} ENERGY: BUILDING`;
		} else if (progress <= 0.75) {
			glowText1 = `[${freq1}] AWARENESS: ASCENDING`;
			glowText2 = `.${freq2} STATE: DISSOLVING`;
			glowText3 = `{${energy}} ENERGY: RADIATING`;
		} else if (progress <= 0.9) {
			glowText1 = `[${freq1}] AWARENESS: TRANSCENDING`;
			glowText2 = `.${freq2} STATE: INFINITE`;
			glowText3 = `{${energy}} ENERGY: OVERFLOWING`;
		} else {
			glowText1 = `[${freq1}] AWARENESS: UNITY`;
			glowText2 = `.${freq2} STATE: ETERNAL`;
			glowText3 = `{${energy}} ENERGY: PURE`;
		}

		const pi = Math.max(0, 1 - progress);
		if (pi > 0.8) glowText4 = `.${presence} PRESENCE: SOLID`;
		else if (pi > 0.6) glowText4 = `.${presence} PRESENCE: SOFTENING`;
		else if (pi > 0.4) glowText4 = `.${presence} PRESENCE: TRANSLUCENT`;
		else if (pi > 0.2) glowText4 = `.${presence} PRESENCE: ETHEREAL`;
		else glowText4 = `.${presence} PRESENCE: VOID`;
	}

	$effect(() => {
		if (!browser || !sectionRef) return;

		setupGeometricBackground();

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionRef,
					start: 'top top',
					end: 'bottom bottom',
					scrub: 1
				}
			});

			tl.to(
				{},
				{
					duration: 1,
					onUpdate: function () {
						updateAnimations(this.progress());
					}
				}
			);
		}, sectionRef);

		return () => ctx.revert();
	});
</script>

<section
	bind:this={sectionRef}
	data-testid="scroll-experience-section"
	class="relative bg-[#0A0A0A] h-[300vh] overflow-hidden"
>
	<div class="sticky top-0 h-screen w-full overflow-hidden pointer-events-none">
		<!-- Geometric SVG background -->
		<svg
			bind:this={svgRef}
			class="absolute inset-0 w-full h-full"
			viewBox="0 0 1920 1080"
			preserveAspectRatio="xMidYMid slice"
		>
			<g id="grid-lines"></g>
			<g id="circles-outline"></g>
			<g id="circles-filled-g">
				<clipPath id="right-half">
					<rect x="960" y="0" width="960" height="1080" />
				</clipPath>
			</g>

			<!-- Corner text labels -->
			<text class="geo-text" x="100" y="100">THE CREATIVE</text>
			<text class="geo-text" x="100" y="115">PROCESS</text>

			<text class="geo-text geo-text-right" x="1720" y="100">THE ESSENCE</text>
			<text class="geo-text geo-text-right" x="1720" y="115">OF BUILDING</text>

			<!-- Dynamic debug lines -->
			<text class="geo-text" x="100" y="980">{glowText1}</text>
			<text class="geo-text" x="100" y="995">{glowText2}</text>
			<text class="geo-text" x="100" y="1010">{glowText3}</text>
			<text class="geo-text" x="100" y="1025">{glowText4}</text>

			<text class="geo-text geo-text-right" x="1620" y="980">BETWEEN THE</text>
			<text class="geo-text geo-text-right" x="1620" y="995">HEARTBEATS</text>
		</svg>

		<!-- Center glowing circle -->
		<div
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full flex flex-col items-center"
		>
			<div bind:this={circleEl} class="w-20 h-20 bg-[#F3F2EE] rounded-full"></div>
			<div class="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/50">
				Scroll to explore
			</div>
		</div>
	</div>
</section>

<style>
	.geo-text {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		fill: rgba(243, 242, 238, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.geo-text-right {
		text-anchor: end;
	}

	:global(.geo-grid-line) {
		stroke: rgba(243, 242, 238, 0.15);
		stroke-width: 1;
		stroke-opacity: 0.3;
		shape-rendering: crispEdges;
	}

	:global(.geo-circle-outline) {
		stroke: rgba(243, 242, 238, 0.3);
		stroke-width: 1;
		fill: none;
		vector-effect: non-scaling-stroke;
	}

	:global(.geo-circle-filled) {
		stroke: rgba(243, 242, 238, 0.3);
		stroke-width: 1;
		fill: rgba(243, 242, 238, 0.05);
		vector-effect: non-scaling-stroke;
	}
</style>
