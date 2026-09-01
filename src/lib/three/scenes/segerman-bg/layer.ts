export abstract class Layer {
	needsRender = true;
	protected isTouch: boolean;

	constructor(isTouch: boolean) {
		this.isTouch = isTouch;
	}

	dirty(): void {
		this.needsRender = true;
	}

	abstract render(): void;

	loop(): void {
		if (this.isTouch) {
			this.render();
			return;
		}
		if (this.needsRender) {
			this.render();
			this.needsRender = false;
		}
	}

	dispose?(): void;
}
