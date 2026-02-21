import { browser } from "$app/environment";

export function useBreakpoint(width: string) {
  let matches = $state(false);

  $effect(() => {
    if (!browser) return;

    const media = globalThis.matchMedia(`(min-width: ${width})`);

    // 1. Set initial state
    matches = media.matches;

    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Clear the timer while the user is still dragging/resizing
      clearTimeout(timer);

      // 2. Only update state once resizing has "stilled" for 150ms
      // This effectively detects the "end" of the resize action
      timer = setTimeout(() => {
        if (matches !== media.matches) {
          matches = media.matches;
        }
      }, 150);
    };

    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  });

  return {
    get value() {
      return matches;
    },
  };
}
