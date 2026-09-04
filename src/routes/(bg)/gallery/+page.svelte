<!-- src/routes/(bg)/gallery/+page.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { buildGalleryImages, COLS, GALLERY_ROWS } from '$lib/data/gallery-images';
	import { Gallery } from '$lib/three/gallery/gallery';
	import { Scroll } from '$lib/three/shared/scroll';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';
	import { social_links } from '$lib/data';

	const SOCIAL_LINKS = [
		{ label: m['dock.contact.github'](), href: social_links.github },
		{ label: m['dock.contact.x'](), href: social_links.twitter },
		{ label: m['dock.contact.instagram'](), href: social_links.instagram },
		{ label: m['dock.contact.linkedin'](), href: social_links.linkedin },
		{ label: m['dock.contact.blog'](), href: social_links.blog }
	];

	const bgContext = getContext<BgEngineContext>(BG_ENGINE_CONTEXT);
	const isBack = $derived(bgContext.getIsBackMode());

	const IMAGES = buildGalleryImages();

	const GALLERY_TABLET_BREAKPOINT = 724;
	const GALLERY_MOBILE_BREAKPOINT = 300;
	const GALLERY_TABLET_COLS = Math.max(1, Math.ceil(COLS / 2));

	function getGalleryCols(widthPx: number): number {
		if (widthPx < GALLERY_MOBILE_BREAKPOINT) return 1;
		if (widthPx < GALLERY_TABLET_BREAKPOINT) return GALLERY_TABLET_COLS;
		return COLS;
	}

	const GALLERY_BASE_ITEM_SIZE = 36;
	function getGalleryItemSize(cols: number): number {
		return Math.round(GALLERY_BASE_ITEM_SIZE * Math.sqrt(COLS / cols));
	}

	function getGalleryBandCount(cols: number): number {
		return Math.ceil(COLS / cols);
	}

	function getGallerySlotsPerRow(cols: number): number {
		return GALLERY_ROWS * getGalleryBandCount(cols);
	}

	// Jitter constants for scattered placement.
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
				imageScene: gallery!.imageScene
				}
			);
			scroll = new Scroll(scene!, wall);
			currentCols = cols;
		}

		rebuild(getGalleryCols(scene.uniforms.uRes.value.x));

		// Manual rAF loop — scoped to this effect's lifetime.
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

<!-- Static centerpiece overlay — placeholder src. -->
<img
	src={m['assets.gallery_centerpiece']()}
	alt=""
	class="pointer-events-none fixed top-1/2 left-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover shadow-2xl md:h-56 md:w-56"
/>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col gap-3 p-8 {isBack ? 'text-white' : 'text-black'}">
	<a href="/" class="pointer-events-auto w-fit text-sm underline {isBack ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}">{m['common.back_link']()}</a>
	<div class="pointer-events-auto flex flex-wrap gap-x-4 gap-y-1 text-xs">
		{#each SOCIAL_LINKS as link (link.href)}
			<a href={link.href} target="_blank" rel="noopener noreferrer" class="underline {isBack ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}">
				{link.label}
			</a>
		{/each}
	</div>
</div>
