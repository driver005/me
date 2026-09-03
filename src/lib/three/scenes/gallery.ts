import * as THREE from 'three';
import gsap from 'gsap';
import type { Scene } from './scene';
import { Card } from './card';
import { VideoCard } from './video-card';
import { Title } from './title';
import type { Scrollable } from './scroll';
import {
	CARD_WIDTH,
	CARD_HEIGHT,
	GAP_FRONT,
	GAP_BACK,
	CarouselLayout,
	computeScrollSpeed,
	type CarouselAxis
} from './carousel-shared';

/** One strip item. `title`/`textureUrl` are only read when the instance's `titles`/`mediaType`
 *  options ask for them — a video-only sub-page carousel item can omit both. */
export interface GalleryItem {
	slug?: string;
	title?: string;
	textureUrl?: string;
	videoUrl?: string;
	/** Explicit row assignment for a multi-row layout (GalleryOptions.rows) — which parallel strip this
	 *  item belongs to. Omit to auto-deal round-robin (item i -> row i % rows, densely packed, no
	 *  gaps) — the default, and what single-row use implicitly does too (everything in row 0). */
	row?: number;
	/** Explicit within-row wrap-cycle slot, out of that row's own `rowSlotCount` possible slots — its
	 *  fixed position along that row's infinite scroll. Only meaningful alongside `row`; a row's slots
	 *  with no item assigned to them stay empty (no card there) rather than every position being
	 *  filled, matching a sparse source layout instead of a densely-packed one. */
	slot?: number;
	/** Small fixed nudge along the scroll axis (world units, both directions), added on top of the
	 *  slot's own regular position — every slot sits at an exactly even `itemSize + gap` spacing
	 *  otherwise, which reads as an obviously regular grid/lattice once there are only a few parallel
	 *  rows (see /gallery's own use — its `randomY` per image). Purely cosmetic scatter; doesn't
	 *  affect slot/wrap-cycle bookkeeping at all. */
	alongOffset?: number;
	/** Same idea as `alongOffset`, perpendicular instead — a small fixed nudge on the CROSS axis (the
	 *  axis `rows` spreads parallel strips across), so a `rows`-based layout's own dead-straight lanes
	 *  (every item in row N sits at exactly the same cross-axis coordinate otherwise) don't read as
	 *  rigid columns either. */
	crossOffset?: number;
}

