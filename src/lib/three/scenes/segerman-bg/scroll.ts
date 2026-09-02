// src/lib/three/scenes/segerman-bg/scroll.ts
import Lenis from 'lenis';
import { Layer } from './layer';
import type { Scene } from './scene';
import type { Gallery } from './gallery';

export class Scroll extends Layer {
	private gallery: Gallery;
	private lenis: Lenis;
	private target = 0;
	private current = 0;
	private readonly ease = 0.1;
	private unsubscribeVirtualScroll: () => void;

	constructor(scene: Scene, gallery: Gallery) {
		super(scene.isTouch);
		this.gallery = gallery;

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
			this.target += Math.max(-100, Math.min(100, data.deltaY));
		});
		window.addEventListener('keydown', this.onKeyDown);
	}

	private onKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'k') {
			this.target -= 100;
			event.preventDefault();
		} else if (event.key === 'j') {
			this.target += 100;
			event.preventDefault();
		}
	};

	render(): void {}

	loop(): void {
		this.current += (this.target - this.current) * this.ease;
		this.gallery.scrollPosition = this.current;
	}

	dispose(): void {
		this.unsubscribeVirtualScroll();
		this.lenis.destroy();
		window.removeEventListener('keydown', this.onKeyDown);
	}
}
