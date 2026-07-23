<script lang="ts">
	import { browser } from '$app/environment';
	import { travelPlaces } from '$lib/data';
	import gsap from 'gsap';
	import type { Map, Marker as LMarker } from 'leaflet';

	const prefersReduced =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	let sectionEl: HTMLElement | null = $state(null);
	let mapSideEl: HTMLElement | null = $state(null);
	let infoSideEl: HTMLElement | null = $state(null);
	let mapContainerEl: HTMLElement | null = $state(null);
	let closeBtnEl: HTMLButtonElement | null = $state(null);

	let active = $state<(typeof travelPlaces)[number] | null>(null);
	let expanded = $state(false);
	let leafletMap = $state<Map | null>(null);

	$effect(() => {
		if (!browser || !mapContainerEl || prefersReduced) return;

		let map: Map;
		const cleanupMarkers: LMarker[] = [];

		(async () => {
			const L = await import('leaflet');

			map = L.map(mapContainerEl!, {
				center: [48.5, 10],
				zoom: 4,
				zoomControl: false,
				attributionControl: false,
				scrollWheelZoom: false,
				dragging: false,
				keyboard: false,
				doubleClickZoom: false,
				touchZoom: false
			});

			// Dark tiles
			L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 18,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
			}).addTo(map);

			const markerIcon = L.divIcon({
				className: 'custom-marker',
				html: '<div class="w-3 h-3 bg-[#FF3B00] border-2 border-white/90 shadow-[0_0_8px_rgba(255,59,0,0.6)]"></div>',
				iconSize: [12, 12],
				iconAnchor: [6, 6]
			});

			travelPlaces.forEach((place) => {
				const marker = L.marker([place.lat, place.lng], { icon: markerIcon })
					.on('click', () => openPlace(place))
					.addTo(map);
				cleanupMarkers.push(marker);
			});

			leafletMap = map;
			setTimeout(() => map.invalidateSize(), 100);
		})();

		return () => {
			cleanupMarkers.forEach((m) => m.remove());
			if (map) map.remove();
		};
	});

	function openPlace(place: (typeof travelPlaces)[number]) {
		active = place;
		if (leafletMap) {
			leafletMap.flyTo([place.lat, place.lng], 8, { duration: 1.2 });
		}
	}

	function closePanel() {
		active = null;
		if (leafletMap) {
			leafletMap.flyTo([48.5, 10], 4, { duration: 1 });
		}
	}

	function toggleExpand() {
		expanded = !expanded;
		if (!mapSideEl || !infoSideEl) return;

		if (expanded) {
			gsap.timeline()
				.set(document.body, { overflow: 'hidden' })
				.to(mapSideEl, { width: '100%', duration: 0.8, ease: 'power3.inOut' })
				.to(infoSideEl, { width: '0%', opacity: 0, duration: 0.8, ease: 'power3.inOut' }, '<')
				.to(closeBtnEl!, { autoAlpha: 1, duration: 0.3 }, 0.3);
		} else {
			gsap.timeline()
				.to(closeBtnEl!, { autoAlpha: 0, duration: 0.2 })
				.to(mapSideEl, { width: '50%', duration: 0.8, ease: 'expo.inOut' }, '<')
				.to(infoSideEl, { width: '50%', opacity: 1, duration: 0.8, ease: 'expo.inOut' }, '<')
				.set(document.body, { overflow: 'scroll' });
		}

		if (leafletMap) setTimeout(() => leafletMap?.invalidateSize(), 50);
	}

	function onCloseClick() {
		if (expanded) toggleExpand();
	}
</script>

