/**
 * SSR-safe prefers-reduced-motion check.
 * Returns false on the server, matching `typeof window !== 'undefined'` guards.
 */
export function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}
