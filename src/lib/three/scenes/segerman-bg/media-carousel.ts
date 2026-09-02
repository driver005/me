import * as THREE from 'three';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';

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
 * A general-purpose, axis- and media-type-configurable carousel, built on the already-proven
 * `Card`/`VideoCard` classes (the same ones the home gallery uses) rather than a bespoke mesh —
 * reused directly for reliability instead of introducing new, less-tested rendering code per use
 * site. Used by the Work detail page's in-page media row today; general enough for any future
 * horizontal-or-vertical, image-or-video strip.
 */
export class MediaCarousel {
	private items: (Card | VideoCard)[] = [];
	private targetScene: THREE.Scene;

	constructor(scene: Scene, targetScene: THREE.Scene, options: MediaCarouselOptions) {
		this.targetScene = targetScene;
		const step = (options.axis === 'horizontal' ? options.itemWidth : options.itemHeight) + options.gap;

		options.urls.forEach((url, i) => {
			const offset = (i - (options.urls.length - 1) / 2) * step;

			if (options.mediaType === 'video') {
				const item = new VideoCard(scene, { videoUrl: url, width: options.itemWidth, height: options.itemHeight });
				if (options.axis === 'horizontal') item.mesh.position.x = offset;
				else item.mesh.position.y = offset;
				item.mesh.position.z = 5;
				this.targetScene.add(item.mesh);
				this.items.push(item);
				// VideoCard defaults to uOffsetY: 1 (hidden — video-card/fragment.glsl forces alpha to
				// zero everywhere once `uv.y += uOffsetY` pushes the sample outside [0,1]), normally
				// revealed by Gallery's hover-triggered setOffsetIn(). This carousel isn't hover-driven,
				// so reveal immediately — setOffsetIn() also starts playback, so playVideo() alone (which
				// only starts playback, never touches uOffsetY) was the actual bug: the video was playing
				// the whole time, just fully transparent.
				item.setOffsetIn();
			} else {
				const item = new Card(scene, { textureUrl: url, width: options.itemWidth, height: options.itemHeight });
				// Card defaults to uProgress/uWarp = 0 (hidden — normally revealed by Gallery's own
				// playEntrance() tween). This carousel has no entrance animation, so set them to their
				// settled values directly, matching what Gallery does for its own cards post-construction.
				item.material.uniforms.uProgress.value = 1;
				item.material.uniforms.uWarp.value = 1;
				if (options.axis === 'horizontal') item.mesh.position.x = offset;
				else item.mesh.position.y = offset;
				item.mesh.position.z = 5;
				this.targetScene.add(item.mesh);
				this.items.push(item);
			}
		});
	}

	dispose(): void {
		for (const item of this.items) {
			this.targetScene.remove(item.mesh);
			item.dispose();
		}
		this.items = [];
	}
}
