<script lang="ts">
  import type { IFRAME } from "$lib/types/project";
  import { RoundedPlaneGeometry } from "$lib/utils/html";
  import { T, useThrelte } from "@threlte/core";
  import { onMount } from "svelte";
  import type { Tween } from "svelte/motion";
  import * as THREE from "three";

  const VIDEO_URL = "https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4"; // your video file

  function getViewportSize(camera: THREE.PerspectiveCamera, distance = 0) {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFov / 2) * Math.abs(distance - camera.position.y);
    const width = height * camera.aspect;
    return { width, height };
  }

  const { camera } = useThrelte();
  const { width, height } = getViewportSize($camera as THREE.PerspectiveCamera, 0);

  onMount(() => {
    console.log('Viewport in world units:', width, height);
  });

  let video: HTMLVideoElement;
  let videoTexture: THREE.VideoTexture;

  onMount(() => {
    video.play();
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
  });

  let {
    iframe,
    dynamic_value,
    index
  }: {
    iframe: IFRAME;
    dynamic_value: Tween<number>;
    index: number;
  } = $props();
</script>

<T.Group position={iframe.position.toArray()} rotation={iframe.rotation}>
  {#if videoTexture}
    <T.Mesh>
      <T.MeshGeometry geometry={new RoundedPlaneGeometry(width*0.8, height*0.8, 2)} />
      <T.MeshBasicMaterial map={videoTexture} toneMapped={false}/>
    </T.Mesh>
  {/if}

  <!-- Optional: overlay HTML if you still want it interactive -->
  <!--
  <HTML transform occlude="blending" center={true} geometry={new RoundedPlaneGeometry(width*0.8, height*0.8, 2)}>
    <div class="iframe-wrapper" style="opacity:{dynamic_value.current};"></div>
  </HTML>
  -->
</T.Group>

<video bind:this={video} src={VIDEO_URL} loop muted playsinline style="display:none;" />

<style>
  .iframe-wrapper {
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
