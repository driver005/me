import SplitType from 'split-type';

type SplitTypes = 'lines' | 'words' | 'chars';

interface TextSplitterOptions {
	splitTypeTypes?: SplitTypes;
	resizeCallback?: () => void;
}

export class TextSplitter {
	textElement: HTMLElement;
	splitter: InstanceType<typeof SplitType>;
	private onResize: (() => void) | null;
	private previousContainerWidth: number | null = null;
	private resizeObserver: ResizeObserver | null = null;

	constructor(textElement: HTMLElement, options: TextSplitterOptions = {}) {
		if (!textElement || !(textElement instanceof HTMLElement)) {
			throw new Error('Invalid text element provided.');
		}

		const { resizeCallback, splitTypeTypes } = options;
		this.textElement = textElement;
		this.onResize = typeof resizeCallback === 'function' ? resizeCallback : null;

		const splitOptions = splitTypeTypes ? { types: splitTypeTypes } : {};
		this.splitter = new SplitType(this.textElement, splitOptions);

		if (this.onResize) {
			this.initResizeObserver();
		}
	}

	private initResizeObserver() {
		this.resizeObserver = new ResizeObserver((entries) => {
			const [{ contentRect }] = entries;
			const width = Math.floor(contentRect.width);
			if (this.previousContainerWidth && this.previousContainerWidth !== width) {
				// @ts-ignore SplitType types
				this.splitter.split();
				this.onResize?.();
			}
			this.previousContainerWidth = width;
		});
		this.resizeObserver.observe(this.textElement);
	}

	revert() {
		return this.splitter.revert();
	}

	getLines() {
		return this.splitter.lines;
	}

	getWords() {
		return this.splitter.words;
	}

	getChars() {
		return this.splitter.chars;
	}

	destroy() {
		this.resizeObserver?.disconnect();
		this.revert();
	}
}
