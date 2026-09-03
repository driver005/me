// Real project data, derived from $lib/data's own `works` array (the single source of truth for
// title/client/year/category/img/href) plus the extra fields this engine's Gallery/MediaCarousel need
// that $lib/data doesn't carry yet.
import { works } from '$lib/data';

export interface WorkProject {
	slug: string;
	title: string;
	year: number;
	role: string;
	url: string;
	description: string;
	textureUrl: string;
	/** TODO: no real per-project clip exists yet — points at a file that doesn't exist, so the media
	 *  carousel's video card falls back to its placeholder texture until one is added at this path. */
	videoUrl: string;
	/** Tints the planet's uLightColor/uDarkColor while this project's page is showing
	 *  (Planet.animate() in planet.ts). TODO: placeholder palette — swap for real per-project brand
	 *  colors when you have them. */
	lightColor: string;
	darkColor: string;
}

/** Fields $lib/data's `works` doesn't carry — full description text, and placeholder
 *  video/color slots (see WorkProject's own TODOs) until real ones exist. */
const WORK_META: Record<string, { description: string; lightColor: string; darkColor: string }> = {
	teclab: {
		description: 'Front-end build for SFZ Tübingen — a React web app delivered for the organization.',
		lightColor: '#7ba7c9',
		darkColor: '#3d6a8c'
	},
	hhmodle: {
		description: 'A Wordle-style daily puzzle game, built in Python as a personal science/data project.',
		lightColor: '#8fbf8f',
		darkColor: '#3f7a3f'
	},
	congelado: {
		description: 'A systems-level personal project written in C++.',
		lightColor: '#9c9cc9',
		darkColor: '#54548c'
	},
	blog: {
		description: 'A personal publishing platform, self-built and self-hosted in Python.',
		lightColor: '#c9a97b',
		darkColor: '#8c6a3d'
	},
	me: {
		description: 'This site — a personal portfolio built in Svelte, continuously reworked.',
		lightColor: '#c97b9c',
		darkColor: '#8c3d5f'
	},
	fuzzyboard: {
		description: 'A personal Flutter app project.',
		lightColor: '#c9c37b',
		darkColor: '#8c853d'
	}
};

export const WORK_PROJECTS: Record<string, WorkProject> = Object.fromEntries(
	works.map((project) => {
		const slug = project.title;
		const meta = WORK_META[slug] ?? {
			description: `${project.category} project for ${project.client}.`,
			lightColor: '#9ca3af',
			darkColor: '#4b5563'
		};
		return [
			slug,
			{
				slug,
				title: project.title,
				year: Number(project.year),
				role: project.category,
				url: project.href,
				description: meta.description,
				textureUrl: project.img,
				videoUrl: `/videos/work/${slug}.mp4`,
				lightColor: meta.lightColor,
				darkColor: meta.darkColor
			}
		];
	})
);
