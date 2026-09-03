import { browser } from '$app/environment';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './reduced-motion';

gsap.registerPlugin(ScrollTrigger);

export interface GsapRevealOptions {
	/** CSS selector for the targets inside the container. Defaults to direct children. */
	selector?: string;
	y?: number;
	scale?: number;
	duration?: number;
	stagger?: number;
	start?: string;
}

/**
 * Shared scroll-triggered stagger reveal (gsap.from on container children).
 * Returns a cleanup function — safe to return from a `$effect`.
 * No-ops on SSR and for prefers-reduced-motion users.
 */
export function gsapStaggerReveal(
	container: HTMLElement,
	opts: GsapRevealOptions = {}
): () => void {
	if (!browser || prefersReducedMotion()) return () => {};

	const ctx = gsap.context(() => {
		const targets = opts.selector
			? gsap.utils.toArray<HTMLElement>(container.querySelectorAll(opts.selector))
			: gsap.utils.toArray<HTMLElement>(container.children);

		gsap.from(targets, {
			opacity: 0,
			y: opts.y ?? 24,
			scale: opts.scale,
			duration: opts.duration ?? 0.6,
			ease: 'power3.out',
			stagger: opts.stagger ?? 0.1,
			scrollTrigger: {
				trigger: container,
				start: opts.start ?? 'top 80%',
				toggleActions: 'play none none reverse'
			}
		});
	}, container);

	return () => ctx.revert();
}