{#if prefersReduced}
	<section
		data-testid="scroll-map-section"
		class="relative bg-[#0A0A0A] text-[#F3F2EE] py-24 px-4"
	>
		<div class="max-w-2xl mx-auto space-y-6">
			{#each travelPlaces as place}
				<div class="border-b border-[#F3F2EE]/15 pb-4">
					<div class="font-display uppercase text-2xl">{place.city}, {place.country}</div>
					<div class="font-mono text-xs text-[#F3F2EE]/50 mt-1">{place.year}</div>
					<p class="font-mono text-sm text-[#F3F2EE]/60 mt-2">{place.note}</p>
				</div>
			{/each}
		</div>
	</section>
{:else}
	<section
		bind:this={sectionEl}
		data-testid="scroll-map-section"
		class="relative bg-[#0A0A0A] text-[#F3F2EE] flex h-screen overflow-hidden w-full"
	>
		<!-- Map side -->
		<div bind:this={mapSideEl} class="relative h-full overflow-hidden" style="width: 50%;">
			<div bind:this={mapContainerEl} class="absolute inset-0 z-0"></div>

			<button
				type="button"
				onclick={toggleExpand}
				class="absolute bottom-6 left-6 z-20 font-mono text-xs uppercase tracking-[0.2em] px-4 py-2 border border-[#F3F2EE]/40 bg-[#0A0A0A]/80 backdrop-blur-sm text-[#F3F2EE] hover:bg-[#FF3B00] hover:border-[#FF3B00] transition-colors duration-300"
			>
				{expanded ? '✕ Close map' : '⤢ Expand'}
			</button>
		</div>

		<!-- Info side -->
		<div
			bind:this={infoSideEl}
			class="h-full overflow-y-auto p-8 sm:p-12 flex flex-col justify-center"
			style="width: 50%;"
		>
			<span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[#F3F2EE]/40 mb-8">
				The route so far
			</span>

			<h1 class="font-display uppercase text-4xl sm:text-5xl tracking-tighter leading-[0.85]">
				{#if active}
					{active.city}
				{:else}
					Travel Log
				{/if}
			</h1>

			{#if active}
				<div class="mt-4 space-y-3">
					<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF3B00]">
						{active.year}
					</span>
					<span class="font-mono text-xs text-[#F3F2EE]/50">
						{active.country}
					</span>
					<p class="font-mono text-sm text-[#F3F2EE]/70 leading-relaxed mt-2">
						{active.note}
					</p>
					<button
						type="button"
						onclick={closePanel}
						class="font-mono text-xs uppercase tracking-[0.2em] text-[#F3F2EE]/50 hover:text-[#FF3B00] transition-colors mt-4"
					>
						← Back to overview
					</button>
				</div>
			{:else}
				<div class="mt-8 space-y-4">
					{#each travelPlaces as place}
						<button
							type="button"
							onclick={() => openPlace(place)}
							class="block w-full text-left border-b border-[#F3F2EE]/10 pb-4 group hover:border-[#FF3B00]/50 transition-colors"
						>
							<div class="flex items-baseline justify-between">
								<span
									class="font-display uppercase text-xl sm:text-2xl tracking-tight group-hover:text-[#FF3B00] transition-colors"
								>
									{place.city}
								</span>
								<span class="font-mono text-xs text-[#F3F2EE]/40">{place.year}</span>
							</div>
							<p class="font-mono text-xs text-[#F3F2EE]/40 mt-1">{place.note}</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}

<!-- Close button (fixed, outside section — matches reference) -->
<button
	bind:this={closeBtnEl}
	type="button"
	onclick={onCloseClick}
	class="fixed bottom-6 right-6 font-mono text-xs uppercase tracking-[0.2em] px-4 py-2 border border-[#F3F2EE]/40 bg-[#0A0A0A]/80 backdrop-blur-sm text-[#F3F2EE] hover:bg-[#FF3B00] hover:border-[#FF3B00] transition-colors duration-300 z-50"
	style="opacity: 0; pointer-events: none;"
>
	<div class="w-3 h-0.5 bg-current mb-1"></div>
	Reset
</button>

<style>
	:global(.custom-marker) {
		background: none !important;
		border: none !important;
	}

	:global(.leaflet-container) {
		background: #0a0a0a !important;
		font-family: 'JetBrains Mono', monospace;
	}

	:global(.leaflet-control-attribution) {
		background: rgba(10, 10, 10, 0.8) !important;
		color: rgba(243, 242, 238, 0.3) !important;
		font-size: 8px !important;
		font-family: 'JetBrains Mono', monospace !important;
	}

	:global(.leaflet-control-attribution a) {
		color: rgba(243, 242, 238, 0.5) !important;
	}
</style>
