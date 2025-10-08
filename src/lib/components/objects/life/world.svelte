<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
	import Planet1 from "$lib/components/models/Planet_1.svelte";
	import { Float, HTML } from "@threlte/extras";
	import { T } from "@threlte/core";
	import { RoundedPlaneGeometry } from "$lib/utils/html";
	import Timeline from "./timeline.svelte";
	import type { CONTENT } from "$lib/types/life";

  const TIMELINE_CONFIG = {
    startYear: 2005,
    endYear: new Date().getFullYear(), // Current year
    highlightFrom: 2010,
    highlightUntil: 2020,
  }

  let {
    content
  }: {
    content: CONTENT[]
  } = $props()

</script>

<SheetObject key="World">
  {#snippet children()}
    
  <!-- <Float
      floatIntensity={2}
      scale={0.5}
      rotationIntensity={2}
      rotationSpeed={[0, 2, 0]}
      position={[0, 0, 10]}
    >
  </Float> -->
    {#each content as segment, index}
      <T.Group position={[0, 0, 15*index+1]} rotation={[-Math.PI /2, 0,Math.PI /2 ]}>
        <Planet1 />
        <HTML
          transform
          occlude
          geometry={new RoundedPlaneGeometry(10, 10, 0.25)}
          position={[0, (index % 2 === 0 ? 15 : -15), 0]}
        >
          <div class="flex flex-col gap-2 bg-white p-2">
            <div
              class="iframe-wrapper"
              style="width:400px; height:200px; opacity:1;"
            >
              <iframe
                title={segment.name}
                src={segment.link}
                width="100%"
                height="100%"
                frameborder="0"
                style="display:block;"
              ></iframe>
            </div>
            <h1 class="font-bold text-2xl">{segment.name}</h1>
            <Timeline time={segment.time} />
          </div>
        </HTML>
      </T.Group>
    {/each}
    <!-- <Float
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
    </Float> -->
  {/snippet}
</SheetObject>