export interface GalleryOptions {
	/** Side-by-side ('horizontal') or stacked ('vertical'). Default 'vertical' — the home strip's
	 *  own layout, matching the source's actual scroll axis (see card/vertex.glsl's header comment). */
	axis?: CarouselAxis;
	/** Which card types this instance builds per item. Default 'both' (home strip: an image card
	 *  plus a hover-revealed video card layered on top). A sub-page row is usually 'image' or
	 *  'video' only. */
	mediaType?: 'both' | 'image' | 'video';
	/** Build a Title mesh beside each card. Default true (home strip only — a sub-page row has its
	 *  own HTML caption, not a 3D title). */
	titles?: boolean;
	/** Hit-test cards under the cursor and expose `.hoveredIndex` (drives home's click-to-navigate
	 *  and per-card hover reveal). Default true. A sub-page row that isn't clickable sets this false
	 *  — its video cards are then revealed immediately at construction instead of on hover. */
	hoverNav?: boolean;
	/** Apply the home strip's back/front group tilt + mouse-parallax (BACK_STATE, updateGroup()).
	 *  Default true. A sub-page row isn't part of the front/back toggle, so it sets this false and
	 *  stays at identity rotation/position. */
	groupTilt?: boolean;
	/** World-space point this strip is centred on. Default the origin. */
	center?: { x: number; y: number; z: number };
	/** Gap at uMode=1 (front) / uMode=0 (back). Default the shared GAP_FRONT/GAP_BACK. Pass equal
	 *  values to fix the gap regardless of uMode (a sub-page row that isn't part of the toggle). */
	gapFront?: number;
	gapBack?: number;
	depthCurve?: number;
	/** Per-card dome curve strength, passed straight through to each Card/VideoCard (see their own
	 *  crtStrength option / card/vertex.glsl's comment). Default -1.85 (the source's own value, and
	 *  every existing strip's implicit behavior); pass 0 for flat, un-rounded cards. */
	cardCurve?: number;
	/** World-space arc strength, passed straight through to each Card/VideoCard (Card's own
	 *  curveX/curveZ option). Omit to track the scene's shared uCurveX/uCurveZ (default, unchanged
	 *  behavior); pass explicit numbers (0 for none) so this strip's cards move in a straight line
	 *  along the scroll axis instead of arcing sideways/in-depth as they scroll away from centre. */
	worldCurveX?: number;
	worldCurveZ?: number;
	itemWidth?: number;
	itemHeight?: number;
	/** Splits the items into this many parallel strips side by side (spaced along the cross axis —
	 *  next to each other for a vertical gallery, stacked for a horizontal one), each independently
	 *  wrapping/scrolling instead of one single strip. Default 1 (today's single-strip behavior).
	 *  Items are dealt round-robin across the rows (item 0 → row 0, item 1 → row 1, ..., item N → row
	 *  N % rows), and each row's scroll is offset by a fixed phase of the others so they don't all show
	 *  the same items lined up at once — the masonry-gallery look the /gallery page's items use this
	 *  for, in place of that page's previous 2D CSS-grid implementation. */
	rows?: number;
	/** Floor on every row's wrap-cycle slot count, when items carry explicit `row`/`slot` (GalleryItem)
	 *  — a row's own count is otherwise just `max(slot) + 1` across its items. Raising this beyond that
	 *  stretches the row's wrap cycle across more empty slots than it has real items for, spacing them
	 *  further apart with more empty gaps between — the sparse look a source dataset with genuinely
	 *  unfilled cells (not every grid position holding an image) needs. */
	rowSlotCount?: number;
	/** Scene to add image/video meshes into. Defaults to a new THREE.Scene owned by this instance
	 *  (the home strip's own `imageScene`/`videoScene`, rendered by the Images/Video layers). A
	 *  sub-page carousel instead passes the home Gallery's existing `videoScene` so its cards render
	 *  through that same persistent layer, rather than standing up a new one. */
	imageScene?: THREE.Scene;
	videoScene?: THREE.Scene;
}

const TITLE_HEIGHT = 4;
const TITLE_OFFSET_X = 8;

const BACK_STATE = {
	rotationX: 0,
	rotationY: -0.15,
	rotationZ: 0,
	positionX: -5.3,
	positionY: 0,
	positionZ: -14
};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * One carousel component for every scrolling strip in this port — the home page's project gallery
 * and any sub-page media row alike — configured via `GalleryOptions` rather than duplicated as two
 * classes. Positioning (wrap, gap-lerp, depth arc) always goes through the shared `CarouselLayout`
 * (carousel-shared.ts); what varies between a "gallery" use and a "carousel" use is only which of
 * titles/hover-nav/group-tilt/media-types this instance turns on.
 */
export class Gallery implements Scrollable {
	imageScene: THREE.Scene;
	videoScene: THREE.Scene;

	cards: Card[] = [];
	videoCards: VideoCard[] = [];
	titles: Title[] = [];
	projects: GalleryItem[];

