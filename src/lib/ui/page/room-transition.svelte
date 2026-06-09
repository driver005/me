<script lang="ts">
  import { goto } from '$app/navigation';
  import { pageTransition } from '$lib/stores/page-transition';

  let animating = $state(false);
  let visible = $state(true);
  let circleEl = $state<SVGCircleElement | null>(null);

  function handleClick() {
    if (animating) return;
    animating = true;
    pageTransition.set(true);

    const duration = 1000;
    const start = performance.now();

    function tick() {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      circleEl?.setAttribute('r', String(eased * 71));
      if (t < 1) requestAnimationFrame(tick);
      else {
        goto('/home');
      }
    }
    requestAnimationFrame(tick);
  }
</script>

{#if visible}
  <section
    id="room"
    data-testid="room-section"
    class="relative min-h-screen bg-black text-[#E1E0CC] border-b border-[#F3F2EE]/20 overflow-hidden flex items-center justify-center cursor-pointer"
    onclick={handleClick}
  >
    <video
      class="absolute inset-0 w-full h-full object-cover pointer-events-none"
      src="/textures/video/screen.mp4"
      autoplay
      muted
      loop
      playsinline
    ></video>
    <div class="absolute inset-0 bg-black/40 pointer-events-none"></div>
    <h2 class="relative text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter text-center uppercase select-none" style="font-family:'Cabinet Grotesk',sans-serif">
      LA CASA
    </h2>
  </section>
{/if}

{#if $pageTransition}
  <div class="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
    <div class="w-full h-full grid place-items-center">
      <svg
        viewBox="-50 -50 100 100"
        preserveAspectRatio="xMidYMid slice"
        class="w-full h-full"
      >
        <circle
          bind:this={circleEl}
          cx="0"
          cy="0"
          r="0"
          fill="#F3F2EE"
        />
      </svg>
    </div>
  </div>
{/if}
