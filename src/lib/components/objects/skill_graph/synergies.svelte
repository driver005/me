<script lang="ts">
  import { T } from "@threlte/core";
	import { Text } from "@threlte/extras";
	import { Float32BufferAttribute } from "three";
	import type { SYNERGY, SKILL } from "$lib/utils/graph";
  import * as THREE from "three";
	import { SKILL_OFFSET, SKILL_ROTATION_TEXT } from "$lib/consts";

  let {
    synergies,
    currentPositions
  } : {
    synergies: SYNERGY[],
    currentPositions: Map<string, THREE.Vector3>;
  } = $props()


  function get_skill(id: string): THREE.Vector3 | undefined {
    return currentPositions.get(id);
  }

</script>
<!-- SYNERGY connections -->
  {#each synergies as synergy}
    {#if get_skill(synergy.from) && get_skill(synergy.to)}
      <T.LineSegments>
        <T.BufferGeometry 
          attributes={{
            position: new Float32BufferAttribute(
              new Float32Array([
                ...get_skill(synergy.from)!.toArray(),
                ...get_skill(synergy.to)!.toArray()
              ]),
              3
            )
          }}
        />
        <T.LineBasicMaterial 
          color={synergy.color} 
          transparent 
          opacity={0.3 + synergy.strength * 0.5} 
        />
      </T.LineSegments>
      
      <T.Mesh 
        position={
          new THREE.Vector3()
            .addVectors(
              get_skill(synergy.from)!, 
              get_skill(synergy.to)!
            )
            .multiplyScalar(0.5)
            .toArray()
        }
      >
        <T.SphereGeometry args={[0.18 + synergy.strength * 0.18, 16, 16]} />
        <T.MeshStandardMaterial 
          color={synergy.color}
          transparent 
          opacity={0.15 + synergy.strength * 0.25}
          emissive={synergy.color}
          emissiveIntensity={synergy.strength * 1.2}
        />
        <T.Group position={[0, 0.7, 0]} rotation={SKILL_ROTATION_TEXT.toArray()}>
          <Text 
            fontSize={0.18}
            color={synergy.color}
            text={synergy.name}
            anchorX="center"
            anchorY="middle"
          />
        </T.Group>
      </T.Mesh>
    {/if}
  {/each}