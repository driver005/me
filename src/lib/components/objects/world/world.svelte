<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
	import Planet1 from "$lib/components/models/Planet_1.svelte";
	import { Float } from "@threlte/extras";
</script>

<SheetObject key="World">
  {#snippet children()}
    <Float
      floatIntensity={2}
      scale={0.5}
      rotationIntensity={2}
      rotationSpeed={[0, 2, 0]}
      position={[0, 0, 10]}
    >
      <Planet1 />
    </Float>
    <Float
        floatIntensity={2}
        scale={0.5}
        rotationIntensity={2}
        rotationSpeed={[0, 2, 0]}
        position={[0, 0, 20]}
      >
        <Planet1 />
    </Float>
    <Float
        floatIntensity={2}
        scale={0.5}
        rotationIntensity={2}
        rotationSpeed={[0, 2, 0]}
        position={[0, 0, 30]}
      >
        <Planet1 />
    </Float>
  {/snippet}
</SheetObject>