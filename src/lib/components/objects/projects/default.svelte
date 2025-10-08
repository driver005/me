<script lang="ts">
  import { Sheet } from "@threlte/theatre";
  import { T, useThrelte } from "@threlte/core";
  import { HTML } from "@threlte/extras";
  import * as THREE from "three";
  import { PROJECT_SCEEN_WIDHT, PROJECT_SCEEN_HEIGHT, PROJECT_SCEEN_RADIUS, PROJECT_OFFSET } from "$lib/consts";
  import { onDestroy, onMount } from "svelte";
  import { writable } from "svelte/store";
	import { camera_sections_state } from "$lib/stores/camera";
	import { Tween } from "svelte/motion";
	import Title from "$lib/components/objects/projects/title.svelte";
	import { RoundedPlaneGeometry } from "./html";

  const URL = "https://example.com";
  const iframeWidth = writable(0);
  const iframeHeight = writable(0);
  const DURATION = 3000;
  const DELAY = 3000;


  const positions = [
    new THREE.Vector3(PROJECT_SCEEN_HEIGHT / 2, 0, PROJECT_SCEEN_WIDHT / 2),
    new THREE.Vector3(-(20 + PROJECT_SCEEN_WIDHT / 2), 0,PROJECT_SCEEN_HEIGHT / 2),
    new THREE.Vector3(-(20 + PROJECT_SCEEN_HEIGHT / 2), 0, -(20 + PROJECT_SCEEN_WIDHT / 2)),
    new THREE.Vector3(PROJECT_SCEEN_WIDHT / 2, 0, -(20 + PROJECT_SCEEN_HEIGHT / 2))
  ].map((p) => PROJECT_OFFSET.clone().add(p));

  type IFRAMES = {
    position: THREE.Vector3,
    rotation: [x: number, y: number, z: number, order?: THREE.EulerOrder | undefined],
  }

  const static_values: IFRAMES[] = [
    {
      position: positions[0],
      rotation: [-Math.PI / 2, 0, Math.PI / 2],
    },
    {
      position: positions[1],
      rotation: [Math.PI / 2, Math.PI, Math.PI],
    },
    {
      position: positions[2],
      rotation: [Math.PI / 2, 0, -Math.PI / 2],
    },
    {
      position: positions[3],
      rotation: [-Math.PI/2, Math.PI, Math.PI],
    }
  ]

  const dynamic_values = writable([
    new Tween(0, { duration: DURATION, delay: DELAY }),
    new Tween(0, { duration: DURATION, delay: DELAY }),
    new Tween(0, { duration: DURATION, delay: DELAY }),
    new Tween(0, { duration: DURATION, delay: DELAY }),
  ])

  const unsubscribeCameraPositions = camera_sections_state.subscribe((current) => {
    if (current.project_in > 0 && current.project_rotate === 0) {
      $dynamic_values[0].set(1);
      console.log("success")
    } else if (current.project_rotate > 0 && current.project_rotate <= 0.25) {
      $dynamic_values[1].set(1);
    } else if (current.project_rotate > 0.25 && current.project_rotate <= 0.5) {
      $dynamic_values[2].set(1);
    } else if (current.project_rotate > 0.5 && current.project_rotate <= 0.75) {
      $dynamic_values[3].set(1);
    } else if (current.project_out > 0) {
      $dynamic_values.map((frames) => frames.set(0));
    }
  })


  onMount(() => {
    const { renderer } = useThrelte();

    const updatePixelSize = () => {
      const fov = 50; 
      const distance = 50; // distance from camera to object

      // Get current renderer height (in drawing buffer pixels)
      const size = new THREE.Vector2();
      renderer.getSize(size);
      const rendererHeight = size.y;

      // Calculate visible height at given distance
      const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2));

      // Pixels per world unit
      const pixelsPerUnit = rendererHeight / visibleHeight;

      console.log('1 Three.js units ≈', pixelsPerUnit, 'pixels at distance', distance);

      const scale = 1.9;

      iframeWidth.set((PROJECT_SCEEN_WIDHT * scale) * pixelsPerUnit);
      iframeHeight.set((PROJECT_SCEEN_HEIGHT * scale) *  pixelsPerUnit);
    };

    updatePixelSize();
    window.addEventListener("resize", updatePixelSize);
  });

  onDestroy(() => {
    unsubscribeCameraPositions();
  });
  
</script>

<T.Group name={"Projects"}>
  <Title />
    {#each static_values as iframe, index}
      {#if $dynamic_values[index].current > 0}
        <T.Mesh
          position={iframe.position.toArray()}
          rotation={iframe.rotation}
        >
        <HTML
          transform
          occlude
          geometry={new RoundedPlaneGeometry(PROJECT_SCEEN_WIDHT, PROJECT_SCEEN_HEIGHT, PROJECT_SCEEN_RADIUS)}
          re
        >
          {#if $iframeWidth && $iframeHeight}
            <div
              class="iframe-wrapper"
              style="width:{$iframeWidth}px; height:{$iframeHeight}px; opacity:{$dynamic_values[index].current};"
            >
              <iframe
              title={"Project iframe number: " + index}
              src={URL}
              width="100%"
              height="100%"
              frameborder="0"
              style="display:block;"
              ></iframe>
            </div>
          {/if}
        </HTML>
      </T.Mesh>
    {/if}
  {/each}
</T.Group>

<style>
  .iframe-wrapper {
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
