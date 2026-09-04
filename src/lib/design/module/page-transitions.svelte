<!-- Page transition overlay — route-specific shape covers, driven via onNavigate. -->
<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { cubicInOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';

	type Variant = 'curtain' | 'sweep' | 'draw' | 'polygon' | 'iris';

	// Maps destination pathname to shape variant. Uses pathname (not route.id) to avoid route-group segments.
	function variantFor(pathname: string): Variant {
		if (pathname === '/' || pathname === '/home') return 'iris';
		if (pathname === '/about') return 'sweep';
		if (pathname.startsWith('/skills')) return 'draw';
		if (pathname.startsWith('/works')) return 'polygon';
		return 'curtain';
	}

	const REDUCED_MOTION =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const DURATION = REDUCED_MOTION ? 1 : 650;

	// Reversible custom transition: Svelte runs t 0→1 (in) and 1→0 (out), so one function plays both directions.
	function shapeTransition(_node: Element, { variant }: { variant: Variant }): TransitionConfig {
		return {
			duration: DURATION,
			easing: cubicInOut,
			css: (t: number) => {
				switch (variant) {
					case 'iris':
						// 150% rather than something aspect-ratio-exact — guarantees the circle
						// reaches every corner (radius >= half the diagonal) on any viewport shape.
						return `clip-path: circle(${t * 150}% at 50% 50%);`;
					case 'sweep': {
						// Clock-hand wipe: a pie slice sweeping a full circle, masked in via a
						// conic-gradient hard stop rather than clip-path — the one shape here that
						// reveals by rotation instead of growing outward from a fixed axis/point.
						const deg = t * 360;
						const gradient = `conic-gradient(#0a0a0a 0deg ${deg}deg, transparent ${deg}deg 360deg)`;
						return `-webkit-mask-image: ${gradient}; mask-image: ${gradient};`;
					}
					case 'draw': {
						// Diagonal wipe: a single slanted edge moving from off-screen right (t=0,
						// nothing covered) to off-screen left (t=1, entire box covered), not a
						// fixed-width band — a band never reaches full coverage on its own.
						const edgeTop = 140 - t * 180;
						const edgeBottom = edgeTop - 25;
						return `clip-path: polygon(${edgeTop}% 0%, 100% 0%, 100% 100%, ${edgeBottom}% 100%);`;
					}
					case 'polygon': {
						const half = t * 50;
						return `clip-path: inset(0 ${50 - half}% 0 ${50 - half}%);`;
					}
					default:
						return `clip-path: inset(${50 - t * 50}% 0 ${50 - t * 50}% 0);`;
				}
			}
		};
	}

	let visible = $state(false);
	let variant = $state<Variant>('curtain');
	let overlayEl: HTMLDivElement | undefined = $state();

	function waitForEvent(el: Element, type: string): Promise<void> {
		return new Promise((resolve) => el.addEventListener(type, () => resolve(), { once: true }));
	}

	// Bumped per nav to prevent stale awaits from resolving a previous onNavigate's promise.
	let runId = 0;

	onNavigate((navigation) => {
		if (!navigation.to) return;
		const myRun = ++runId;
		variant = variantFor(navigation.to.url.pathname);

		return new Promise<void>((resolve) => {
			visible = true;
			requestAnimationFrame(async () => {
				if (myRun !== runId || !overlayEl) {
					resolve();
					return;
				}
				await waitForEvent(overlayEl, 'introend');
				// Must resolve before navigation.complete — SvelteKit gates the DOM swap on this promise.
				resolve();
				await navigation.complete;
				if (myRun !== runId) return;
				visible = false;
				if (overlayEl) await waitForEvent(overlayEl, 'outroend');
			});
		});
	});
</script>

<div class="pointer-events-none fixed inset-0 z-[200]">
	{#if visible}
		<div
			bind:this={overlayEl}
			class="shape {variant}"
			in:shapeTransition={{ variant }}
			out:shapeTransition={{ variant }}
		></div>
	{/if}
</div>

<style>
	.shape {
		position: absolute;
		inset: 0;
	}

	.curtain,
	.sweep,
	.draw,
	.iris {
		background: #0a0a0a;
	}

	.sweep {
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
	}

	.polygon {
		background: #0a0a0a;
	}
</style>
