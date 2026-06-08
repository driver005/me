<script lang="ts">
  let {
    from = '#F3F2EE',
    to = '#0A0A0A',
    height = 200,
  }: { from?: string; to?: string; height?: number } = $props();

  function hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  function buildGradient(from: string, to: string, steps = 15): string {
    const [fr, fg, fb] = hexToRgb(from);
    const [tr, tg, tb] = hexToRgb(to);

    const stops = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const t = easeInOutSine(progress);
      const r = Math.round(fr + (tr - fr) * t).toString(16).padStart(2, '0');
      const g = Math.round(fg + (tg - fg) * t).toString(16).padStart(2, '0');
      const b = Math.round(fb + (tb - fb) * t).toString(16).padStart(2, '0');
      return `#${r}${g}${b} ${(progress * 100).toFixed(1)}%`;
    });

    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }

  const gradient = $derived(buildGradient(from, to));
</script>

<div
  aria-hidden="true"
  style:height="{height}px"
  style:background={gradient}
  style:pointer-events="none"
/>
