// Real project data, derived from $lib/data's own `works` array (the single source of truth for
// title/client/year/category/img/href) plus the extra fields this engine's Gallery/MediaCarousel need
// that $lib/data doesn't carry yet.
import { works } from '$lib/data';
import { m } from '$lib/paraglide/messages';

export interface WorkProject {
	slug: string;
	title: string;
	year: number;
	role: string;
	url: string;
	description: string;
	textureUrl: string;
	/** TODO: no real per-project clip exists yet. Empty on purpose (not a path to a nonexistent file,
	 *  which real code was actually trying to fetch — the (bg) layout's own preload list AND
	 *  gallery.ts's own `wantsVideo && project.videoUrl` check, which VideoCard then sets as a real
	 *  `<video>` element's `src`) — an empty string is falsy, so that check now skips VideoCard
	 *  entirely instead of constructing one that immediately 404s. Set this to a real `/videos/work/
	 *  <slug>.mp4` path once actual per-project clips exist. */
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
		description: m['work_content.teclab_description'](),
		lightColor: '#7ba7c9',
		darkColor: '#3d6a8c'
	},
	hhmodle: {
		description: m['work_content.hhmodle_description'](),
		lightColor: '#8fbf8f',
		darkColor: '#3f7a3f'
	},
	congelado: {
		description: m['work_content.congelado_description'](),
		lightColor: '#9c9cc9',
		darkColor: '#54548c'
	},
	blog: {
		description: m['work_content.blog_description'](),
		lightColor: '#c9a97b',
		darkColor: '#8c6a3d'
	},
	me: {
		description: m['work_content.me_description'](),
		lightColor: '#c97b9c',
		darkColor: '#8c3d5f'
	},
	fuzzyboard: {
		description: m['work_content.fuzzyboard_description'](),
		lightColor: '#c9c37b',
		darkColor: '#8c853d'
	}
};

export const WORK_PROJECTS: Record<string, WorkProject> = Object.fromEntries(
	works.map((project) => {
		const slug = project.title;
		const meta = WORK_META[slug] ?? {
			description: m['work_content.fallback_description']({ category: project.category, client: project.client }),
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
				videoUrl: '',
				lightColor: meta.lightColor,
				darkColor: meta.darkColor
			}
		];
	})
);
