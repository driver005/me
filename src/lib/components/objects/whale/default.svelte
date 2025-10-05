<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
  import Whale from '$lib/components/models/whale.svelte'
  import { LIFE_CURVE, PROJECT_ONE_CURVE, PROJECT_TWO_CURVE, PROJECT_THREE_CURVE, PROJECT_FOUR_CURVE, PROJECT_OUT_CURVE, PROJECT_IN_CURVE } from './curves'
	import { Float } from "@threlte/extras";
  import * as THREE from 'three'
	import { whale_section_type, whale_sections_state, type WHALE_CURVE_TYPE, type WHALE_SECTIONS } from "$lib/stores/whale";
	import { onDestroy } from "svelte";
	import { writable } from "svelte/store";
	import { camera_section_type, camera_sections_state, type CAMERA_CURVE_TYPE } from "$lib/stores/camera";

  const whale_position = writable(new THREE.Vector3(0, 0, 0));

  function change(position: WHALE_SECTIONS) {
    whale_sections_state.set(position)
  }

  function move_whale({
    point_whale,
  }: {
    point_whale: THREE.Vector3,
  }) {
    whale_position.set(point_whale);
  }

  let active_whale_section: WHALE_CURVE_TYPE = "Null";
  const unsubscribeWhaleSection = whale_section_type.subscribe(value => {
    active_whale_section = value;
  });
  let active_camera_section: CAMERA_CURVE_TYPE = "Null";
  const unsubscribeCameraSection = camera_section_type.subscribe(value => {
    active_camera_section = value;
  });

  const unsubscribeWhalePositions = whale_sections_state.subscribe((current) => {
    switch(active_whale_section) {
      case "LIFE":
        move_whale({
          point_whale: LIFE_CURVE.getPointAt(current.life)
        })
        break;
      case "PROJECT_ONE":
        move_whale({
          point_whale: PROJECT_ONE_CURVE.getPointAt(current.project_one)
        })
        break;
      case "PROJECT_TWO":
        move_whale({
          point_whale: PROJECT_TWO_CURVE.getPointAt(current.project_two)
        })
        break;
      case "PROJECT_THREE":
        move_whale({
          point_whale: PROJECT_THREE_CURVE.getPointAt(current.project_three)
        })
        break; 
      case "PROJECT_FOUR":
        move_whale({
          point_whale: PROJECT_FOUR_CURVE.getPointAt(current.project_four)
        })
        break;
      case "Null":
        break;
    }
  })

  const unsubscribeCameraPositions = camera_sections_state.subscribe((current) => {
    switch(active_camera_section) {
      case "PROJECT_IN":
        move_whale({
          point_whale: PROJECT_IN_CURVE.getPointAt(current.project_in)
        })
        break;
      case "PROJECT_OUT":
        move_whale({
          point_whale: PROJECT_OUT_CURVE.getPointAt(current.project_out)
        })
        break;
      case "Null":
        break;
    }
  })

  onDestroy(() => {
    unsubscribeWhaleSection();
    unsubscribeWhalePositions();
    unsubscribeCameraSection();
    unsubscribeCameraPositions();
  });
</script>

<SheetObject 
  key="Whale" 
  props={{ 
    life: 0, 
    project_one: 0, 
    project_two: 0,
    project_three: 0,
    project_four: 0,
  }} 
  onchange={({
    life,
    project_one, 
    project_two,
    project_three,
    project_four
  }) => change({
    life, 
    project_one, 
    project_two,
    project_three,
    project_four
  })}
>
  {#snippet children()}
    <Float
      position={$whale_position.toArray()}
    >
      <Whale />
    </Float>
  {/snippet}
</SheetObject>