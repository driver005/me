// Author bio copy for the Info page.
export interface InfoContent {
	paragraphs: string[];
	tools: string[];
	awards: string[];
}

export const INFO_CONTENT: InfoContent = {
	paragraphs: [
		"I'm Rafi, a creative developer based in Cape Town. My focus is building websites that are super performant and layered with immersive motion and interactions.",
		'I come from a design background which helps me work with designers to bring their ideas to life. I love the process of converting static layouts into memorable experiences.',
		"I'm also the co-founder of Zulik, a web development studio partnering with creative teams to produce brand websites, online stores and whatever the brief needs."
	],
	tools: ['Astro.js', 'WordPress', 'Nuxt.js', 'GSAP', 'Three.js', 'GLSL', 'Sanity', 'Figma'],
	awards: ['2x Awwwards SOTD', '2x Awwwards Dev', '1x FWA FOTD']
};
