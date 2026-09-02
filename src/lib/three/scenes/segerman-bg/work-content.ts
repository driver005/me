// Real project copy, sourced from the site's own content.CFZxyfkA.js (fetched via Firecrawl this session).
export interface WorkProject {
	slug: string;
	title: string;
	year: number;
	role: string;
	url: string;
	description: string;
}

export const WORK_PROJECTS: Record<string, WorkProject> = {
	estrela: {
		slug: 'estrela',
		title: 'Estrela Studio',
		year: 2025,
		role: 'Front-end development',
		url: 'https://estrela.studio/',
		description:
			'Close collaboration with Malvah Studio brought this immersive portfolio to life, winning Awwwards Site of the Day and Developer Award.'
	},
	yucca: {
		slug: 'yucca',
		title: 'Yucca Packaging',
		year: 2025,
		role: 'Front-end development',
		url: 'https://yucca.co.za/',
		description:
			'A highly customised and integrated store experience designed by Estrela Studio, won the Awwwards Site of the Day and Developer Award.'
	},
	zulik: {
		slug: 'zulik',
		title: 'Zulik',
		year: 2025,
		role: 'Design, front-end development',
		url: 'https://zulik.co/',
		description:
			'I designed and built the new portfolio for Zulik, the studio I co-founded with my friend Anton Van Diermen. Awarded FWA Site of the Day.'
	},
	payjustnow: {
		slug: 'payjustnow',
		title: 'PayJustNow',
		year: 2025,
		role: 'Front-end development',
		url: 'https://payjustnow.com/',
		description:
			'Motion-rich marketing site focused on smooth transitions and refined scroll interactions, designed by Estrela Studio.'
	},
	vineyard: {
		slug: 'vineyard',
		title: 'Vineyard Hotel',
		year: 2025,
		role: 'Front-end development',
		url: 'https://www.vineyard.co.za/',
		description:
			'Performance-focused marketing site featuring elegant motion effects and custom third-party integrations, designed by Estrela Studio.'
	}
};
