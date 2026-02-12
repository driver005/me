<script lang="ts">
  import { DO_NOT_ANIMATE, getCategoryColor, getCategoryEmissive, type SKILL } from "$lib/utils/graph";
  import { T } from "@threlte/core";
  import { Text } from "@threlte/extras";
  import { cubicOut } from "svelte/easing";
  import { Tween } from "svelte/motion";
  import { RigidBody, Collider } from "@threlte/rapier";
  import * as THREE from "three";
	import { SKILL_OFFSET, SKILL_ROTATION_TEXT } from "$lib/consts";

  let { skills, rigidBodies }: { skills: SKILL[], rigidBodies: Map<string, any> } = $props();

  let hovered_skill: string = $state("");
  const pulse_scale = new Tween(1, { duration: 300, easing: cubicOut });
  
  const handle_hover = (id: string) => {
    hovered_skill = id;
    pulse_scale.set(1.5);
  };

  const reset_hover = () => {
    hovered_skill = "";
    pulse_scale.set(1);
  };
</script>

{#each skills as skill (skill.id)}
  {#key skill.id}
    {#if !(skill.id === DO_NOT_ANIMATE)}
      <T.Group
        onpointerenter={() => handle_hover(skill.id)}
        onpointerleave={() => reset_hover()}
      >
        <RigidBody
          oncreate={(ref) => {
            rigidBodies.set(skill.id, ref)
            const p = new THREE.Vector3(skill.position[0], skill.position[1], skill.position[2]).add(SKILL_OFFSET);
            ref.setTranslation(p, false)
          }}
          type="kinematicPosition"
          gravityScale={0}

        >
            <Collider shape="ball" args={[skill.size]} />

            <T.Mesh scale={hovered_skill === skill.id ? pulse_scale.current : 1}>
              <T.SphereGeometry args={[skill.size, 16, 16]} />
              <T.MeshStandardMaterial
                color={hovered_skill === skill.id ? "#aa00ff" : getCategoryColor(skill.category)}
                emissive={hovered_skill === skill.id ? "#aa00ff" : getCategoryEmissive(skill.category)}
                emissiveIntensity={hovered_skill === skill.id ? 2 : 1}
              />
            </T.Mesh>

            {#if hovered_skill === skill.id}
              <T.Group position={[0, skill.size * 3.0, 0]} rotation={SKILL_ROTATION_TEXT.toArray()}>
                <Text
                  fontSize={0.26}
                  color="#fff"
                  text={`${skill.name}\n(Level ${skill.level})`}
                  anchorX="center"
                  anchorY="middle"
                />
              </T.Group>
            {/if}
          </RigidBody>
        </T.Group>
      {/if}
  {/key}
{/each}
