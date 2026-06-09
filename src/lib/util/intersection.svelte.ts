import { browser } from '$app/environment';

export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
	let element = $state<HTMLElement | null>(null);
	let isIntersecting = $state(false);
	let entry = $state<IntersectionObserverEntry | null>(null);

	$effect(() => {
		if (!browser || !element) return;
		const observer = new IntersectionObserver(([e]) => {
			isIntersecting = e.isIntersecting;
			entry = e;
		}, options);
		observer.observe(element);
		return () => observer.disconnect();
	});

	return {
		get element() { return element; },
		set element(v: HTMLElement | null) { element = v; },
		get isIntersecting() { return isIntersecting; },
		get entry() { return entry; }
	};
}
