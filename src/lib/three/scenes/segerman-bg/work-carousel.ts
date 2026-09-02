import gsap from 'gsap';
import type { Scene } from './scene';
import type { Gallery } from './gallery';
import { WorkMedia } from './work-media';

const MEDIA_WIDTH = 30;
const MEDIA_HEIGHT = 20;
const GAP = 4;

/**
 * A project's in-page media carousel (Work.KlPQz3rX.js's class `L`, fetched via Firecrawl) —
 * separate from the home gallery's own horizontal strip. The original DOM-position-syncs each item
 * to a real `.content .media-wrapper` element and drives it from the page's own scroll; this port has
 * no scraped Work-page markup to sync against, so it's simplified to a static, evenly-spaced,
 * always-visible row (no scroll-driven reflow) — the real find here was the cylindrical-wrap vertex
 * shader (`work-media/vertex.glsl`), which this class exists to actually show off.
 */
export class WorkCarousel {
	private items: WorkMedia[] = [];
	private gallery: Gallery;
	private entranceTimelines: gsap.core.Timeline[] = [];

	constructor(scene: Scene, gallery: Gallery, mediaUrls: string[]) {
		this.gallery = gallery;

		mediaUrls.forEach((url, i) => {
			const media = new WorkMedia(scene, { videoUrl: url, width: MEDIA_WIDTH, height: MEDIA_HEIGHT });
			const x = (i - (mediaUrls.length - 1) / 2) * (MEDIA_WIDTH + GAP);
			media.mesh.position.set(x, 0, 5);
			this.gallery.videoScene.add(media.mesh);
			this.items.push(media);
			media.playVideo();

			// Warp-flash entrance, matching the source's own tl.set(uWarp, .5) -> tl.to(uWarp, 0, 1.4s).
			const timeline = gsap.timeline({ delay: i * 0.08 }).to(media.material.uniforms.uWarp, {
				value: 0,
				duration: 1.4,
				ease: 'power4.out'
			});
			this.entranceTimelines.push(timeline);
		});
	}

	dispose(): void {
		for (const timeline of this.entranceTimelines) timeline.kill();
		for (const media of this.items) {
			this.gallery.videoScene.remove(media.mesh);
			media.dispose();
		}
		this.items = [];
	}
}
