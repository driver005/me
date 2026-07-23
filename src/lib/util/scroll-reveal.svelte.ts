import { browser } from '$app/environment';
import { onScrollBounded } from '$lib/util/scroll-manager.svelte';

export interface ScrollRevealOptions {
	threshold?: number;
	rootMargin?: string;
	amount?: number;
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
	const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', amount = 40 } = options;

	let element = $state<HTMLElement | null>(null);
	let isIntersecting = $state(false);
	let progress = $state(0);

	$effect(() => {
		if (!browser || !element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				isIntersecting = entry.isIntersecting;
			},
			{ threshold, rootMargin }
		);
		observer.observe(element);

		const unsub = onScrollBounded(element!, (scrollY, vh, rect) => {
			const start = vh;
			const end = -amount;
			const p = 1 - (rect.top - end) / (start - end);
			progress = Math.max(0, Math.min(1, p));
		});

		return () => {
			observer.disconnect();
			unsub();
		};
	});

	return {
		get element() { return element; },
		set element(v: HTMLElement | null) { element = v; },
		get isIntersecting() { return isIntersecting; },
		get progress() { return progress; }
	};
}
