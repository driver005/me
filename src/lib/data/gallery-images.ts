function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const COLS = 8;
const GALLERY_ROWS = 25;

export interface GalleryImage {
	src: string;
	row: number;
	col: number;
	randomY: number;
}

export function buildGalleryImages(): GalleryImage[] {
	const rand = mulberry32(42);
	const rng = (lo: number, hi: number) => lo + rand() * (hi - lo);
	const images: GalleryImage[] = [];
	let seedId = 1;

	for (let row = 1; row <= GALLERY_ROWS; row++) {
		const count = rand() < 0.28 ? 2 : 1;
		const used = new Set<number>();

		for (let k = 0; k < count; k++) {
			let col: number,
				tries = 0;
			do {
				col = Math.floor(rng(0, COLS)) + 1;
				tries++;
			} while (used.has(col) && tries < 20);
			used.add(col);

			const size = Math.round(rng(300, 600));
			images.push({
				src: `https://picsum.photos/seed/pg${seedId++}/${size}/${size}`,
				row,
				col,
				randomY: Math.round(rng(-100, 100))
			});
		}
	}

	return images;
}
