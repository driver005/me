<script lang="ts">
  import { T } from "@threlte/core";
  import { CameraControls, type CameraControlsRef } from "@threlte/extras";
  import { SheetObject } from "@threlte/theatre";  
	import { ME_CURVE_CAMERA, ME_CURVE_TARGET, move_camera, PROJECT_IN_CURVE_TARGET, PROJECT_IN_CURVE_CAMERA, STARTING_CURVE_CAMERA, PROJECT_ROTATE_CURVE_CAMERA, PROJECT_ROTATE_TARGET, PROJECT_OUT_CURVE_CAMERA, PROJECT_OUT_CURVE_TARGET, LIFE_CURVE_CAMERA, LIFE_CURVE_TARGET } from "./curves";
  import { camera_section_type, camera_sections_state, type CAMERA_CURVE_TYPE, type CAMERA_SECTIONS } from "$lib/stores/camera"
	import { onDestroy } from "svelte";
  import * as THREE from "three";

  export let camera_ref: CameraControlsRef | undefined = undefined;
  
  function change(position: CAMERA_SECTIONS) {
    camera_sections_state.set(position)
  }

  let active_camera_section: CAMERA_CURVE_TYPE = "Null";
  const unsubscribeCameraSection = camera_section_type.subscribe(value => {
    active_camera_section = value;
  });

  const unsubscribeCameraPositions = camera_sections_state.subscribe((current) => {
    if (!camera_ref) return;
    switch(active_camera_section) {
      case "START":
        move_camera({
          camera_ref, 
          point_camera: STARTING_CURVE_CAMERA.getPointAt(current.start), 
          point_target: new THREE.Vector3(0,0,0)
        })
        break;
      case "ME":
        move_camera({
          camera_ref, 
          point_camera: ME_CURVE_CAMERA.getPointAt(current.me), 
          point_target: ME_CURVE_TARGET.getPointAt(current.me)
        })
        break;
      case "LIFE":
        move_camera({
          camera_ref, 
          point_camera: LIFE_CURVE_CAMERA.getPointAt(current.life), 
          point_target: LIFE_CURVE_TARGET.getPointAt(current.life),
          angel_camera: THREE.MathUtils.degToRad(0),
        })
        break;
      case "PROJECT_IN":
        let rotation_in = THREE.MathUtils.clamp((current.project_in - 0.5)  / 0.5, 0, 1);
        move_camera({
          camera_ref, 
          point_camera: PROJECT_IN_CURVE_CAMERA.getPointAt(current.project_in), 
          point_target: PROJECT_IN_CURVE_TARGET.getPointAt(current.project_in),
          angel_camera: -(THREE.MathUtils.degToRad(180) + (THREE.MathUtils.degToRad(90) * rotation_in))
        })
        break;
      case "PROJECT_ROTATE":
        move_camera({
          camera_ref, 
          point_camera: PROJECT_ROTATE_CURVE_CAMERA.getPointAt(current.project_rotate), 
          point_target: PROJECT_ROTATE_TARGET.getPointAt(current.project_rotate),
          angel_camera: -(THREE.MathUtils.degToRad(270) + (THREE.MathUtils.degToRad(360) * current.project_rotate))
        })
        break;
      case "PROJECT_OUT":
        if (current.project_out > 0.3 && current.project_out <= 1) {
          let out = THREE.MathUtils.clamp((current.project_out - 0.3)  / 0.7, 0, 1);
          move_camera({
            camera_ref, 
            point_camera: PROJECT_OUT_CURVE_CAMERA.getPointAt(out), 
            point_target: PROJECT_OUT_CURVE_TARGET.getPointAt(out),
            angel_camera: THREE.MathUtils.degToRad(90)
          })
        }
      case "Null":
        break;
    }
  })

  onDestroy(() => {
    unsubscribeCameraSection();
    unsubscribeCameraPositions();
  });
</script>

<SheetObject 
  key="Camera" 
  props={{
    start: 0,
    me: 0,
    life: 0,
    project_in: 0,
    project_rotate: 0,
    project_out: 0,
  }} 
  onchange={({
    start,
    me,
    life,
    project_in,
    project_rotate,
    project_out
  }) => change({
    start,
    me,
    life,
    project_in,
    project_rotate,
    project_out
  })}
>
  {#snippet children()}
    <T.PerspectiveCamera makeDefault fov={50}>
      <CameraControls
        bind:ref={camera_ref}
      />
    </T.PerspectiveCamera>
  {/snippet}
</SheetObject>
