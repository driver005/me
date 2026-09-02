<!-- src/routes/(bg)/gallery/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { buildGalleryImages } from '$lib/data/gallery-images';
	import { Gallery } from '$lib/three/scenes/segerman-bg/gallery';
	import { Scroll } from '$lib/three/scenes/segerman-bg/scroll';
	import { SEGERMAN_BG_CONTEXT, type SegermanBgContext } from '$lib/three/scenes/segerman-bg/context';

	const bgContext = getContext<SegermanBgContext>(SEGERMAN_BG_CONTEXT);

	// The previous 2D CSS-grid gallery's own placeholder images (picsum.photos, 8 columns) — reused
	// here as the WebGL Gallery's items instead of building a new image set. row/col/randomY (that
	// page's own masonry positioning) aren't needed: Gallery's own `rows` option computes wrap/depth
	// positions itself.
	const IMAGES = buildGalleryImages();
	const ROWS = 8;

	$effect(() => {
		const ready = bgContext.getReady();
		const scene = bgContext.getScene();
		const gallery = bgContext.getGallery();
		if (!ready || !scene || !gallery) return;

		const wall = new Gallery(
			scene,
			IMAGES.map((img) => ({ textureUrl: img.src })),
			{
				axis: 'vertical',
				mediaType: 'image',
				titles: false,
				hoverNav: false,
				groupTilt: false,
				rows: ROWS,
				// Smaller than the default project-card size (52x32) — 8 rows of full-size cards would be
				// far too dense/overlapping side by side.
				itemWidth: 18,
				itemHeight: 18,
				// Flat instead of the parabolic depth arc other strips use — items stay in a flat plane as
				// they scroll down from the top instead of bulging toward/away from the camera.
				depthCurve: 0,
				gapFront: 4,
				gapBack: 4,
				center: { x: 0, y: 0, z: 5 },
				// Renders through the home Gallery's own persistent image layer instead of standing up a
				// new scene/layer for this route — dispose() removes this instance's whole subtree from it
				// on navigation away.
				imageScene: gallery.imageScene
			}
		);
		const scroll = new Scroll(scene, wall);

		// Not registered via scene.addLayer() — Scene has no removeLayer(), and this instance/scroll
		// pair is scoped to this page, so a manual rAF loop scoped to this effect's own lifetime avoids
		// leaking phantom layers across navigation (matches the Work page's own carousel pattern).
		let rafId = requestAnimationFrame(function tick() {
			scroll.loop();
			wall.update(0, 0);
			rafId = requestAnimationFrame(tick);
		});

		return () => {
			cancelAnimationFrame(rafId);
			scroll.dispose();
			wall.dispose();
		};
	});
</script>

<svelte:head>
	<title>{m['nav.gallery']()} — Adrian Fernández</title>
</svelte:head>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-8 text-white">
	<a href="/" class="pointer-events-auto w-fit text-sm text-white/60 underline hover:text-white">← Back</a>
</div>
