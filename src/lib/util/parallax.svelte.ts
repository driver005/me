import { browser } from '$app/environment';
import { onScrollBounded } from '$lib/util/scroll-manager.svelte';

export interface ParallaxOptions {
	speed?: number;
	offset?: [number, number];
}

export function useParallax(options: ParallaxOptions = {}) {
	const { speed = 0.3, offset = [0, 0] } = options;

	let element = $state<HTMLElement | null>(null);
	let y = $state(0);

	$effect(() => {
		if (!browser || !element) return;
		const unsub = onScrollBounded(element!, (scrollY, vh, rect) => {
			const center = rect.top + rect.height / 2;
			const normalized = (center - vh / 2) / (vh / 2);
			y = normalized * speed * -100;
		});

		return unsub;
	});

	return {
		get element() { return element; },
		set element(v: HTMLElement | null) { element = v; },
		get y() { return y; }
	};
}
