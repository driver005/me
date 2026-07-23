import { browser } from '$app/environment';

export function useBerlinTime() {
  let time = $state('');

  $effect(() => {
    if (!browser) return;
    const tick = () => {
      time = new Date().toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });

  return {
    get value() { return time; }
  };
}
