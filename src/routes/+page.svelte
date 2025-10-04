<script lang="ts">
  import CanvasPortal from "$lib/components/canvas/portal.svelte";
  import DevHelper from "$lib/components/dev/helper.svelte";
	import DeepSpace from "$lib/components/skybox/deepspace.svelte";
	import { Project } from "@threlte/theatre";
	import Intro from "$lib/components/sceens/intro.svelte";
	import { Grid } from "@threlte/extras";
  import camera_1 from "$lib/sequences/camera_1.json"

  // Toggle between Studio and Theatre in development
  let helper: "Studio" | "Theatre" = "Theatre";
</script>

{#if import.meta.env.MODE === "development"}
  <button class="btn" on:click={() => helper = helper === "Studio" ? "Theatre" : "Studio"}>
    Toggle Helper
  </button>
{/if}

<CanvasPortal>
  <DevHelper {helper} >
      <Project name="Demo" config={{state: camera_1}}>
        <Intro />
      </Project>
      <DeepSpace />
      <Grid
        sectionColor="#ff3e00"
        sectionThickness={1}
        cellColor="#cccccc"
        gridSize={40}
      />
  </DevHelper>
</CanvasPortal>

<style>
  .btn {
    position: absolute;
    z-index: 999;
  }
</style>