<script lang="ts">
  import { T } from "@threlte/core";
  import { CameraControls, type CameraControlsRef } from "@threlte/extras";
  import { SheetObject } from "@threlte/theatre";  
	import { change_camera } from "./curves";

  export let camera_ref: CameraControlsRef | undefined = undefined;
</script>

<SheetObject key="Camera" props={{ start: 0, me: 0 }} onchange={({start, me}) => change_camera(camera_ref, {start, me})}>
  {#snippet children()}
    <T.PerspectiveCamera makeDefault>
      <CameraControls
        bind:ref={camera_ref}
      />
    </T.PerspectiveCamera>
  {/snippet}
</SheetObject>
