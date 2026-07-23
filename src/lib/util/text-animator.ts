import gsap from 'gsap';
import { TextSplitter } from './text-splitter';

const lettersAndSymbols = [
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '=', ';', ':',
	'<', '>', ','
];

export class TextAnimator {
	textElement: HTMLElement;
	private splitter: TextSplitter;
	private originalChars: string[] = [];

	constructor(textElement: HTMLElement) {
		if (!textElement || !(textElement instanceof HTMLElement)) {
			throw new Error('Invalid text element provided.');
		}
		this.textElement = textElement;
		this.splitter = new TextSplitter(this.textElement, {
			splitTypeTypes: 'chars'
		});
		this.originalChars = (this.splitter.getChars() ?? []).map((char) => char.innerHTML);
	}

	animate() {
		this.reset();

		const chars = this.splitter.getChars() ?? [];

		chars.forEach((char, position) => {
			const initialHTML = char.innerHTML;

			gsap.fromTo(
				char,
				{ opacity: 0 },
				{
					duration: 0.03,
					onComplete: () =>
						gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
					repeat: 2,
					repeatRefresh: true,
					repeatDelay: 0.05,
					delay: (position + 1) * 0.06,
					innerHTML: () =>
						lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
					opacity: 1
				}
			);
		});

		gsap.fromTo(this.textElement, { '--anim': 0 }, { duration: 1, ease: 'expo', '--anim': 1 });
	}

	animateBack() {
		gsap.killTweensOf(this.textElement);
		gsap.to(this.textElement, { duration: 0.6, ease: 'power4', '--anim': 0 });
	}

	reset() {
		const chars = this.splitter.getChars() ?? [];
		chars.forEach((char, index) => {
			gsap.killTweensOf(char);
			char.innerHTML = this.originalChars[index];
		});

		gsap.killTweensOf(this.textElement);
		gsap.set(this.textElement, { '--anim': 0 });
	}

	destroy() {
		this.splitter.destroy();
	}
}
