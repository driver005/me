<script lang="ts">
  import '../app.css';

  import CanvasPortalTarget from '$lib/components/canvas/target.svelte'
  import { Canvas } from '@threlte/core'
  import type { Snippet } from 'svelte'
	import { WebGPURenderer } from 'three/webgpu';

  let { children }: { children: Snippet } = $props()
</script>

<div class="absolute">
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
  div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  canvas {
    pointer-events: none;
  }
</style>
