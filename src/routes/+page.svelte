<script lang="ts">
  import CanvasPortal from "$lib/components/canvas/portal.svelte";
  import DevHelper from "$lib/components/dev/helper.svelte";
	import Sceens from "$lib/components/sceens/default.svelte";
	import { Grid, PerfMonitor } from "@threlte/extras";
  import camera_1 from "$lib/sequences/camera_1.json"
	import Deepspace from "$lib/components/skybox/deepspace.svelte";
   import { World } from '@threlte/rapier'

  // Toggle between Studio and Theatre in development
  let helper: "Studio" | "Theatre" = "Theatre";
</script>

{#if import.meta.env.MODE === "development"}
  <button class="btn" on:click={() => helper = helper === "Studio" ? "Theatre" : "Studio"}>
    Toggle Helper
  </button>
{/if}

<CanvasPortal>
  <World>
  <DevHelper {helper} >
    <PerfMonitor
      anchorX={'left'}
      logsPerSecond={30}
    />


  <Sceens />
  <Deepspace />
  <Grid
  sectionColor="#ff3e00"
  sectionThickness={1}
  cellColor="#cccccc"
  gridSize={40}
  />
</DevHelper>
</World>
</CanvasPortal>

<style>
  .btn {
    position: absolute;
    z-index: 999;
  }
</style>