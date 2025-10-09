<script lang="ts">
  import { T, useThrelte } from "@threlte/core";
  import { HTML, useViewport } from "@threlte/extras";
  import * as THREE from "three";
  import { PROJECT_SCREEN_WIDTH, PROJECT_SCREEN_HEIGHT, PROJECT_OFFSET } from "$lib/consts";
  import { onDestroy, onMount } from "svelte";
  import { writable } from "svelte/store";
	import { camera_sections_state } from "$lib/stores/camera";
	import { Tween } from "svelte/motion";
	import Title from "$lib/components/objects/projects/title.svelte";
	import { RoundedPlaneGeometry } from "$lib/utils/html";
	import type { IFRAME } from "$lib/types/project";
	import Iframe from "./iframe.svelte";

  const URL = "https://example.com";
  const iframeWidth = writable(0);
  const iframeHeight = writable(0);
  const DURATION = 3000;
  const DELAY = 3000;

  const viewport = useViewport()

  let load = $state(false);

  const positions = [
    new THREE.Vector3(PROJECT_SCREEN_HEIGHT / 2, -10, PROJECT_SCREEN_WIDTH / 2),
    new THREE.Vector3(-(20 + PROJECT_SCREEN_WIDTH / 2), -10,PROJECT_SCREEN_HEIGHT / 2),
    new THREE.Vector3(-(20 + PROJECT_SCREEN_HEIGHT / 2), -10, -(20 + PROJECT_SCREEN_WIDTH / 2)),
    new THREE.Vector3(PROJECT_SCREEN_WIDTH / 2, -10, -(20 + PROJECT_SCREEN_HEIGHT / 2))
  ].map((p) => PROJECT_OFFSET.clone().add(p));
  
  const static_values: IFRAME[] = [
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
    if(current.project_in > 0) {
      load = true
    }
    if (current.project_in > 0 && current.project_rotate === 0) {
      $dynamic_values[0].set(1);
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

  onDestroy(() => {
    unsubscribeCameraPositions();
  });
  
</script>

<T.Group name={"Projects"}>
  <Title />
    {#each static_values as iframe, index}
      {#if $dynamic_values[index].current > 0}
        <Iframe dynamic_value={$dynamic_values[index]} {iframe} {index}  />
      {/if}
  {/each}
</T.Group>