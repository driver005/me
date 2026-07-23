// Generative ambient pad — synthesized entirely via Web Audio API.
// No external audio asset: avoids any licensing question around reusing a third-party sound file.
export function createAmbientPad() {
	let ctx: AudioContext | null = null;
	let master: GainNode | null = null;
	const oscillators: OscillatorNode[] = [];
	const NOTES = [55, 110, 164.81, 220]; // A1, A2, E3, A3 — a calm open fifth/octave stack

	function start() {
		if (ctx) return;
		ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
		master = ctx.createGain();
		master.gain.value = 0;
		master.connect(ctx.destination);
		master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.5);

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 900;
		filter.connect(master);

		NOTES.forEach((freq, i) => {
			const osc = ctx!.createOscillator();
			osc.type = i % 2 === 0 ? 'sine' : 'triangle';
			osc.frequency.value = freq;

			const lfo = ctx!.createOscillator();
			lfo.frequency.value = 0.05 + i * 0.02;
			const lfoGain = ctx!.createGain();
			lfoGain.gain.value = 3;
			lfo.connect(lfoGain);
			lfoGain.connect(osc.frequency);
			lfo.start();

			const oscGain = ctx!.createGain();
			oscGain.gain.value = 0.25 / NOTES.length;
			osc.connect(oscGain);
			oscGain.connect(filter);
			osc.start();
			oscillators.push(osc);
			oscillators.push(lfo as unknown as OscillatorNode);
		});
	}

	function stop() {
		if (!ctx || !master) return;
		const c = ctx;
		const m = master;
		m.gain.linearRampToValueAtTime(0, c.currentTime + 1);
		setTimeout(() => {
			oscillators.forEach((o) => { try { o.stop(); } catch {} });
			oscillators.length = 0;
			c.close();
		}, 1100);
		ctx = null;
		master = null;
	}

	return { start, stop };
}
