// src/lib/three/scenes/segerman-bg/scroll.ts
import Lenis from 'lenis';
import { Layer } from './layer';
import type { Scene } from './scene';

/** Anything with a settable `scrollPosition` — `Gallery` satisfies this already; so does
 *  `MediaCarousel`, which is why this isn't typed directly against `Gallery` any more. */
export interface Scrollable {
	scrollPosition: number;
}

export class Scroll extends Layer {
	private target: Scrollable;
	private lenis: Lenis;
	private targetValue = 0;
	private current = 0;
	private readonly ease = 0.1;
	private unsubscribeVirtualScroll: () => void;

	constructor(scene: Scene, target: Scrollable) {
		super(scene.isTouch);
		this.target = target;

		this.lenis = new Lenis({
			smoothWheel: true,
			syncTouch: true,
			syncTouchLerp: 0.2,
			touchInertiaExponent: 1.7,
			wheelMultiplier: 1,
			touchMultiplier: 1,
			autoRaf: false
		});
		this.unsubscribeVirtualScroll = this.lenis.on('virtual-scroll', (data) => {
			this.targetValue += Math.max(-100, Math.min(100, data.deltaY));
		});
		window.addEventListener('keydown', this.onKeyDown);
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'k') {
			this.targetValue -= 100;
			event.preventDefault();
		} else if (event.key === 'j') {
			this.targetValue += 100;
			event.preventDefault();
		}
	};

	render(): void {}

	loop(): void {
		this.current += (this.targetValue - this.current) * this.ease;
		this.target.scrollPosition = this.current;
	}

	dispose(): void {
		this.unsubscribeVirtualScroll();
		this.lenis.destroy();
		window.removeEventListener('keydown', this.onKeyDown);
	}
}
