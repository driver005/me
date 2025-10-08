<script lang="ts">
  import { onMount, type Snippet } from "svelte";

  let current = $state(0);
  let container: HTMLDivElement;
  let total = 0;

  function next() {
    current = (current + 1) % total;
  }

  function prev() {
    current = (current - 1 + total) % total;
  }

  // Touch swipe support
  let startX = 0;
  function handleTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
  }
  function handleTouchEnd(e: TouchEvent) {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) next();
    if (endX - startX > 50) prev();
  }

  onMount(() => {
    total = container.children.length;
  });

  let {
    children
  } : {
    children: Snippet
  } = $props()
</script>

<div
  class="relative overflow-hidden select-none touch-pan-y"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <div
    bind:this={container}
    class="flex transition-transform duration-500 ease-in-out"
    style="transform: translateX(-{current * 100}%); w-1/2"
  >
    {@render children()}
  </div>

  <!-- Arrows -->
  <button
    onclick={prev}
    class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
  >
    ◀
  </button>

  <button
    onclick={next}
    class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
  >
    ▶
  </button>

  <!-- Dots -->
  <!-- <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
    {#each Array(total) as _, i}
      <button
        class="w-3 h-3 rounded-full cursor-pointer transition-all bg-white/40"
        class:bg-white={i === current}
        onclick={() => (current = i)}
      ></button>
    {/each}
  </div> -->
</div>
