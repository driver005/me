<script lang="ts">
	import { create_radial_synergies, create_skills_recursive, DO_NOT_ANIMATE, randomInt, root_skill, type SKILL } from "$lib/utils/graph";
	import { T, useTask, useThrelte } from "@threlte/core";
	import Skills from "./skills.svelte";
	import Synergies from "./synergies.svelte";
	import { SKILL_OFFSET, SKILL_ROTATION } from "$lib/consts";
  import * as THREE from "three";
	import { interactivity } from "@threlte/extras";
	import { writable } from "svelte/store";
  
  export const skills: SKILL[] = []

  create_skills_recursive(skills, root_skill)

  const synergies = create_radial_synergies(skills)

  const WAVE_SIZE = 0.5

  // Physics control maps
  const rigidBodies = new Map<string, any>();
  const targetPositions = new Map<string, THREE.Vector3>();
  const currentPositions = writable(new Map<string, THREE.Vector3>());

  // Initialize skill positions
  skills.forEach(skill => {
    const p = skill.id === DO_NOT_ANIMATE ? new THREE.Vector3(skill.position[0], skill.position[1], skill.position[2])
      .applyEuler(SKILL_ROTATION) :
      new THREE.Vector3(skill.position[0], skill.position[1], skill.position[2])
      .add(new THREE.Vector3(0, randomInt(-WAVE_SIZE, WAVE_SIZE), 0))
      .applyEuler(SKILL_ROTATION)
    targetPositions.set(skill.id, p.clone().add(SKILL_OFFSET));
    currentPositions.update(map => {
      map.set(skill.id, p);
      return map;
    });
  });

  const { camera } = useThrelte();
  const cursor_world = new THREE.Vector3();

  // Threlte interactivity: update pointer and raycaster
  interactivity({
    compute: (event, state) => {
      if (!camera.current) return;

      // Update normalized pointer
      state.pointer.update((p) => {
        p.x = (event.clientX / window.innerWidth) * 2 - 1;
        p.y = -(event.clientY / window.innerHeight) * 2 + 1;
        return p;
      });

      // Update the raycaster
      state.raycaster.setFromCamera(state.pointer.current, camera.current);

      // Always project pointer onto a horizontal plane (Y = 0)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersect = new THREE.Vector3();
      if (state.raycaster.ray.intersectPlane(plane, intersect)) {
        // Update cursor_world every frame
        cursor_world.copy(intersect);
      }
    },
    target: document.body
  });

  useTask(() => {
    rigidBodies.forEach((rb, id) => {
      if(id === DO_NOT_ANIMATE) return
      const pos = rb.translation();

      // console.log("pos: ", pos)
      const current = new THREE.Vector3(pos.x, pos.y, pos.z);
      // console.log("current: ", current)
      const target = targetPositions.get(id)!;

      // 1. Move toward target
      const offset = target.clone().sub(current).multiplyScalar(0.01);
      current.add(offset);

      // 2. If very close to target, snap target back toward base
      if (current.distanceToSquared(target) < 0.01) {
        targetPositions.set(id, new THREE.Vector3(target.x, randomInt(-WAVE_SIZE, WAVE_SIZE), target.z));
      }

      currentPositions.update(map => {
        map.set(id, current.clone().sub(SKILL_OFFSET));
        return map;
      });

      rb.setNextKinematicTranslation(current);
    });
  });
</script>

<T.Group name="Skill Graph" position={SKILL_OFFSET.toArray()}>
  <Skills {skills} {rigidBodies} />
  <Synergies {synergies} currentPositions={$currentPositions} />
</T.Group>