import { browser } from '$app/environment';

export function useBreakpoint(width: string) {
	// 1. Initialize state (default to false for SSR)
	let matches = $state(false);

	// 2. Only run the listener in the browser
	$effect(() => {
		if (!browser) return;

		const media = window.matchMedia(`(min-width: ${width})`);
		
		// Set initial state
		matches = media.matches;

		// Update state on change
		const listener = (e: MediaQueryListEvent) => (matches = e.matches);
		media.addEventListener('change', listener);

		return () => media.removeEventListener('change', listener);
	});

	// 3. Return an object with a getter to maintain reactivity
	return {
		get value() { return matches; }
	};
}