	private scene: Scene;
	private group = new THREE.Group();
	private groupPivot = new THREE.Group();
	private videoGroup = new THREE.Group();
	/** Written every frame by the `Scroll` layer (real Lenis-driven input, phase 4). */
	scrollPosition = 0;
	private previousScrollPosition = 0;
	/** One CarouselLayout per row (length 1 for the default single-strip case). */
	private layouts: CarouselLayout[];
	/** Parallel to cards/videoCards/titles — which row (index into `layouts`) each one belongs to. */
	private itemRow: number[] = [];
	/** Parallel to itemRow — each item's fixed slot within its own row's wrap cycle. */
	private itemSlotIndex: number[] = [];
	/** Parallel to itemRow — each item's own GalleryItem.alongOffset (0 when omitted). */
	private itemAlongOffset: number[] = [];
	/** Parallel to itemRow — each item's own GalleryItem.crossOffset (0 when omitted). */
	private itemCrossOffset: number[] = [];
	private rowCount: number;
	private rowSpacing: number;
	private axis: CarouselAxis;
	private center: { x: number; y: number; z: number };
	private hasTitles: boolean;
	private hoverNav: boolean;
	private groupTilt: boolean;
	private mouseOffset = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };
	private mouseTarget = { posX: 0, posZ: 0, rotX: 0, rotY: 0 };

	private _hoveredIndex: number | null = null;
	private _v = new THREE.Vector3();
	private _hitV = new THREE.Vector3();
	private _camMV = new THREE.Matrix4();
	private entranceTimelines: gsap.core.Timeline[] = [];

	constructor(scene: Scene, projects: GalleryItem[], options: GalleryOptions = {}) {
		this.scene = scene;
		this.projects = projects;
		this.axis = options.axis ?? 'vertical';
		this.center = options.center ?? { x: 0, y: 0, z: 0 };
		this.hasTitles = options.titles ?? true;
		this.hoverNav = options.hoverNav ?? true;
		this.groupTilt = options.groupTilt ?? true;

		this.imageScene = options.imageScene ?? new THREE.Scene();
		this.videoScene = options.videoScene ?? new THREE.Scene();
		this.groupPivot.add(this.group);
		this.imageScene.add(this.groupPivot);
		this.videoScene.add(this.videoGroup);

		const itemWidth = options.itemWidth ?? CARD_WIDTH;
		const itemHeight = options.itemHeight ?? CARD_HEIGHT;
		this.rowCount = Math.max(1, Math.floor(options.rows ?? 1));
		this.rowSpacing = (this.axis === 'vertical' ? itemWidth : itemHeight) + (options.gapFront ?? GAP_FRONT);

		// Two ways to place items across rows: explicit (an item's own `row`/`slot`, GalleryItem) when
		// any item carries them, else auto-deal round-robin (item i -> row i % rowCount, densely packed
		// into consecutive slots — today's default, unchanged). Explicit placement is what lets a row
		// have empty slots: its wrap-cycle length (rowSlotCounts) comes from the highest slot index
		// (or rowSlotCount, if that asks for more), not from how many items actually landed in it.
		const hasExplicitSlots = projects.some((p) => p.row != null || p.slot != null);
		const rowSlotCounts = new Array(this.rowCount).fill(0) as number[];
		const itemSlots: { row: number; slot: number }[] = [];

		if (hasExplicitSlots) {
			for (const project of projects) {
				const row = Math.max(0, Math.min(this.rowCount - 1, Math.floor(project.row ?? 0)));
				const slot = Math.max(0, Math.floor(project.slot ?? 0));
				itemSlots.push({ row, slot });
				rowSlotCounts[row] = Math.max(rowSlotCounts[row], slot + 1);
			}
			if (options.rowSlotCount != null) {
				for (let r = 0; r < this.rowCount; r++) rowSlotCounts[r] = Math.max(rowSlotCounts[r], options.rowSlotCount);
			}
		} else {
			const nextSlot = new Array(this.rowCount).fill(0) as number[];
			projects.forEach((_, i) => {
				const row = i % this.rowCount;
				itemSlots.push({ row, slot: nextSlot[row] });
				nextSlot[row]++;
			});
			for (let r = 0; r < this.rowCount; r++) rowSlotCounts[r] = nextSlot[r];
		}

		this.layouts = rowSlotCounts.map(
			(itemCount) =>
				new CarouselLayout({
					axis: this.axis,
					itemSize: this.axis === 'vertical' ? itemHeight : itemWidth,
					itemCount: Math.max(1, itemCount),
					gapFront: options.gapFront ?? GAP_FRONT,
					gapBack: options.gapBack ?? GAP_BACK,
					depthCurve: options.depthCurve
				})
		);

		const mediaType = options.mediaType ?? 'both';
		const wantsImage = mediaType === 'both' || mediaType === 'image';
		const wantsVideo = mediaType === 'both' || mediaType === 'video';

		const uAxis = this.axis === 'horizontal' ? 1 : 0;

		projects.forEach((project, i) => {
			this.itemRow.push(itemSlots[i].row);
			this.itemSlotIndex.push(itemSlots[i].slot);
			this.itemAlongOffset.push(project.alongOffset ?? 0);
			this.itemCrossOffset.push(project.crossOffset ?? 0);

			if (wantsImage && project.textureUrl) {
				const card = new Card(scene, {
					textureUrl: project.textureUrl,
					width: itemWidth,
					height: itemHeight,
					crtStrength: options.cardCurve,
					curveX: options.worldCurveX,
					curveZ: options.worldCurveZ
				});
				card.material.uniforms.uAxis.value = uAxis;
				this.group.add(card.mesh);
				this.cards.push(card);
			}

			if (wantsVideo && project.videoUrl) {
				const videoCard = new VideoCard(scene, {
					videoUrl: project.videoUrl,
					width: itemWidth,
					height: itemHeight,
					crtStrength: options.cardCurve,
					curveX: options.worldCurveX,
					curveZ: options.worldCurveZ
				});
				videoCard.material.uniforms.uAxis.value = uAxis;
				this.videoGroup.add(videoCard.mesh);
				if (!this.hoverNav) {
					// No hover to reveal it later — this row shows video immediately. setOffsetIn() also
					// starts playback (VideoCard defaults to uOffsetY: 1, hidden by the fragment shader's
					// alpha mask — see video-card/fragment.glsl).
					videoCard.setOffsetIn();
				}
				this.videoCards.push(videoCard);
			}

			if (this.hasTitles && project.title) {
				const title = new Title(project.title, TITLE_HEIGHT);
				this.group.add(title.mesh);
				this.titles.push(title);
			}
		});

		if (wantsImage) {
			for (const card of this.cards) {
				card.mesh.visible = true;
				card.material.uniforms.uProgress.value = 1;
				card.material.uniforms.uWarp.value = 1;
			}
		}
	}

	get hoveredIndex(): number | null {
		return this._hoveredIndex;
	}

	/** Hides this strip's cards/titles/videos — called by the route layout on any sub-route so a
	 *  project/info page's own content isn't shown stacked on top of the home gallery underneath it. */
	setHomeVisible(visible: boolean): void {
		this.groupPivot.visible = visible;
		this.videoGroup.visible = visible;
	}

	setMouseTarget(nx: number, ny: number): void {
		this.mouseTarget.posX = 0.3 * -nx;
		this.mouseTarget.posZ = 0.1 * -ny;
		this.mouseTarget.rotX = 0.05 * ny;
		this.mouseTarget.rotY = 0.1 * nx;
	}

	private updateItems(): void {
		const uMode = this.scene.uniforms.uMode.value;
		const speed = computeScrollSpeed(this.scrollPosition, this.previousScrollPosition);
		this.previousScrollPosition = this.scrollPosition;
		const axis = this.layouts[0].positionAxis;
		const crossAxis = axis === 'x' ? 'y' : 'x';
		const baseCrossValue = axis === 'x' ? this.center.y : this.center.x;
		const alongOrigin = axis === 'x' ? this.center.x : this.center.y;

		const count = Math.max(this.cards.length, this.videoCards.length, this.titles.length);
		for (let i = 0; i < count; i++) {
			const row = this.itemRow[i] ?? 0;
			const layout = this.layouts[row];
			// This item's fixed position within ITS OWN row's wrap cycle (constructor) — not i itself.
			// A per-row phase offset on top keeps rows from all showing the same items lined up
			// together — the masonry-gallery look `rows` exists for.
			const withinRow = this.itemSlotIndex[i] ?? 0;
			const phase = row * this.rowSpacing * 1.7;
			const { position, depth } = layout.computeItem(withinRow, this.scrollPosition + phase, uMode);
			const along = alongOrigin + position + (this.itemAlongOffset[i] ?? 0);
			const z = this.center.z + depth;
			// Rows spread evenly across the cross axis, centred on `this.center`.
			const crossValue =
				baseCrossValue + (row - (this.rowCount - 1) / 2) * this.rowSpacing + (this.itemCrossOffset[i] ?? 0);

			const card = this.cards[i];
			if (card) {
				card.mesh.position[axis] = along;
				card.mesh.position[crossAxis] = crossValue;
				card.mesh.position.z = z;
				card.material.uniforms.uSpeed.value = speed;
			}

			const videoCard = this.videoCards[i];
			if (videoCard) {
				videoCard.mesh.position[axis] = along;
				videoCard.mesh.position[crossAxis] = crossValue;
				videoCard.mesh.position.z = z + 0.01;
				videoCard.material.uniforms.uSpeed.value = speed;
			}

			const title = this.titles[i];
			if (title) {
				title.mesh.position[axis] = along;
				title.mesh.position[crossAxis] = crossValue + TITLE_OFFSET_X;
				title.mesh.position.z = z;
			}
		}
	}

	private updateGroup(): void {
		if (!this.groupTilt) return;
		const uMode = this.scene.uniforms.uMode.value;
		this.group.rotation.x = lerp(BACK_STATE.rotationX, 0, uMode);
		this.group.rotation.y = lerp(BACK_STATE.rotationY, 0, uMode);
		this.group.rotation.z = lerp(BACK_STATE.rotationZ, 0, uMode);
		this.group.position.x = lerp(BACK_STATE.positionX, 0, uMode);
		this.group.position.y = lerp(BACK_STATE.positionY, 0, uMode);
		this.group.position.z = lerp(BACK_STATE.positionZ, 0, uMode);

		this.mouseOffset.posX = lerp(this.mouseOffset.posX, this.mouseTarget.posX, 0.03);
		this.mouseOffset.posZ = lerp(this.mouseOffset.posZ, this.mouseTarget.posZ, 0.03);
		this.mouseOffset.rotX = lerp(this.mouseOffset.rotX, this.mouseTarget.rotX, 0.03);
		this.mouseOffset.rotY = lerp(this.mouseOffset.rotY, this.mouseTarget.rotY, 0.03);

		const frontness = 1 - uMode;
		this.groupPivot.position.x = this.mouseOffset.posX * frontness;
		this.groupPivot.position.z = this.mouseOffset.posZ * frontness;
		this.groupPivot.rotation.x = this.mouseOffset.rotX * frontness;
		this.groupPivot.rotation.y = this.mouseOffset.rotY * frontness;
	}

	handleHover(mouseNX: number, mouseNY: number): void {
		if (!this.hoverNav) return;
		if (!this.groupPivot.visible) {
			if (this._hoveredIndex !== null) {
				this.cards[this._hoveredIndex]?.setInactive();
				this.videoCards[this._hoveredIndex]?.setOffsetOut();
				this._hoveredIndex = null;
			}
			return;
		}
		this.groupPivot.updateMatrixWorld(true);
		const camera = this.scene.camera;
		const uMode = this.scene.uniforms.uMode.value;
		const curveX = this.scene.uniforms.uCurveX.value;
		const curveZ = this.scene.uniforms.uCurveZ.value;
		const frontness = Math.abs(1 - uMode);
		const crtStrength = -1.85;

		let closestIndex: number | null = null;
		let closestZ = Infinity;

		for (let i = 0; i < this.cards.length; i++) {
			const mesh = this.cards[i].mesh;
			if (!mesh.visible) continue;

			const geometry = mesh.geometry;
			geometry.computeBoundingBox();
			const box = geometry.boundingBox!;

			this._camMV.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
			const planeDist = Math.abs(this._camMV.elements[13]);
			const curved = planeDist * planeDist;
			const curveXOffset = curved * curveX * frontness;
			const curveZCentre = -curved * curveZ * frontness;
			const curveZBase = crtStrength * 2 * frontness + curveZCentre;

			let minX = Infinity;
			let maxX = -Infinity;
			let minY = Infinity;
			let maxY = -Infinity;

			const corners: [number, number][] = [
				[box.min.x, box.min.y],
				[box.max.x, box.min.y],
				[box.min.x, box.max.y],
				[box.max.x, box.max.y]
			];
			for (const [cx, cy] of corners) {
				this._v.set(cx + curveXOffset, cy, curveZBase);
				this._v.applyMatrix4(mesh.matrixWorld);
				this._v.project(camera);
				if (this._v.x < minX) minX = this._v.x;
				if (this._v.x > maxX) maxX = this._v.x;
				if (this._v.y < minY) minY = this._v.y;
				if (this._v.y > maxY) maxY = this._v.y;
			}

			if (mouseNX >= minX && mouseNX <= maxX && mouseNY >= minY && mouseNY <= maxY) {
				this._hitV.set(curveXOffset, 0, curveZCentre).applyMatrix4(mesh.matrixWorld).project(camera);
				if (this._hitV.x < -1.2 || this._hitV.x > 1.2 || this._hitV.y < -1.2 || this._hitV.y > 1.2 || this._hitV.z >= 1) continue;
				if (this._hitV.z < closestZ) {
					closestZ = this._hitV.z;
					closestIndex = i;
				}
			}
		}

		if (closestIndex === this._hoveredIndex) return;
		// Hover no longer reveals the video card over the image (setOffsetIn()/setOffsetOut()) — that
		// was showing a video frame stacked above the project picture on hover, which is what "remove
		// that" was asking to drop. Cards still scale/highlight on hover (setActive/setInactive); the
		// video cards themselves stay constructed but permanently hidden (uOffsetY never tweened off 1).
		if (this._hoveredIndex !== null) {
			this.cards[this._hoveredIndex].setInactive();
		}
		this._hoveredIndex = closestIndex;
		if (this._hoveredIndex !== null) {
			this.cards[this._hoveredIndex].setActive();
		}
	}

	playEntrance(): void {
		for (let i = 0; i < this.cards.length; i++) {
			const card = this.cards[i];
			card.material.uniforms.uProgress.value = 0;
			card.material.uniforms.uWarp.value = 0;
			const targetX = card.mesh.scale.x;
			const targetY = card.mesh.scale.y;
			card.mesh.scale.set(targetX * 0.001, targetY * 0.001, 1);
			const timeline = gsap
				.timeline({ delay: i * 0.1 })
				.to(card.mesh.scale, { x: targetX, y: targetY, duration: 1.2, ease: 'expo.out', overwrite: 'auto' }, 0)
				.to(card.material.uniforms.uProgress, { value: 1, duration: 1.6, ease: 'power2.out' }, 0)
				.to(card.material.uniforms.uWarp, { value: 1, duration: 1.4 }, 0.2);
			this.entranceTimelines.push(timeline);
		}
	}

	/** Called once per frame — by the Images/Video layers for the home strip, or by a sub-page's own
	 *  rAF loop (see the Work page) for a route-scoped carousel. */
	update(mouseNX: number, mouseNY: number): void {
		this.updateItems();
		this.updateGroup();
		this.handleHover(mouseNX, mouseNY);
	}

	dispose(): void {
		for (const timeline of this.entranceTimelines) timeline.kill();
		this.entranceTimelines = [];
		for (const card of this.cards) card.dispose();
		for (const videoCard of this.videoCards) videoCard.dispose();
		for (const title of this.titles) title.dispose();
		// Removes this instance's whole subtree at once — matters for a sub-page carousel sharing the
		// home Gallery's videoScene: without this, a disposed-but-still-parented group would leave
		// stale (GPU-resource-freed) meshes behind in that persistent scene after every navigation.
		this.imageScene.remove(this.groupPivot);
		this.videoScene.remove(this.videoGroup);
	}
}
