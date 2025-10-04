<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
  import Whale from '$lib/components/models/whale.svelte'
</script>

<SheetObject key="Whale">
  {#snippet children({ Transform })}
    <Transform>
      <Whale />
    </Transform>
  {/snippet}
</SheetObject>