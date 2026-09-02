const ASSET_BASE = '/sites/segerman-dev-86ede42f/root-7944de32';

export type SegermanWork = {
	slug: string;
	title: string;
	image: string;
	video: string;
};

export const SEGERMAN_WORKS: SegermanWork[] = [
	{
		slug: 'estrela',
		title: 'Estrela Studio',
		image: `${ASSET_BASE}/work/estrela-featured.webp`,
		video: `${ASSET_BASE}/work/estrela-featured.mp4`,
	},
	{
		slug: 'yucca',
		title: 'Yucca Packaging',
		image: `${ASSET_BASE}/work/yucca-featured.webp`,
		video: `${ASSET_BASE}/work/yucca-featured.mp4`,
	},
	{
		slug: 'zulik',
		title: 'Zulik',
		image: `${ASSET_BASE}/work/zulik-featured.webp`,
		video: `${ASSET_BASE}/work/zulik-featured.mp4`,
	},
	{
		slug: 'payjustnow',
		title: 'PayJustNow',
		image: `${ASSET_BASE}/work/payjustnow-featured.webp`,
		video: `${ASSET_BASE}/work/payjustnow-featured.mp4`,
	},
	{
		slug: 'vineyard',
		title: 'Vineyard Hotel',
		image: `${ASSET_BASE}/work/vineyard-featured.webp`,
		video: `${ASSET_BASE}/work/vineyard-featured.mp4`,
	},
];

export const SEGERMAN_FONTS = {
	heading: `${ASSET_BASE}/fonts/NewakeRegular.woff`,
	body: `${ASSET_BASE}/fonts/AktivGroteskMedium.woff`,
};

export const SEGERMAN_INFO = {
	paragraphs: [
		"I'm Rafi, a creative developer based in Cape Town. My focus is building websites that are super performant and layered with immersive motion and interactions.",
		'I come from a design background which helps me work with designers to bring their ideas to life. I love the process of converting static layouts into memorable experiences.',
		"I'm also the co-founder of Zulik, a web development studio partnering with creative teams to produce brand websites, online stores and whatever the brief needs.",
	],
	tools: ['Astro.js', 'WordPress', 'Nuxt.js', 'GSAP', 'Three.js', 'GLSL', 'Sanity', 'Figma'],
	awards: ['2x Awwwards SOTD', '2x Awwwards Dev', '1x FWA FOTD'],
};
