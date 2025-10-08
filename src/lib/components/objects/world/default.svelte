<script lang="ts">
	import { T } from "@threlte/core";
	import World from "$lib/components/objects/world/world.svelte";
	import { camera_sections_state } from "$lib/stores/camera";
</script>

{#if $camera_sections_state.life > 0 && $camera_sections_state.life != 1}
  <T.Group name={"My Life"}>
    <World />
  </T.Group>
{/if}