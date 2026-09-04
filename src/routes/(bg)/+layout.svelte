<!-- Shared WebGL background for the site's real Home ('/'), Work detail ('/works/[slug]') and About
     ('/about') pages — ported from the /test prototype's own +layout.svelte. Canvas/renderer/camera
     lifecycle now goes through Threlte (<Canvas> + EngineRoot.svelte) instead of a hand-rolled
     `new THREE.WebGLRenderer()`; every layer class below (Stars/Fog/Planet/Gallery/Compositor/...) is
     untouched by that migration — they only ever needed a `Scene` handle, and EngineRoot builds one
     with the exact same shape from Threlte's own context. -->
<script lang="ts">
	import { onDestroy, onMount, setContext, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import gsap from 'gsap';
	import * as THREE from 'three';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { languages } from '$lib/data';
	import EngineRoot from '$lib/three/EngineRoot.svelte';
	import type { Scene } from '$lib/three/scene';
	import { Stars } from '$lib/three/layers/stars';
	import { Fog } from '$lib/three/layers/fog';
	import { FluidSim } from '$lib/three/layers/fluid';
	import { Planet } from '$lib/three/planet/planet';
	import { RaymarchPlanet, PLANET_LOOKS, hexToRgb, getHillBiasForSkill } from '$lib/three/planet/raymarch-planet';
	import { skills } from '$lib/data';
	import { PlanetSwitcher } from '$lib/three/planet/planet-switcher';
	import { Front } from '$lib/three/layers/front';
	import { Compositor, PAGE_LOOK } from '$lib/three/compositor';
	import { mode } from 'mode-watcher';
	import type { PlanetPageId } from '$lib/three/planet/planet';
	import { Gallery } from '$lib/three/gallery/gallery';
	import { WORK_PROJECTS } from '$lib/three/shared/work-content';
	import { SPIRAL_MOBILE_BREAKPOINT } from '$lib/three/spiral/spiral-layout';
	import { Scroll } from '$lib/three/shared/scroll';
	import { Images } from '$lib/three/layers/images';
	import { Video } from '$lib/three/layers/video';
	import { Texts } from '$lib/three/layers/texts';
	import Toggle from './Toggle.svelte';
	import CallScreen from '$lib/design/module/call-screen.svelte';
	import { BG_ENGINE_CONTEXT, type BgEngineContext } from '$lib/three/shared/context';

	let { children }: { children: Snippet } = $props();

	setContext<BgEngineContext>(BG_ENGINE_CONTEXT, {
		getScene: () => scene,
		getGallery: () => gallery,
		getReady: () => webglReady,
		getEarthPlanet: () => earthPlanet,
		getFluidTexture: () => fluid?.texture ?? null,
		getIsBackMode: () => isBackMode
	});

	const MIN_LOADER_DURATION = 1200;
	/** Fog's own built-in default tint (fog.ts) — tweened back to this on any route without a project
	 *  color (home/about/error). */
	const FOG_COLOR_DEFAULT = '#20447e';

	/** Single source of truth for front/back mode — bound two-way with Toggle.svelte (its button also
	 *  flips this), and set here on every route change so a sub-page's forced back mode and Toggle's
	 *  own state can never go stale relative to each other. Also drives the nav link below: white text
	 *  over the white front plate is invisible. */
	let isBackMode = $state(false);

	const isHomeRoute = $derived(page.url.pathname === '/');
	const isAboutRoute = $derived(page.url.pathname === '/about');
	// /imprint and /privacy render PageShell (a separate design-system component, its own fixed light
	// background) OVER this layout's own canvas — the nav below sits at a higher z-index so it stays
	// visible on top of that, but PageShell itself never reads isBackMode/mode.current, so its
	// background is always light regardless of what the (bg) engine's own state says. White nav text
	// there would just be illegible against it.
	const isLegalRoute = $derived(page.url.pathname === '/imprint' || page.url.pathname === '/privacy');

	/** The top-left nav's own text color — white whenever EITHER the back plate is showing (isBackMode,
	 *  the existing front/back contrast reason) OR the site is in dark mode (mode.current, a completely
	 *  separate axis from isBackMode — this engine otherwise doesn't react to mode-watcher at all, so
	 *  without this the nav stayed black-on-dark and unreadable once dark mode + fog shipped on '/').
	 *  Forced black on /imprint and /privacy regardless of either — see isLegalRoute's own comment. */
	const navLinkClass = $derived(
		isLegalRoute
			? 'text-black/70 hover:text-black'
			: isBackMode || mode.current === 'dark'
				? 'text-white/70 hover:text-white'
				: 'text-black/70 hover:text-black'
	);

	let webglSupported = $state(true);
	let webglFailed = $state(false);
	let webglReady = $state(false);
	let loaderVisible = $state(true);
	let loaderPercent = $state(0);
	let scene: Scene | null = null;
	let stars: Stars | null = null;
	let fog: Fog | null = null;
	let fluid: FluidSim | null = null;
	let planet: Planet | null = null;
	/** jsulpis/realtime-planet-shader planets (GPL-3.0 — see the shader files' own header comments and
	 *  CREDITS.md) — one instance per look this site uses, swapped in via planetSwitcher per route.
	 *  Home gets Earth; /works/ keeps the mesh-based `planet` above; every other route gets one of
	 *  these instead. */
	let planetSwitcher: PlanetSwitcher | null = null;
	let earthPlanet: RaymarchPlanet | null = null;
	/** /about's own close-up Earth — a SEPARATE instance from `earthPlanet` (Home/skills' shared one),
	 *  not just a retint: bigger radius (uPlanetRadius), spin frozen (uPlanetSpinSpeed: 0), rotated to
	 *  a fixed longitude (uRotationOffset) instead of the live uTime-driven spin every other Earth
	 *  view has — see its own construction below for the exact values. Being a distinct object (not
	 *  `earthPlanet` itself) is also what keeps +layout.svelte's own generic "click Earth -> /about"
	 *  handler from firing here — that handler only ever checks `planetSwitcher.activeSource ===
	 *  earthPlanet`, which is never true while this one is active. */
	let aboutEarthPlanet: RaymarchPlanet | null = null;
	let marsPlanet: RaymarchPlanet | null = null;
	/** Shared across every /skills/[slug] visit — retinted per skill via setTintColor() in the
	 *  route effect below, rather than constructing a fresh RaymarchPlanet (its own render targets,
	 *  blur passes, texture loads) for each of the 20 skills. */
	let skillPlanet: RaymarchPlanet | null = null;
	let front: Front | null = null;
	let compositor: Compositor | null = null;
	let gallery: Gallery | null = null;
	let scroll: Scroll | null = null;
	let images: Images | null = null;
	let video: Video | null = null;
	let texts: Texts | null = null;
	let noiseTexture: THREE.Texture | null = null;
	let planetMapTexture: THREE.Texture | null = null;
	let crackedTexture: THREE.Texture | null = null;
	let crackedNormalTexture: THREE.Texture | null = null;
	let loaderStart = 0;
	let pointerCleanup: (() => void) | null = null;

	/** Real progress tracking (image/video preload), independent of Card/VideoCard's own loaders —
	 *  a redundant fetch is fine (browser HTTP cache), simpler than threading a shared loader through them. */
	function trackLoadProgress(assetUrls: { textures: string[]; videos: string[] }): void {
		const total = assetUrls.textures.length + assetUrls.videos.length;
		if (total === 0) {
			loaderPercent = 100;
			return;
		}
		let loaded = 0;
		const bump = () => {
			loaded += 1;
			loaderPercent = Math.round((loaded / total) * 100);
		};
		for (const url of assetUrls.textures) {
			new THREE.TextureLoader().load(url, bump, undefined, bump);
		}
		for (const url of assetUrls.videos) {
			const el = document.createElement('video');
			el.muted = true;
			el.preload = 'auto';
			const done = () => {
				el.removeEventListener('loadeddata', done);
				el.removeEventListener('error', done);
				bump();
			};
			el.addEventListener('loadeddata', done);
			el.addEventListener('error', done);
			el.src = url;
			el.load();
		}
	}

	$effect(() => {
		if (loaderPercent < 100) return;
		const remaining = Math.max(0, MIN_LOADER_DURATION - (performance.now() - loaderStart));
		const timeout = setTimeout(() => {
			loaderVisible = false;
		}, remaining);
		return () => clearTimeout(timeout);
	});

	// Route-driven mode transition — separate from Toggle's own click-driven state (see Toggle.svelte),
	// but both ultimately drive the same shared uniforms. Home shows the front/white view; any
	// sub-route (a project detail page, the about page) shows the immersive back view with its DOM
	// overlay content on top.
	//
	// Tweening uMode alone is NOT enough to actually show the back view — the output compositor's
	// front/back crossfade is driven by uProgressFront (see output-fragment.glsl's edgeFront), not
	// uMode directly. uMode only affects each layer's own internal treatment (fog/stars/planet grading,
	// this layout's own gallery visibility).
	let routeModeTimeline: gsap.core.Timeline | null = null;
	$effect(() => {
		const pathname = page.url.pathname;
		const isHome = isHomeRoute;
		// webglReady is a real $state — reading it here (unlike the plain scene/gallery/planet/compositor/
		// fog vars below, which create no reactive dependency) makes this effect re-run once EngineRoot's
		// onReady finishes populating them, even if this effect's first run raced ahead of that.
		if (
			!webglReady ||
			!scene ||
			!gallery ||
			!planet ||
			!compositor ||
			!fog ||
			!planetSwitcher ||
			!earthPlanet ||
			!aboutEarthPlanet ||
			!marsPlanet ||
			!skillPlanet
		)
			return;
		isBackMode = !isHome;
		routeModeTimeline?.kill();
		routeModeTimeline = gsap.timeline();
		routeModeTimeline.to(scene.uniforms.uMode, { value: isHome ? 1 : 0, duration: 1, ease: 'power2.inOut' }, 0);
		routeModeTimeline.to(scene.uniforms.uProgressFront, { value: isHome ? 0 : 1, duration: 1, ease: 'power2.inOut' }, 0);
		// Sub-routes add their own 3D content (Work's media carousel, About's portrait) into the same
		// persistent scene — hide the home strip's cards/titles/videos so they don't show stacked
		// underneath a project/about page's own content. Home itself no longer shows these either —
		// its own +page.svelte renders the project carousel as a Spiral overlay instead (this
		// instance now exists only to lend its videoScene to Work's media carousel).
		gallery.setHomeVisible(false);

		const workSlug = pathname.startsWith('/works/') ? pathname.slice('/works/'.length) : null;
		// Every non-home, non-work, non-skills route reachable inside this (bg) group gets the 'about'
		// treatment — 'error' parks the planet off-screen at z:-200 and zeroes glow/fog, which is correct
		// for a route that's never actually shown but wrong for any real page, so nothing under this
		// group should ever hit it.
		const pageId: PlanetPageId = isHome ? 'home' : workSlug ? 'work' : pathname === '/skills' ? 'skills' : 'about';
		const project = workSlug ? WORK_PROJECTS[workSlug] : undefined;

		// Which planet shows: the mesh-based one (still tweened per-project via .animate(), unchanged)
		// on /works/, one of the raymarched jsulpis planets everywhere else — home and /skills (its
		// skill "moons" orbit this one, see skill-moons.ts) both get Earth, /about gets the moon,
		// /skills/[slug] gets the shared skillPlanet retinted to that skill's own color, mars for
		// everything else not otherwise recognized.
		const skillSlug = pathname.startsWith('/skills/') ? pathname.slice('/skills/'.length) : null;
		const skill = skillSlug ? skills.find((s) => s.slug === skillSlug) : undefined;
		if (pageId === 'work') {
			planetSwitcher.setActive(planet);
			planet.animate(pageId, project ? { light: project.lightColor, dark: project.darkColor } : undefined);
		} else if (isHome || pathname === '/skills') {
			planetSwitcher.setActive(earthPlanet);
		} else if (pathname === '/about') {
			planetSwitcher.setActive(aboutEarthPlanet);
		} else if (skill) {
			skillPlanet.setTintColor(hexToRgb(skill.primaryColor));
			skillPlanet.setTerrainBias(getHillBiasForSkill(skill));
			planetSwitcher.setActive(skillPlanet);
		} else {
			planetSwitcher.setActive(marsPlanet);
		}

		compositor.setPage(pageId);
		fog.setColor(project ? project.darkColor : FOG_COLOR_DEFAULT);
		// Was hardcoded to isHome — meaning the fog LAYER's own underlying texture (a totally separate
		// uHasFog from compositor's own, on fog.ts's own material — see its own setEnabled() comment)
		// only ever rendered real content on the home route. Everywhere else, PAGE_LOOK[pageId].fog and
		// compositor.setFogIntensity() below could set the BLEND weight as high as they wanted — there
		// was nothing in the actual fog texture to blend in, so /about (and /work, /skills) showed
		// nothing regardless. Now enabled whenever this page's own PAGE_LOOK entry wants any fog at all.
		fog.setEnabled(PAGE_LOOK[pageId].fog > 0);
	});

	// Fog's per-page maximum lives in compositor.ts's own PAGE_LOOK table, right next to glow — one
	// table for both, instead of two near-identical Records in two different files. What THIS effect
	// owns is just the gate: fog only shows when isBackMode (the bottom-right Toggle.svelte button) or
	// mode.current === 'dark' (mode-watcher's theme, toggled from /home) is true — same OR the nav-link
	// color below uses. That gate is route/UI state, not per-page look data, so it stays here rather
	// than moving into compositor.ts too.
	//
	// Kept as its own effect (not folded into the route effect above) because it has different
	// dependencies (isBackMode, mode.current) that would otherwise force the whole route effect —
	// planet switching, planet.animate(), etc. — to re-run on every mode/back-mode toggle for no reason.
	//
	// `webglReady` is read unconditionally, before any early return, purely so this effect has a real
	// tracked dependency: `compositor` is a plain `let`, not $state, so its assignment (once WebGL
	// finishes loading) is invisible to Svelte's reactivity on its own — an effect that reads it and
	// bails out before touching anything reactive registers zero dependencies and never runs again.
	$effect(() => {
		const ready = webglReady;
		const currentMode = mode.current;
		const back = isBackMode;
		const pathname = page.url.pathname;
		const isHome = isHomeRoute;

		if (!ready || !compositor || !fog) {
			if (import.meta.env.DEV) {
				console.log(`[fog] effect ran — ready=${ready} compositor=${!!compositor} fog=${!!fog}, skipping`);
			}
			return;
		}

		if (!back && currentMode !== 'dark') {
			if (import.meta.env.DEV) console.log(`[fog] effect ran — isBackMode=${back} mode=${currentMode}, forcing 0`);
			compositor.setFogIntensity(0);
			return;
		}
		const workSlug = pathname.startsWith('/works/') ? pathname.slice('/works/'.length) : null;
		const pageId: PlanetPageId = isHome ? 'home' : workSlug ? 'work' : pathname === '/skills' ? 'skills' : 'about';
		if (import.meta.env.DEV) {
			console.log(
				`[fog] effect ran — pathname=${pathname} pageId=${pageId} isBackMode=${back} mode=${currentMode} fog=${PAGE_LOOK[pageId].fog} coverage=${PAGE_LOOK[pageId].fogCoverage}`
			);
		}
		compositor.setFogIntensity(PAGE_LOOK[pageId].fog);
		fog.setCoverage(PAGE_LOOK[pageId].fogCoverage);
	});

	// Click Earth (the raymarched backdrop, not any DOM/mesh content on top of it) -> /about — generic
	// across every route that shows it (Home, /skills — see the route effect's own
	// planetSwitcher.setActive(earthPlanet) calls), driven by planetSwitcher.activeSource's identity
	// rather than a route-name check, so a future route that switches to earthPlanet gets this for
	// free. RaymarchPlanet.raycastHit() is the shader's own ray-sphere test (see its own comment) —
	// this is genuinely just "is the shader showing Earth under the cursor", not a bespoke per-page
	// hit-test.
	//
	// /skills excluded here on purpose: that page's own click handler (skills/+page.svelte) already
	// combines its moon-click test with this exact same raycastHit() call, checked AFTER a moon-miss
	// (a moon in front of Earth from the camera's own viewpoint should win the click, not Earth behind
	// it) — running this same check again here, unconditionally, would race that page's own listener
	// on the same 'click' event and could fire both a moon navigation and an Earth one together.
	//
	// Home excluded below SPIRAL_MOBILE_BREAKPOINT for a related reason: Home's own spiral carousel
	// recenters its centerpiece cube to dead center there too (see spiral-layout.ts), landing right on
	// top of Earth's own on-screen position — clicking that shared spot should hit the cube (its own,
	// separate click listener in spiral-carousel.ts handles that), not fall through to /about as well.
	function handleCanvasClick(): void {
		if (
			scene &&
			planetSwitcher &&
			earthPlanet &&
			planetSwitcher.activeSource === earthPlanet &&
			page.url.pathname !== '/skills' &&
			!(isHomeRoute && scene.uniforms.uRes.value.x < SPIRAL_MOBILE_BREAKPOINT)
		) {
			const aspect = window.innerWidth / window.innerHeight;
			if (earthPlanet.raycastHit(scene.pointer.nx, scene.pointer.ny, aspect)) {
				goto('/about');
				return;
			}
		}
		if (!gallery || gallery.hoveredIndex === null) return;
		const project = gallery.projects[gallery.hoveredIndex];
		if (project) goto(`/works/${project.slug}`);
	}

	onMount(() => {
		const testCanvas = document.createElement('canvas');
		const gl = testCanvas.getContext('webgl2');
		if (!gl) {
			webglSupported = false;
			webglFailed = true;
		}

		// app.css sets `body { cursor: none }` site-wide, meant to pair with the design-system pages'
		// own custom <Cursor> component (src/lib/design/module/cursor.svelte) — this (bg) group never
		// renders that, so without this the pointer is genuinely invisible here, especially over the
		// dark background.
		document.body.style.cursor = 'auto';
		return () => {
			document.body.style.cursor = '';
		};
	});

	function handleEngineReady(readyScene: Scene): void {
		loaderStart = performance.now();
		scene = readyScene;

		const textureLoader = new THREE.TextureLoader();
		noiseTexture = textureLoader.load(m['assets.bg_noise']());
		planetMapTexture = textureLoader.load(m['assets.bg_cracked_planet']());
		crackedTexture = textureLoader.load(m['assets.bg_cracked']());
		crackedNormalTexture = textureLoader.load(m['assets.bg_cracked_normal']());

		stars = new Stars(scene);
		fog = new Fog(scene, noiseTexture);
		fluid = new FluidSim(scene);
		planet = new Planet(scene, {
			map: planetMapTexture,
			cracked: crackedTexture,
			crackedNormal: crackedNormalTexture
		});

		// jsulpis/realtime-planet-shader planets (GPL-3.0) — one shared stars texture, one set of real
		// NASA/USGS textures per planet. Home's Earth needs 5; the others just need their own color map.
		const starsTexture = textureLoader.load(m['assets.planet_stars']());
		// Dead center (the default): the actual bug that made the raymarched planet invisible was the
		// vertex shader failing to compile (see raymarch-planet.ts's RawShaderMaterial comment), not
		// its position — verified centered against a real render once that was fixed, and it composites
		// well there alongside the gallery cards. No off-center offset needed after all.
		const EARTH_SCREEN_POSITION = { x: 0, y: 0 };
		const CENTER_SCREEN_POSITION = { x: 0, y: 0 };
		earthPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'earth',
				textures: {
					color: textureLoader.load(m['assets.planet_earth_color']()),
					clouds: textureLoader.load(m['assets.planet_earth_clouds']()),
					specular: textureLoader.load(m['assets.planet_earth_specular']()),
					bump: textureLoader.load(m['assets.planet_earth_bump']()),
					night: textureLoader.load(m['assets.planet_earth_night']()),
					stars: starsTexture
				}
			},
			EARTH_SCREEN_POSITION
		);
		// /about's own close-up Earth (see the `aboutEarthPlanet` var's own comment for why this is a
		// separate instance from `earthPlanet`, not a retint of it). uPlanetRadius bumped well past the
		// default 2 for the "close up" look; spin frozen (uPlanetSpinSpeed: 0) instead of the live
		// uTime-driven spin every other Earth view has.
		//
		// rotationOffset/latitudeTilt aim at Germany (~51°N, ~10°E) — computed, not visually verified:
		// solving target dir = (cos(lat)sin(lon), sin(lat), cos(lat)cos(lon)) [sphereProjection()'s own
		// convention: longitude=atan(dir.x,dir.z), latitude=asin(dir.y)] against what PLANET_ROTATION =
		// rotateX(latitudeTilt) * rotateY(rotationOffset) actually produces starting from the unrotated
		// near side (0,0,1) gives rotationOffset ≈ -0.109 rad, latitudeTilt ≈ -0.897 rad (both first-
		// order estimates: an initial longitude-only pass showed Africa, close to but not exactly
		// Germany's own longitude, and had no latitude term at all — hence "rotate up" being needed).
		// Nudge either value directly if Germany isn't actually centered once you look.
		aboutEarthPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'earth',
				textures: {
					color: textureLoader.load(m['assets.planet_earth_color']()),
					clouds: textureLoader.load(m['assets.planet_earth_clouds']()),
					specular: textureLoader.load(m['assets.planet_earth_specular']()),
					bump: textureLoader.load(m['assets.planet_earth_bump']()),
					night: textureLoader.load(m['assets.planet_earth_night']()),
					stars: starsTexture
				}
			},
			CENTER_SCREEN_POSITION,
			{ radius: 5, rotationOffset: -0.109, spinSpeed: 0, latitudeTilt: -0.897 }
		);
		marsPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'planet',
				textures: { color: textureLoader.load(m['assets.planet_mars']()), stars: starsTexture },
				look: PLANET_LOOKS.mars
			},
			CENTER_SCREEN_POSITION
		);
		// Procedural (procedural.fragment.glsl), not a texture look — fully generated terrain (see
		// procedural-terrain.glsl), so it takes a colour tint (setTintColor() below, per skill) the way
		// a texture-based look never could: the whole surface actually reads as that skill's own colour,
		// not a colourised photograph of the moon.
		skillPlanet = new RaymarchPlanet(
			scene,
			{
				type: 'procedural',
				textures: { stars: starsTexture },
				look: { atmosphereColor: [1, 1, 1], atmosphereDensity: 0.05 }
			},
			CENTER_SCREEN_POSITION
		);
		planetSwitcher = new PlanetSwitcher(scene.isTouch);
		planetSwitcher.setActive(earthPlanet);

		const projects = Object.values(WORK_PROJECTS).map((p) => ({
			slug: p.slug,
			title: p.title,
			textureUrl: p.textureUrl,
			videoUrl: p.videoUrl
		}));

		trackLoadProgress({
			textures: [
				m['assets.bg_noise'](),
				m['assets.bg_cracked_planet'](),
				m['assets.bg_cracked'](),
				m['assets.bg_cracked_normal'](),
				m['assets.planet_stars'](),
				m['assets.planet_earth_color'](),
				m['assets.planet_earth_clouds'](),
				m['assets.planet_earth_specular'](),
				m['assets.planet_earth_bump'](),
				m['assets.planet_earth_night'](),
				m['assets.planet_mars'](),
				...projects.map((p) => p.textureUrl)
			],
			// Not projects.map((p) => p.videoUrl) — work-content.ts's own WorkProject.videoUrl comment says
			// it plainly: no real per-project clip exists yet, every one of these points at a path that
			// was never populated. Preloading them here just meant one guaranteed-404 network request per
			// project on every page load; the media carousel's video card already falls back to its
			// placeholder texture on its own when a clip is missing, so preloading buys nothing.
			videos: []
		});

		// This instance's own cards are never shown any more (Home's +page.svelte renders a Spiral
		// overlay instead — see setHomeVisible(false) above) — it stays alive only to lend its
		// videoScene to Work's media carousel (GalleryOptions.videoScene).
		gallery = new Gallery(scene, projects, { center: { x: 58, y: 0, z: 0 } });

		scroll = new Scroll(scene, gallery);
		scene.addLayer(scroll);
		planet?.setScrollSource(gallery);

		images = new Images(scene, gallery);
		scene.addLayer(images);
		video = new Video(scene, gallery);
		scene.addLayer(video);
		texts = new Texts(scene, false);
		scene.addLayer(texts);

		front = new Front(scene, images, video, texts);

		scene.addLayer(stars);
		// Re-enabled per request — dark mode on '/' now shows it, dialed down 70% (see the dedicated
		// fog-intensity $effect above). Without this the layer's own render() never runs, so its render
		// target just sits blank regardless of what compositor.setFogIntensity() is told.
		scene.addLayer(fog);
		scene.addLayer(fluid);
		// planetSwitcher, not `planet` directly — it delegates to whichever planet (mesh or raymarched)
		// the route effect has set active, so only the currently-visible one actually renders each frame.
		scene.addLayer(planetSwitcher);
		scene.addLayer(front);

		fog.setFluidSim(fluid);
		fluid.setAspect(window.innerWidth / window.innerHeight);

		const domCanvas = scene.renderer.domElement;

		const onFluidMove = (event: PointerEvent) => {
			if (!scene || !fluid) return;
			fluid.updateRadiusFromSpeed(scene.pointer.speed);
			if (Math.abs(scene.pointer.dx) > 0.2 || Math.abs(scene.pointer.dy) > 0.2) {
				fluid.pushSplat(
					scene.pointer.x / window.innerWidth,
					1 - scene.pointer.y / window.innerHeight,
					scene.pointer.dx * 5,
					scene.pointer.dy * -5
				);
			}
		};
		const onTargetMove = (event: PointerEvent) => {
			const nx = (event.clientX / window.innerWidth) * 2 - 1;
			const ny = -(event.clientY / window.innerHeight) * 2 + 1;
			planet?.setPointerNDC(nx, ny);
			gallery?.setMouseTarget(nx, ny);
		};
		domCanvas.addEventListener('pointermove', onFluidMove);
		domCanvas.addEventListener('pointermove', onTargetMove);
		domCanvas.addEventListener('click', handleCanvasClick);
		const onResize = () => fluid?.setAspect(window.innerWidth / window.innerHeight);
		window.addEventListener('resize', onResize);

		pointerCleanup = () => {
			domCanvas.removeEventListener('pointermove', onFluidMove);
			domCanvas.removeEventListener('pointermove', onTargetMove);
			domCanvas.removeEventListener('click', handleCanvasClick);
			window.removeEventListener('resize', onResize);
		};

		compositor = new Compositor(scene, { stars, fog, fluid, planet: planetSwitcher, front, images, video, texts });
		scene.setOutput(() => compositor?.render());

		webglReady = true;
	}

	onDestroy(() => {
		pointerCleanup?.();
		routeModeTimeline?.kill();
		compositor?.dispose();
		gallery?.dispose();
		// planetSwitcher is registered with scene.addLayer(), so scene.dispose() below disposes IT — but
		// it only owns its own placeholder texture (see its own comment), not whichever planet is/was
		// active, since the mesh `planet` persists across route changes rather than being scoped to one.
		// All four real planet instances need disposing explicitly here.
		planet?.dispose();
		earthPlanet?.dispose();
		aboutEarthPlanet?.dispose();
		marsPlanet?.dispose();
		skillPlanet?.dispose();
		scene?.dispose();
		noiseTexture?.dispose();
		planetMapTexture?.dispose();
		crackedTexture?.dispose();
		crackedNormalTexture?.dispose();
		webglReady = false;
		scene = null;
		stars = null;
		fog = null;
		fluid = null;
		planet = null;
		planetSwitcher = null;
		earthPlanet = null;
		aboutEarthPlanet = null;
		marsPlanet = null;
		skillPlanet = null;
		front = null;
		compositor = null;
		gallery = null;
		scroll = null;
		images = null;
		video = null;
		texts = null;
		noiseTexture = null;
		planetMapTexture = null;
		crackedTexture = null;
		crackedNormalTexture = null;
	});
