<script lang="ts">
  import '../app.css';

  import CanvasPortalTarget from '$lib/components/canvas/target.svelte'
  import { Canvas } from '@threlte/core'
  import type { Snippet } from 'svelte'
	import { WebGPURenderer } from 'three/webgpu';
	import { header_content } from '$lib/stores/html';
	import Timeline from '$lib/components/objects/life/timeline.svelte';

  let { children }: { children: Snippet } = $props()
</script>

<div class="canvas-wrapper absolute">
  {#if $header_content.render}
    <header class="flex justify-center absolute top-0 w-full z-10">
      <div class="flex flex-col gap-2 w-1/5 p-2 bg-white rounded-b-lg">
        <h2 class="px-5 font-bold text-xl">{$header_content.info}</h2>
        {#if $header_content.text}
          <h3 class="px-5 font-bold text-amber-500">{@html $header_content.text}</h3>
        {/if}
        {#if $header_content.time}
          <Timeline time={$header_content.time} />
        {/if}
      </div>
    </header>  
  {/if}
    {#if import.meta.env.MODE === 'development'}
      <Canvas>
        <CanvasPortalTarget />
      </Canvas>
    {:else} 
      <Canvas createRenderer={(canvas) => {
        return new WebGPURenderer({
          canvas,
          antialias: true,
          forceWebGL: false
        })
      }}>
        <CanvasPortalTarget />
      </Canvas>
    {/if}
</div>

{@render children()}

<style>
  .canvas-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
