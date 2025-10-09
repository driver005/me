<script lang="ts">
	import { PROJECT_OFFSET } from "$lib/consts";
	import { camera_sections_state } from "$lib/stores/camera";
	import { T } from "@threlte/core";
	import { Text3DGeometry } from "@threlte/extras";
	import { onDestroy } from "svelte";
	import { Tween } from "svelte/motion";
	import { writable } from "svelte/store";

  const Start = PROJECT_OFFSET.z + 50;
  const End = PROJECT_OFFSET.z - 50;

  let position: [number, number, number] = $state([0, 40, Start]);

  let opacity = writable(new Tween(0, { duration: 500 }))

  const unsubscribeCameraPositions = camera_sections_state.subscribe((current) => {
    if (current.project_in > 0 && !(current.project_in === 1)) {
      $opacity.set(1);
      position = [
        0,
        40,
        Start + (End - Start) * current.project_in,
      ];
    } else {
      $opacity.set(0)
    }
  })

  onDestroy(() => {
    unsubscribeCameraPositions()
  })
</script>

{#if $opacity.current > 0 && $opacity.current != 1}
  <T.Group name={"My Projects"}>
    <T.Mesh position={position} rotation={[0, Math.PI, 0]}>
      <Text3DGeometry
        text="My Projects"
        size={2}
        depth={0.5}
        bevelEnabled
        bevelOffset={0}
        bevelSize={0.15}
        bevelThickness={0.10}
        bevelSegments={20} 
        curveSegments={12}
        smooth={0.1}
      />
      <T.MeshStandardMaterial
        color="var(--color-primary)"
        toneMapped={false}
        metalness={1.0}
        roughness={0.1}
        opacity={$opacity.current}
      transparent={true}
      />
    </T.Mesh>   
  </T.Group>
{/if}