import { browser } from '$app/environment';
import { onScroll } from '$lib/util/scroll-manager.svelte';

export function useScrollShow(threshold = 0.8) {
  let show = $state(false);
  let lastY = 0;

  $effect(() => {
    if (!browser) return;
    lastY = window.scrollY;

    const unsub = onScroll((y) => {
      if (y < window.innerHeight * threshold) {
        show = false;
      } else {
        if (y < lastY - 2) show = true;
        else if (y > lastY + 2) show = false;
      }
      lastY = y;
    });

    return unsub;
  });

  return show;
}
