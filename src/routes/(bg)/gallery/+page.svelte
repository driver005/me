<!-- src/routes/(bg)/gallery/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { buildGalleryImages, COLS, GALLERY_ROWS } from '$lib/data/gallery-images';
	import { Gallery } from '$lib/three/gallery/gallery';
	import { Scroll } from '$lib/three/shared/scroll';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';
	import { social_links } from '$lib/data';

	// Same social set /about links (see info-content.ts's own INFO_CONTENT.links) minus its two credit
	// links (segerman.dev, the planet shader repo) — those belong to that page's bio context, not here.
	// Labels reuse the same dock.contact.* keys the site's own contact dock already shows, matching
	// info-content.ts's own identical choice — not a second hardcoded copy of the same five strings.
	const SOCIAL_LINKS = [
		{ label: m['dock.contact.github'](), href: social_links.github },
		{ label: m['dock.contact.x'](), href: social_links.twitter },
		{ label: m['dock.contact.instagram'](), href: social_links.instagram },
		{ label: m['dock.contact.linkedin'](), href: social_links.linkedin },
		{ label: m['dock.contact.blog'](), href: social_links.blog }
	];

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);

	// The previous 2D CSS-grid gallery's own placeholder images (picsum.photos, COLS columns x
	// GALLERY_ROWS rows — see gallery-images.ts, currently 4x13 — only 1-2 images placed per source
	// row — most of the grid was deliberately empty, not a densely packed wall). Reused here as the
	// WebGL Gallery's items: source col -> Gallery row, source row -> that row's own wrap-cycle slot,
	// so the same sparse placement (and hence the same empty gaps) carries over instead of every row
	// being filled solid.
	const IMAGES = buildGalleryImages();

	// Column-count breakpoints, roughly matching common tablet/mobile device widths (not this site's
	// existing SPIRAL_MOBILE_BREAKPOINT, which is a different page's own split) — full COLS side by
	// side above GALLERY_TABLET_BREAKPOINT, half that (rounded up so it's never 0) between it and
	// GALLERY_MOBILE_BREAKPOINT, a single column below that.
	const GALLERY_TABLET_BREAKPOINT = 724;
	const GALLERY_MOBILE_BREAKPOINT = 300;
	const GALLERY_TABLET_COLS = Math.max(1, Math.ceil(COLS / 2));

	function getGalleryCols(widthPx: number): number {
		if (widthPx < GALLERY_MOBILE_BREAKPOINT) return 1;
		if (widthPx < GALLERY_TABLET_BREAKPOINT) return GALLERY_TABLET_COLS;
		return COLS;
	}

	// Bigger items as columns shrink — a sqrt curve rather than a linear one (linear would make the
	// single-mobile-column version comically large; this keeps growth readable while still visibly
	// filling the width fewer columns free up). itemWidth: 18 was tuned for the original 8-column
	// desktop layout; 36 is this file's own current 4-column desktop default (see below).
	const GALLERY_BASE_ITEM_SIZE = 36;
	function getGalleryItemSize(cols: number): number {
		return Math.round(GALLERY_BASE_ITEM_SIZE * Math.sqrt(COLS / cols));
	}

	// How many original (COLS-wide) source columns end up folded into one displayed strip once cols
	// shrinks — e.g. at cols=2 (COLS=4), 2 source columns share every displayed strip.
	function getGalleryBandCount(cols: number): number {
		return Math.ceil(COLS / cols);
	}

	// Total slots a displayed strip needs — GALLERY_ROWS per band folded into it (see
	// getGalleryBandCount()), so every band gets its own reserved slot range within that strip.
	function getGallerySlotsPerRow(cols: number): number {
		return GALLERY_ROWS * getGalleryBandCount(cols);
	}

	// Redistributes the fixed COLS-wide source placement (img.col, 1-COLS) into however many strips
	// are actually showing right now. Naively wrapping via `(img.col - 1) % cols` alone (an earlier
	// version of this) reused the SAME slot number for every folded-in column too (img.row - 1,
	// unchanged) — at cols=1 that puts every one of the COLS source columns' own row-N image at
	// slot N simultaneously, all overlapping at the exact same 3D position instead of scattered.
	// Giving each folded-in "band" (see getGalleryBandCount()) its own GALLERY_ROWS-wide slot range
	// within the strip (this is exactly what getGallerySlotsPerRow() above sizes the strip for) keeps
	// every image at its own unique slot — same sparse scatter as the COLS=4 base case, just spread
	// across a longer strip instead of dropped or stacked.
	// Every slot otherwise sits at an exactly even itemSize+gap spacing along the scroll axis, AND
	// every row sits at an exactly even rowSpacing across the cross axis — with only COLS (or fewer,
	// once a breakpoint halves it) parallel strips, that reads as an obviously regular grid (straight
	// lanes, evenly-spaced rungs) once scrolling, not the scattered wall the original 2D CSS-grid
	// version had (see gallery-images.ts's own randomY/randomX, generated for exactly this and never
	// actually consumed until now). Scaled down from their raw -100..100 range to a healthy fraction
	// of a slot's own spacing — GALLERY_GAP below was bumped up alongside these specifically to give
	// them room to work with before a jittered item's edge reaches its neighbour's.
	const GALLERY_ALONG_JITTER = 16;
	const GALLERY_CROSS_JITTER = 12;
	const GALLERY_GAP = 10;

	function itemsForCols(cols: number) {
		return IMAGES.map((img) => {
			const band = Math.floor((img.col - 1) / cols);
			return {
				textureUrl: img.src,
				row: (img.col - 1) % cols,
				slot: band * GALLERY_ROWS + (img.row - 1),
				alongOffset: (img.randomY / 100) * GALLERY_ALONG_JITTER,
				crossOffset: (img.randomX / 100) * GALLERY_CROSS_JITTER
			};
		});
	}

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const gallery = bgContext.getGallery();
		if (!ready || !scene || !gallery) return;

		let wall: Gallery | null = null;
		let scroll: Scroll | null = null;
		let currentCols = -1;

		function rebuild(cols: number): void {
			scroll?.dispose();
			wall?.dispose();
			const itemSize = getGalleryItemSize(cols);
			wall = new Gallery(
				scene!,
				// col -> row (0 to cols-1), row -> slot (0-12) — see the IMAGES comment above.
				itemsForCols(cols),
				{
					axis: 'vertical',
					mediaType: 'image',
					titles: false,
					hoverNav: false,
					groupTilt: false,
					rows: cols,
					rowSlotCount: getGallerySlotsPerRow(cols),
					itemWidth: itemSize,
					itemHeight: itemSize,
					// Flat instead of the parabolic depth arc other strips use — items stay in a flat plane
					// as they scroll down from the top instead of bulging toward/away from the camera.
					depthCurve: 0,
					// Flat cards too, not the per-card dome every other strip implicitly gets in back mode.
					cardCurve: 0,
					// No sideways/in-depth arc either — cards move in a straight line top to bottom instead
					// of curving away as they scroll from centre (the scene's shared uCurveX/uCurveZ, which
					// every other strip still tracks live).
					worldCurveX: 0,
					worldCurveZ: 0,
					gapFront: GALLERY_GAP,
					gapBack: GALLERY_GAP,
					center: { x: 0, y: 0, z: 5 },
					// Renders through the home Gallery's own persistent image layer instead of standing up
					// a new scene/layer for this route — dispose() removes this instance's whole subtree
					// from it on navigation away.
					imageScene: gallery!.imageScene
				}
			);
			scroll = new Scroll(scene!, wall);
			currentCols = cols;
		}

		rebuild(getGalleryCols(scene.uniforms.uRes.value.x));

		// Not registered via scene.addLayer() — Scene has no removeLayer(), and this instance/scroll
		// pair is scoped to this page, so a manual rAF loop scoped to this effect's own lifetime avoids
		// leaking phantom layers across navigation (matches the Work page's own carousel pattern). Also
		// checks the column breakpoint every frame here — scene.uniforms.uRes is the canvas's own live,
		// ResizeObserver-backed pixel size (see spiral-layout.ts's own comment on why that beats a
		// `window.resize` listener), so this reacts correctly even to a resize that doesn't fire a real
		// top-level DOM resize event.
		let rafId = requestAnimationFrame(function tick() {
			const cols = getGalleryCols(scene!.uniforms.uRes.value.x);
			if (cols !== currentCols) rebuild(cols);
			scroll?.loop();
			wall?.update(0, 0);
			rafId = requestAnimationFrame(tick);
		});

		return () => {
			cancelAnimationFrame(rafId);
			scroll?.dispose();
			wall?.dispose();
		};
	});
</script>

<svelte:head>
	<title>{m['nav.gallery']()} {m['common.title_suffix']()}</title>
</svelte:head>

<!-- Static centerpiece overlay — a plain DOM <img>, not part of the WebGL scene, fixed dead-center
     over the image wall at every breakpoint (desktop, tablet, and the single-column mobile layout
     alike). Placeholder source for now, matching the Home cube's own "stand-in until real content"
     pattern (see center-cube.ts) — swap the src for a real image whenever one's ready. -->
<img
	src={m['assets.gallery_centerpiece']()}
	alt=""
	class="pointer-events-none fixed top-1/2 left-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover shadow-2xl md:h-56 md:w-56"
/>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 text-white">
	<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">{m['common.back_link']()}</a>
	<div class="pointer-events-auto flex flex-wrap gap-x-4 gap-y-1 text-xs">
		{#each SOCIAL_LINKS as link (link.href)}
			<a href={link.href} target="_blank" rel="noopener noreferrer" class="text-white/70 underline hover:text-white">
				{link.label}
			</a>
		{/each}
	</div>
</div>
