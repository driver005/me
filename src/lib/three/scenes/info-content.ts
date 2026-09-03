// Real bio copy (from paraglide messages, the same about_bio_1/about_bio_2 the /about page uses) and
// real tool list (from $lib/data's own skills array) for the /about page's WebGL-background overlay.
import { m } from '$lib/paraglide/messages';
import { skills, social_links } from '$lib/data';

export interface InfoLink {
	label: string;
	href: string;
}

export interface InfoContent {
	paragraphs: string[];
	tools: string[];
	awards: string[];
	links: InfoLink[];
}

export const INFO_CONTENT: InfoContent = {
	paragraphs: [m['about.bio_1'](), m['about.bio_2']()],
	tools: skills.map((skill) => skill.name),
	// No awards data yet — the {#each} in info/+page.svelte simply renders nothing for an empty list.
	awards: [],
	links: [
		{ label: 'GitHub', href: social_links.github },
		{ label: 'X', href: social_links.twitter },
		{ label: 'Instagram', href: social_links.instagram },
		{ label: 'LinkedIn', href: social_links.linkedin },
		{ label: 'Blog', href: social_links.blog },
		// segerman.dev — the site this whole (bg) WebGL background/its raymarched planets/its UI
		// mannerisms were built as a from-scratch reimplementation of (see the (bg) group's own README/
		// git history) — credited directly rather than just in CREDITS.md, since a visitor reading this
		// bio has no other way to find the original.
		{ label: 'segerman.dev', href: 'https://segerman.dev' },
		// jsulpis/realtime-planet-shader — the GPL-3.0 raymarched planet shaders this project's own
		// Home/About/skills backgrounds are ported from (see CREDITS.md at the repo root).
		{ label: 'Planet shader (jsulpis)', href: 'https://github.com/jsulpis/realtime-planet-shader' }
	]
};
