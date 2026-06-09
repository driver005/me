import { browser } from '$app/environment';

export function useScrollStretchY(options: { amount?: number } = {}) {
	let { amount = 0.08 } = options;
	let scaleY = $state(1);

	$effect(() => {
		if (!browser) return;
		const onScroll = () => {
			const scrollY = window.scrollY;
			const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
			const progress = Math.min(scrollY / maxScroll, 1);
			scaleY = 1 + progress * amount;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	return {
		get value() {
			return scaleY;
		}
	};
}
