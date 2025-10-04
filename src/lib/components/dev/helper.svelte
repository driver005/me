<script lang="ts">
  import type { Snippet } from "svelte";
	import { Studio } from "@threlte/studio";
	import { Theatre } from "@threlte/theatre";

  let { helper = "Theatre", children }: { helper?: "Studio" | "Theatre", children:Snippet } = $props();
</script>

{#if import.meta.env.MODE === "development"}
  {#if helper === "Studio"}
    <Studio>
      {@render children()} 
    </Studio>
  {:else}
    <Theatre>
      {@render children()} 
    </Theatre>
  {/if}
{:else}
  {@render children()}
{/if}
