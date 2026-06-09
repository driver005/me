import { browser } from '$app/environment';

export function useScrollShow(threshold = 0.8) {
  let show = $state(false);

  $effect(() => {
    if (!browser) return;
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * threshold) {
        show = false;
      } else {
        if (y < lastY - 2) show = true;
        else if (y > lastY + 2) show = false;
      }
      lastY = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  return show;
}
