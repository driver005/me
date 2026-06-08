<script lang="ts">
  import { useIntersectionObserver } from '$lib/util/intersection.svelte';

  let {
    value = 100,
    duration = 1400,
    class: className = '',
    suffix = '',
  }: {
    value?: number | string;
    duration?: number;
    class?: string;
    suffix?: string;
  } = $props();

  const target = $derived(parseInt(String(value).replace(/\D/g, ''), 10) || 0);
  const pad = $derived(String(value).match(/^0+/)?.[0]?.length ?? 0);

  let displayValue = $state(0);
  let intersection = useIntersectionObserver({ threshold: 0.6 });

  $effect(() => {
    if (!intersection.isIntersecting) return;
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      displayValue = Math.round(target * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  const padded = $derived(
    String(displayValue)
      .padStart(pad + String(target).length, '0')
      .slice(-Math.max(2, String(target).length))
  );
</script>

<span bind:this={intersection.element} class={className}>{padded}{suffix}</span>
