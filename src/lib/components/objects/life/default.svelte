<script lang="ts">
	import { T } from "@threlte/core";
	import World from "$lib/components/objects/life/world.svelte";
	import { camera_sections_state } from "$lib/stores/camera";
	import type { CONTENT } from "$lib/types/life";


  const content: CONTENT[] = [
    {
      name: "Grundschule am Hechinger Eck",
      image: {
        link: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Grundschule_Hechinger_Eck_06.jpg/500px-Grundschule_Hechinger_Eck_06.jpg",
        widht: "400px",
      },
      href: "https://hechingereck.de/",
      time: [
        {
          from: "09.2012", 
          until:"07.2016"
        }
      ]
    }, 
    {
      name: "Wildermuth Gymnasium",
      image: {
        link: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Wildermuth-Gymnasium_T%C3%BCbingen_Juli_2022.jpg",
        widht: "400px",
      },
      href: "https://www.wildermuth-gymnasium.de/",
      text : `<a href="https://de.wikipedia.org/wiki/Abitur_in_Baden-W%C3%BCrttemberg" target="_blank">Abitur 2024/2025</a>`,
      time: [
        {
          from: "09.2016",
          until:"07.2025"
        }
      ]
    },
    // {
    //   name: "Abitur",
    //   href: "https://de.wikipedia.org/wiki/Abitur_in_Baden-W%C3%BCrttemberg---https://en.wikipedia.org/wiki/Abitur",
    //   time: [
    //     {
    //       from: "2024",
    //       until:"2025"
    //     }
    //   ]
    // }
    {
      name: "Praktikas",
      children: [
        {
          name: "teclab",
          href: "https://www.sfz-tuebingen.org/",
          image: {
            link: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
            widht: "350px",
          },
          time: [
              {
              from: "2016",
            }
          ]
        },
        {
          name: "Kreismedienzentrum Tübingen",
          href: "https://kmz.kreis-tuebingen.de/Startseite.html",
          image: {
            link: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
            widht: "350px",
          },
          time: [
            {
              from: "2022",
            }
          ]
        }
      ]
    },
    {
      name: "Wettbewerbe",
      children: [
        {
          name: "WRO",
          image: {
            link: "https://imgs.search.brave.com/TtlHjQAwPfWsM0hwiu_YB5purV7BNSInvDBrJ4U62kA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG5t/eWRpc3BsYXlzbmV0/LTFkZWNhLmt4Y2Ru/LmNvbS93ZWIvaW1h/Z2UvcHJvZHVjdC50/ZW1wbGF0ZS8yMTIw/NC9pbWFnZV8yNTY",
            widht: "250px",
          },
          href: "https://www.worldrobotolympiad.de/",
          time: [
            {
              from: "2019"
            },
            {
              from: "2016"
            }
          ]
        },
        {
          name: "VEX-Robotics-Wettbewerb",
          image: {
            link: "https://www.insite-education.de/wp-content/uploads/2021/11/vex_iq_gen2_classroom_bundle_10units-768x768.jpg",
            widht: "250px",
          },
          href: "https://www.vexrobotics.com/competition?___store=vexroboticseu&___from_store=vexrobotics",
          time: [
            {
              from: "2019"
            },
          ]
        },
        {
          name: "Jugend forscht",
          image: {
            link: "https://www.jugend-forscht-mv.de/picture/JugendforschtMotto2024.png",
            widht: "350px",
          },
          href: "https://www.jugend-forscht.de/",
          time: [
            {
              from: "2019"
            },
          ]
        }
      ]
    }
  ]
</script>

{#if $camera_sections_state.life > 0 && $camera_sections_state.life != 1}
  <T.Group name={"My Life"}>
    <World {content} />
  </T.Group>
{/if}