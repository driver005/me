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
	// Labels reuse the same dock.contact.* keys the site's own contact dock already shows (dedup, not
	// a new set of near-duplicate strings). Hrefs reuse the shared social_links object (data/index.ts)
	// — that one's left as plain data rather than paraglide (see its own file for why: a plain object
	// evaluated once at module load, imported by many non-Svelte call sites well before this file).
	links: [
		{ label: m['dock.contact.github'](), href: social_links.github },
		{ label: m['dock.contact.x'](), href: social_links.twitter },
		{ label: m['dock.contact.instagram'](), href: social_links.instagram },
		{ label: m['dock.contact.linkedin'](), href: social_links.linkedin },
		{ label: m['dock.contact.blog'](), href: social_links.blog },
		// segerman.dev — the site this whole (bg) WebGL background/its raymarched planets/its UI
		// mannerisms were built as a from-scratch reimplementation of (see the (bg) group's own README/
		// git history) — credited directly rather than just in CREDITS.md, since a visitor reading this
		// bio has no other way to find the original.
		{ label: m['common.segerman_dev_label'](), href: m['links.segerman_dev']() },
		// jsulpis/realtime-planet-shader — the GPL-3.0 raymarched planet shaders this project's own
		// Home/About/skills backgrounds are ported from (see CREDITS.md at the repo root).
		{ label: m['common.planet_shader_label'](), href: m['links.planet_shader_repo']() }
	]
};
