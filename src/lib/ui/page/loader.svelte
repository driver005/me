<script lang="ts">
  import { useProgress } from '@threlte/extras';
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';

  const { progress, item } = useProgress();

  let isLoaded = $state(false);
  let { hasEntered = $bindable(false) }: { hasEntered: boolean } = $props();
  let hasTargetStarted = $state(false);
  let percent = $state(0);
  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let ctx = $state<CanvasRenderingContext2D | null>(null);
  let scratchRevealed = $state(false);
  let shouldZoom = $state(false);
  let scratchPercent = $state(0);
  let threshold = 15;

  let radius = 50;
  let circumference = 2 * Math.PI * radius;
  let offset = $derived(circumference * (1 - percent / 100));
  let fillProgress = $derived(Math.min((scratchPercent / threshold) * 100, 100));

  $effect(() => {
    if ($item?.includes('/models/home-transformed.glb')) hasTargetStarted = true;
  });

  $effect(() => {
    if (!hasTargetStarted) return;
    const value = Math.round($progress * 100);
    if (value > percent) percent = value;
    if ($progress === 1) isLoaded = true;
  });

  function fillCanvas() {
    if (!canvasEl || !browser) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvasEl.width = w * dpr;
    canvasEl.height = h * dpr;
    canvasEl.style.width = `${w}px`;
    canvasEl.style.height = `${h}px`;
    const c = canvasEl.getContext('2d')!;
    ctx = c;
    c.scale(dpr, dpr);
    c.fillStyle = '#F3F2EE';
    c.fillRect(0, 0, w, h);
    drawGrain(c, w, h);
  }

  function drawGrain(c: CanvasRenderingContext2D, w: number, h: number) {
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 1.5 + 0.5;
      c.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
      c.beginPath();
      c.arc(x, y, size, 0, Math.PI * 2);
      c.fill();
    }
  }

  function handleMove(e: PointerEvent) {
    if (!isLoaded || scratchRevealed || !ctx || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;


    const brushSize = 18 + scratchPercent * 1.2;
    const strength = 0.3 + scratchPercent * 0.015;
    ctx.fillStyle = `rgba(0,0,0,${strength})`;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, brushSize, 0, Math.PI * 2);
    ctx.fill();

    checkProgress();
    console.log('scratchPercent', scratchPercent);
  }

  function checkProgress() {
    if (!canvasEl || !ctx) return;
    const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
    const pixels = imageData.data;
    let transparent = 0;
    const total = pixels.length / 4;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++;
    }
    scratchPercent = (transparent / total) * 100;
    if (scratchPercent > threshold) {
      scratchRevealed = true;
      triggerZoom();
    }
  }

  function triggerZoom() {
    shouldZoom = true;
    setTimeout(() => {
      hasEntered = true;
    }, 900);
  }

  function handleAutoReveal() {
    scratchRevealed = true;
    triggerZoom();
  }

  $effect(() => {
    if (canvasEl && browser) fillCanvas();
  });
</script>

{#if !hasEntered}
  <div class="absolute inset-0 top-0 left-0 z-100 bg-[#F3F2EE] grain">
    {#if !isLoaded}
      <div class="flex h-full flex-col items-center justify-center gap-6" transition:fade={{ duration: 400 }}>
        <img src="/images/mascot/mascot-wave.png" alt="" class="w-20 sm:w-24" />
        <div class="relative flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 120 120" class="rotate-[-90deg]">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#D9D9D6" stroke-width="5" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none" stroke="#FF3B00" stroke-width="5"
              stroke-dasharray={circumference}
              stroke-dashoffset={offset}
              stroke-linecap="round"
				class="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
          <span class="absolute font-mono text-[22px] tracking-[0.05em] text-[#0A0A0A]">{percent}%</span>
        </div>
      </div>
    {:else}
      <div
        class="flex h-full flex-col items-center justify-center px-4 pointer-events-none select-none transition-transform transition-opacity duration-700 ease-[var(--ease-out-expo)]"
        class:scale-[2]={shouldZoom}
        class:opacity-0={shouldZoom}
      >
        <span class="font-mono text-[10px] uppercase tracking-[0.3em] text-[#555] mb-6">ADRIAN FERNÁNDEZ</span>
        <h2 class="font-display uppercase text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tighter text-center">
          <span class="block text-[#0A0A0A]">ADRIAN</span>
          <span class="block italic text-[#0A0A0A]">
            Fern<span class="text-[#FF3B00] not-italic">á</span>ndez
          </span>
        </h2>
      </div>

      <div class="absolute left-1/2 bottom-8 -translate-x-1/2 pointer-events-none z-20">
        <span class="block font-mono text-sm uppercase tracking-[0.35em] font-bold whitespace-nowrap" style="color:transparent;-webkit-text-stroke:0.5px #FF3B00">
          scratch!
        </span>
        <div class="absolute left-0 top-0 bottom-0 overflow-hidden" style="width:{fillProgress}%">
          <span class="block font-mono text-sm uppercase tracking-[0.35em] font-bold text-[#FF3B00] whitespace-nowrap" style="-webkit-text-stroke:0.5px #FF3B00">
            scratch!
          </span>
        </div>
      </div>

      <canvas
        bind:this={canvasEl}
        class="absolute inset-0 w-full h-full cursor-crosshair transition-opacity transition-transform duration-700 ease-[var(--ease-out-expo)] touch-none"
        class:pointer-events-none={shouldZoom}
        class:opacity-0={shouldZoom}
        onpointermove={handleMove}
      ></canvas>

      <button
        onclick={handleAutoReveal}
        class="absolute top-6 right-6 font-mono text-[9px] uppercase tracking-[0.3em] text-[#555] hover:text-[#FF3B00] border border-black/20 px-3 py-1.5 bg-[#F3F2EE]/80 backdrop-blur-sm cursor-pointer z-10 transition-colors transition-opacity duration-700 ease-[var(--ease-out-expo)]"
        class:pointer-events-none={shouldZoom}
        class:opacity-0={shouldZoom}
      >
        skip →
      </button>
    {/if}
  </div>
{/if}
