<!-- EXPERIMENTAL — page transition test, ported from the technique in
     github.com/Ibaliqbal/codrops-barbajs-page-transition (Astro + Barba.js + GSAP). That repo
     intercepts full page loads via Barba and keeps the outgoing + incoming DOM both mounted to
     crossfade between them — there's no Barba equivalent here since SvelteKit's router only ever
     mounts one route at a time, so this ports the other half of that repo's approach instead: a
     handful of route-specific curtain overlays (opaque shape covers the screen, the route swaps
     underneath while hidden, the same shape uncovers). Which shape plays is picked from the
     destination route id, so different sections of the site get a different signature transition
     instead of one generic effect.

     First cut of this drove the cover/reveal with GSAP timelines keyed to beforeNavigate/
     afterNavigate — invisible in practice, because those hooks don't pause the actual route swap.
     On this static-adapter SPA the swap is close to instant, so afterNavigate fired and reversed the
     cover animation within the same frame or two it started in. Rewritten on `onNavigate`, which
     SvelteKit actually awaits a returned Promise for, using real Svelte in:/out: transitions on the
     overlay element: set `visible = true`, wait for its introend event (cover finished), await
     navigation.complete (route has swapped), set `visible = false`, wait for outroend (reveal
     finished), resolve. That's what makes the timing correct regardless of how fast the swap is.

     Self-contained: to remove, delete this file and drop the <PageTransitions /> mount + its import
     in src/routes/+layout.svelte. -->
<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { cubicInOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';

	type Variant = 'curtain' | 'sweep' | 'draw' | 'polygon' | 'iris';

	// Maps a destination pathname to which shape plays. Deliberately NOT navigation.to.route.id —
	// that includes the (bg) route-group segment (e.g. '/(bg)/about'), which none of these
	// comparisons would ever match, silently falling through to the default every time. pathname is
	// what the rest of the codebase already matches routes on (see src/routes/(bg)/+layout.svelte's
	// own isHomeRoute/isAboutRoute) precisely because the group segment doesn't appear in it.
	// Everything not called out below falls back to the plain curtain wipe.
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

	// A single reversible custom transition, shape picked by `variant`: Svelte runs t 0->1 on mount
	// (in:, i.e. "cover") and 1->0 on unmount (out:, i.e. "reveal"), so one clip-path/transform
	// function per shape naturally plays forwards then backwards — no separate enter/exit code needed.
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

	// Bumped on every call so a nav that starts before a previous one finished doesn't leave stale
	// awaits resolving the WRONG onNavigate's promise (SvelteKit would otherwise hang on the older,
	// now-abandoned one).
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
				// Resolve now — SvelteKit gates the actual DOM swap on THIS promise, so awaiting
				// navigation.complete before resolving would deadlock (it can't complete until the
				// swap happens, which can't happen until this resolves). Everything after this point
				// runs during/after the swap instead of blocking it.
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
		background: #ff3b00;
	}
</style>
