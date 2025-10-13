<script lang="ts">
  import { T } from '@threlte/core';
  import * as THREE from 'three';
  import fragment_shader from '$lib/shader/image/fragment_shader.glsl?raw'
  import vertex_shader from '$lib/shader/image/vertex_shader.glsl?raw'
	import { onDestroy, onMount } from 'svelte';

  const images = [
    '/textures/space.png',
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5'
  ];
  let materials: THREE.ShaderMaterial[] = []

  // Temporary offset value that will update on scroll
  let scrollOffset = 0

  function handleScroll() {
    console.log("test")
    const scrollY = window.scrollY || 0
    // normalize the scroll between 0 and 1 roughly
    scrollOffset = Math.sin(scrollY * 0.002) * 0.05

    // update all materials’ uniform values
    materials.forEach(mat => {
      mat.uniforms.uOffset.value.set(0, scrollOffset)
    })
  }

  onMount(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onDestroy(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<!-- Image planes -->
{#each images as url, i}
  <T.Mesh position={[i * 2.2, 0, 0]}>
    <T.PlaneGeometry args={[1.5, 1.5]} />
    <T.ShaderMaterial
      oncreate={(ref) => {materials[i] = ref}}
      fragmentShader={fragment_shader}
      vertexShader={vertex_shader}
      transparent={true}
      uniforms={{
        uTexture: { value: new THREE.TextureLoader().load(url) },
        uOffset: { value: new THREE.Vector2(0.0, 0.0) },
        uAlpha: { value: 1.0 }
      }}
    />
  </T.Mesh>
{/each}