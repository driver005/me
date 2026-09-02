import * as THREE from 'three';
import { Layer } from './layer';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';
import type { Scrollable } from './scroll';

export type CarouselAxis = 'horizontal' | 'vertical';
export type CarouselMediaType = 'image' | 'video';

export interface MediaCarouselOptions {
	/** Row direction: side-by-side ('horizontal') or stacked ('vertical'). */
	axis: CarouselAxis;
	/** All items are the same type — this carousel doesn't mix images and videos in one row. */
	mediaType: CarouselMediaType;
	/** Image URLs (mediaType: 'image') or video URLs (mediaType: 'video'). */
	urls: string[];
	itemWidth: number;
	itemHeight: number;
	gap: number;
}

/**
 * A general-purpose, axis- and media-type-configurable, scrollable carousel, built on the
 * already-proven `Card`/`VideoCard` classes (the same ones the home gallery uses) rather than a
 * bespoke mesh. Implements `Scrollable` (see `scroll.ts`) so a `Scroll` instance can drive it the
 * same way one drives `Gallery`, and is itself a `Layer` — register it via `scene.addLayer()` so its
 * per-frame repositioning runs alongside everything else, no separate driver needed.
 */
export class MediaCarousel extends Layer implements Scrollable {
	scrollPosition = 0;

	private items: (Card | VideoCard)[] = [];
	private targetScene: THREE.Scene;
	private axis: CarouselAxis;
	private step: number;
	private totalSpan: number;

	constructor(scene: Scene, targetScene: THREE.Scene, options: MediaCarouselOptions) {
		super(scene.isTouch);
		this.targetScene = targetScene;
		this.axis = options.axis;
		this.step = (options.axis === 'horizontal' ? options.itemWidth : options.itemHeight) + options.gap;
		this.totalSpan = this.step * options.urls.length;

		options.urls.forEach((url) => {
			const item =
				options.mediaType === 'video'
					? new VideoCard(scene, { videoUrl: url, width: options.itemWidth, height: options.itemHeight })
					: new Card(scene, { textureUrl: url, width: options.itemWidth, height: options.itemHeight });

			if (item instanceof VideoCard) {
				// VideoCard defaults to uOffsetY: 1 (hidden — video-card/fragment.glsl forces alpha to
				// zero everywhere once `uv.y += uOffsetY` pushes the sample outside [0,1]), normally
				// revealed by Gallery's hover-triggered setOffsetIn(). This carousel isn't hover-driven,
				// so reveal immediately — setOffsetIn() also starts playback.
				item.setOffsetIn();
			} else {
				// Card defaults to uProgress/uWarp = 0 (hidden — normally revealed by Gallery's own
				// playEntrance() tween). This carousel has no entrance animation, so set them to their
				// settled values directly, matching what Gallery does for its own cards post-construction.
				item.material.uniforms.uProgress.value = 1;
				item.material.uniforms.uWarp.value = 1;
			}

			item.mesh.position.z = 5;
			this.targetScene.add(item.mesh);
			this.items.push(item);
		});
	}

	render(): void {}

	loop(): void {
		// Infinite wrap, matching Gallery.updateItems()'s own modulo-wrap positioning — scrolling past
		// the last item brings the first one back around, rather than stopping at the ends.
		const wrapped = ((this.scrollPosition % this.totalSpan) + this.totalSpan) % this.totalSpan;
		for (let i = 0; i < this.items.length; i++) {
			let position = this.step * i - wrapped;
			position = ((position + this.totalSpan / 2) % this.totalSpan + this.totalSpan) % this.totalSpan - this.totalSpan / 2;
			if (this.axis === 'horizontal') this.items[i].mesh.position.x = position;
			else this.items[i].mesh.position.y = position;
		}
	}

	dispose(): void {
		for (const item of this.items) {
			this.targetScene.remove(item.mesh);
			item.dispose();
		}
		this.items = [];
	}
}
