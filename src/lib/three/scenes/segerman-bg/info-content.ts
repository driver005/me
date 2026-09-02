// Real bio copy (from paraglide messages, the same about_bio_1/about_bio_2 the /about page uses) and
// real tool list (from $lib/data's own skills array) for the /about page's WebGL-background overlay.
import { m } from '$lib/paraglide/messages';
import { skills } from '$lib/data';

export interface InfoContent {
	paragraphs: string[];
	tools: string[];
	awards: string[];
}

export const INFO_CONTENT: InfoContent = {
	paragraphs: [m['about.bio_1'](), m['about.bio_2']()],
	tools: skills.map((skill) => skill.name),
	// No awards data yet — the {#each} in info/+page.svelte simply renders nothing for an empty list.
	awards: []
};
