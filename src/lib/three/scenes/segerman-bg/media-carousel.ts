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
	/** World-space point the strip is centred on and curves toward — where "the camera lives"
	 *  relative to the row. Defaults to the origin. */
	center?: { x: number; y: number; z: number };
	/** How far an item at the strip's outer edge sinks in Z relative to `center.z`, as a parabola
	 *  of its distance from centre — 0 disables the arc (a flat row). An item scrolling toward
	 *  centre rises out of that recess toward the camera; one scrolling away sinks back into it —
	 *  the "comes from behind to the front" sweep, driven purely by this carousel's own per-item
	 *  positioning rather than any of Card/VideoCard's own (Y-axis-locked) shader curve. */
	depthCurve?: number;
}

/**
 * A general-purpose, axis- and media-type-configurable, scrollable carousel, built on the
 * already-proven `Card`/`VideoCard` classes (the same ones the home gallery uses) rather than a
 * bespoke mesh. Implements `Scrollable` (see `scroll.ts`) so a `Scroll` instance can drive it the
 * same way one drives `Gallery`, and is itself a `Layer` — call `.loop()` every frame (see the Work
 * page for the manual-rAF-loop pattern; not scene.addLayer()-registered, since Scene has no
 * removeLayer() and this carousel's lifetime is scoped to a single route visit).
 */
export class MediaCarousel extends Layer implements Scrollable {
	scrollPosition = 0;

	private items: (Card | VideoCard)[] = [];
	private targetScene: THREE.Scene;
	private axis: CarouselAxis;
	private step: number;
	private totalSpan: number;
	private center: { x: number; y: number; z: number };
	private depthCurve: number;

	constructor(scene: Scene, targetScene: THREE.Scene, options: MediaCarouselOptions) {
		super(scene.isTouch);
		this.targetScene = targetScene;
		this.axis = options.axis;
		this.center = options.center ?? { x: 0, y: 0, z: 0 };
		this.depthCurve = options.depthCurve ?? 0;
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

			this.targetScene.add(item.mesh);
			this.items.push(item);
		});
	}

	render(): void {}

	loop(): void {
		// Infinite wrap, matching Gallery.updateItems()'s own modulo-wrap positioning — scrolling past
		// the last item brings the first one back around, rather than stopping at the ends.
		const wrapped = ((this.scrollPosition % this.totalSpan) + this.totalSpan) % this.totalSpan;
		const halfSpan = this.totalSpan / 2;

		for (let i = 0; i < this.items.length; i++) {
			let position = this.step * i - wrapped;
			position = ((position + halfSpan) % this.totalSpan + this.totalSpan) % this.totalSpan - halfSpan;

			// Parabolic depth arc around `center`, saturating at -depthCurve within ~2 item-widths of
			// centre (not the full wrap-cycle halfSpan — only 1-2 items are ever visible on screen near
			// centre at once, so normalizing against the whole strip's span left the visible portion of
			// the curve nearly flat; the vertical gallery's own shader-driven curve concentrates its full
			// effect at this same local, per-item scale, which is what this now matches).
			const depthRange = this.step * 2;
			const normalized = depthRange > 0 ? Math.max(-1, Math.min(1, position / depthRange)) : 0;
			const depthOffset = -this.depthCurve * normalized * normalized;

			const mesh = this.items[i].mesh;
			if (this.axis === 'horizontal') {
				mesh.position.x = this.center.x + position;
				mesh.position.y = this.center.y;
			} else {
				mesh.position.y = this.center.y + position;
				mesh.position.x = this.center.x;
			}
			mesh.position.z = this.center.z + depthOffset;
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
