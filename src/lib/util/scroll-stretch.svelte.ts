import { browser } from '$app/environment';
import { onScroll } from '$lib/util/scroll-manager.svelte';

export function useScrollStretchY(options: { amount?: number } = {}) {
	let { amount = 0.08 } = options;
	let scaleY = $state(1);

	$effect(() => {
		if (!browser) return;
		const unsub = onScroll((scrollY) => {
			const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
			const progress = Math.min(scrollY / maxScroll, 1);
			scaleY = 1 + progress * amount;
		});

		return unsub;
	});

	return {
		get value() {
			return scaleY;
		}
	};
}