</script>

<svelte:head>
	<title>{m['footer.copyright']()}</title>
</svelte:head>

{#if webglFailed}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-10 text-center text-white">
		<h1 class="text-2xl font-black uppercase">{m['webgl.title']()}</h1>
		<p class="mt-6 max-w-sm leading-tight">{m['webgl.description']()}</p>
		<a href={m['links.webgl_info']()} target="_blank" rel="noopener noreferrer" class="mt-8 underline">
			{m['webgl.link']()}
		</a>
	</div>
{:else if webglSupported}
	<!-- invisible, not {#if}-removed, on /imprint and /privacy — unmounting <Canvas> here would tear
	     down and rebuild this engine's entire WebGL context (every texture, layer, planet) on every
	     visit to/from these two pages, which is slow on its own and risks retriggering the exact
	     shader-compile-burst fragility this codebase has spent a lot of effort making recoverable from
	     (see HomeEngineRoot.svelte's own context-loss handling for the /home engine's version of the
	     same problem). Hiding it costs nothing extra at runtime and keeps the context alive underneath. -->
	<div class="fixed inset-0 h-full w-full {isLegalRoute ? 'invisible' : ''}">
		<Canvas>
			<EngineRoot onReady={handleEngineReady} />
		</Canvas>
	</div>
	{#if webglReady && scene && fluid && texts && (isHomeRoute || isAboutRoute)}
		<Toggle {scene} {fluid} {texts} bind:isBackMode />
	{/if}
	{#if webglReady && isHomeRoute}
		<div
			class="fixed top-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none animate-[fadeIn_0.6s_ease-out,autoHide_4s_2s_ease-out_forwards] text-center font-mono text-[9px] tracking-[0.3em] uppercase {navLinkClass}"
		>
			{m['common.explore_hint']()}
		</div>
		<CallScreen />
	{/if}
	{#if !isAboutRoute}
		<nav class="fixed top-6 left-6 z-20 flex gap-4 text-sm">
			<a href="/about" class="underline {navLinkClass}">
				{m['common.info_link']()}
			</a>
			<a href="/imprint" class="underline {navLinkClass}">
				{m['app_nav.imprint']()}
			</a>
			<a href="/privacy" class="underline {navLinkClass}">
				{m['app_nav.privacy']()}
			</a>
		</nav>
	{/if}
	{#if webglReady}
		<div class="fixed top-6 right-6 z-20 flex items-center gap-1.5 text-xs">
			{#each languages as lang, i}
				{#if i > 0}<span class="{navLinkClass} opacity-40">|</span>{/if}
				<button
					onclick={() => setLocale(lang.id as 'en' | 'de')}
					class="uppercase {navLinkClass} {getLocale() === lang.id ? 'font-bold' : 'opacity-60'}"
				>
					{lang.id}
				</button>
			{/each}
		</div>
	{/if}
	{@render children()}
	{#if loaderVisible && !page.url.pathname.startsWith('/skills')}
		<div
			class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#00031f]"
			out:fade={{ duration: 500 }}
		>
			<div class="h-10 w-10 animate-pulse rounded-full bg-white"></div>
			<span class="font-mono text-sm tracking-widest text-white/80">{loaderPercent}%</span>
		</div>
	{/if}
{/if}

<style>
	/* Matches routes/home/+page.svelte's own identical keyframes — same fade-in-then-auto-hide
	   treatment for the explore hint above. */
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes autoHide {
		0% { opacity: 1; }
		100% { opacity: 0; pointer-events: none; }
	}
</style>
