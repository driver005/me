<script lang="ts">
  import { T } from '@threlte/core'
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import html2canvas from 'html2canvas'

  let texture: THREE.Texture

  // Reference to HTML element you want to render as texture
  let htmlRef: HTMLElement

  onMount(async () => {
    // Render the HTML to a canvas
    const canvas = await html2canvas(htmlRef, {
      backgroundColor: null, // transparent background
    })

    // Create Three.js texture
    texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
  })
</script>

<!-- This hidden HTML will become a texture -->
<div bind:this={htmlRef} class="p-4 bg-blue-500 text-white text-xl rounded-lg w-64 text-center hidden">
  Hello from HTML ✨
</div>

<!-- Display that HTML as material on a plane -->
{#if texture}
  <T.Mesh>
    <T.PlaneGeometry args={[2, 1]} />
    <T.MeshBasicMaterial map={texture} transparent />
  </T.Mesh>
{/if}
