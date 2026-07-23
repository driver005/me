import { browser } from '$app/environment';

type ScrollCallback = (scrollY: number, vh: number) => void;

interface ScrollSubscription {
	id: string;
	callback: ScrollCallback;
}

interface BoundedItem {
	el: HTMLElement;
	callback: (scrollY: number, vh: number, rect: DOMRect) => void;
}

let subscriptions: ScrollSubscription[] = [];
let boundedItems: BoundedItem[] = [];
let rafId: number | null = null;
let lastScrollY = -1;
let isRunning = false;

function tick() {
	const scrollY = window.scrollY;
	const vh = window.innerHeight;
	if (scrollY !== lastScrollY) {
		lastScrollY = scrollY;
		for (let i = 0; i < subscriptions.length; i++) {
			subscriptions[i].callback(scrollY, vh);
		}
		for (let i = 0; i < boundedItems.length; i++) {
			const rect = boundedItems[i].el.getBoundingClientRect();
			boundedItems[i].callback(scrollY, vh, rect);
		}
	}
	rafId = requestAnimationFrame(tick);
}

function start() {
	if (isRunning || !browser) return;
	isRunning = true;
	rafId = requestAnimationFrame(tick);
}

function stop() {
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
	isRunning = false;
	lastScrollY = -1;
}

let counter = 0;

/**
 * Subscribe to scroll events via a single shared rAF loop.
 * Returns an unsubscribe function.
 *
 * Use for consumers that only need scrollY + vh (no element rect).
 */
export function onScroll(callback: ScrollCallback): () => void {
	const id = `s${counter++}`;
	subscriptions.push({ id, callback });
	start();

	return () => {
		subscriptions = subscriptions.filter(s => s.id !== id);
		if (subscriptions.length === 0 && boundedItems.length === 0) stop();
	};
}

/**
 * Subscribe to scroll events with automatic getBoundingClientRect() per tick.
 * All bounded items share a single rAF callback — avoids N separate listeners.
 * Returns an unsubscribe function.
 *
 * Use for consumers that need the element's bounding rect each frame.
 */
export function onScrollBounded(
	el: HTMLElement,
	callback: (scrollY: number, vh: number, rect: DOMRect) => void
): () => void {
	boundedItems.push({ el, callback });
	start();

	return () => {
		boundedItems = boundedItems.filter(b => b.callback !== callback);
		if (boundedItems.length === 0 && subscriptions.length === 0) stop();
	};
}
