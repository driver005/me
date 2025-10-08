<script lang="ts">
	import { T } from "@threlte/core";
	import World from "$lib/components/objects/life/world.svelte";
	import { camera_sections_state } from "$lib/stores/camera";
	import type { CONTENT } from "$lib/types/life";


  const content: CONTENT[] = [
    {
      name: "Grundschule am Hechinger Eck",
      link: "https://hechingereck.de/",
      time: [
        {
          from: "09.2012", 
          until:"07.2016"
        }
      ]
    }, 
    {
      name: "Wildermuth Gymnasium",
      link: "https://www.wildermuth-gymnasium.de/",
      time: [
        {
          from: "09.2016",
          until:"07.2025"
        }
      ]
    },
    // {
    //   name: "Abitur",
    //   link: "https://de.wikipedia.org/wiki/Abitur_in_Baden-W%C3%BCrttemberg---https://en.wikipedia.org/wiki/Abitur",
    //   time: ["2024/2025"]
    // }, 
    // {
    //   name: "Praktiken",
    //   link: "",
    //   time: "",
    //   children: [
    //     {
    //       name: "teclab",
    //       link: "https://www.sfz-tuebingen.org/",
    //       time: ["(add)"]
    //     },
    //     {
    //       name: "Kreismedienzentrum Tübingen",
    //       link: "https://kmz.kreis-tuebingen.de/Startseite.html",
    //       time: ["(add)"]
    //     }
    //   ]
    // },
    // {
    //   name: "Wettbewerbe",
    //   link: "",
    //   time: "",
    //   children: [
    //     {
    //       name: "WRO",
    //       link: "https://www.worldrobotolympiad.de/",
    //       time: ["(add)", "(add)"]
    //     },
    //     {
    //       name: "VEX-Robotics-Wettbewerb",
    //       link: "https://www.vexrobotics.com/competition?___store=vexroboticseu&___from_store=vexrobotics",
    //       time: ["(add)"]
    //     },
    //     {
    //       name: "Jugend forscht",
    //       link: "https://www.jugend-forscht.de/",
    //       time: ["(add)"]
    //     }
    //   ]
    // }
  ]
</script>

{#if $camera_sections_state.life > 0 && $camera_sections_state.life != 1}
  <T.Group name={"My Life"}>
    <World {content} />
  </T.Group>
{/if}