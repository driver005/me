export function useMouseParallax(amplitude = 16) {
  let mx = $state(0);
  let my = $state(0);

  function onMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    my = x * amplitude;
    mx = -y * amplitude * 0.75;
  }

  function onLeave() {
    mx = 0;
    my = 0;
  }

  return { mx, my, onMove, onLeave, px: $derived(mx * -1.125), py: $derived(my * -1.125) };
}
