<script lang="ts">
	import { T } from "@threlte/core";
	import World from "$lib/components/objects/life/world.svelte";
	import { camera_sections_state } from "$lib/stores/camera";
	import type { CONTENT } from "$lib/types/life";
  import * as THREE from "three";

  const RADIUS = 15
  const HEIGHT_OF_ROTATION = 5
  const radius_difference = RADIUS * 0.2;

  const content: CONTENT[] = [
    {
      name: {
        text: "Grundschule am Hechinger Eck",
        color: "#fff",
      },
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Grundschule_Hechinger_Eck_06.jpg/500px-Grundschule_Hechinger_Eck_06.jpg",
      href: "https://hechingereck.de/",
      time: [
        {
          from: "09.2012", 
          until:"07.2016"
        }
      ],
      position: new THREE.Vector3(RADIUS - (radius_difference * 0.25), HEIGHT_OF_ROTATION * 0.25, 0), // Ponit 2: right(0.25)
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
      type: "PRIMERY_SCHOOL"
    }, 
    {
      name: {
        text: "Wildermuth Gymnasium",
        color: "#7c7c7c"
      },
      image: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Wildermuth-Gymnasium_T%C3%BCbingen_Juli_2022.jpg",
      href: "https://www.wildermuth-gymnasium.de/",
      text : `<a href="https://de.wikipedia.org/wiki/Abitur_in_Baden-W%C3%BCrttemberg" target="_blank">Abitur 2024/2025</a>`,
      time: [
        {
          from: "09.2016",
          until:"07.2025"
        }
      ],
      position: new THREE.Vector3(0, HEIGHT_OF_ROTATION * 0.5, -(RADIUS - (radius_difference * 0.5))), // Ponit 3: bottom(0.5)
      rotation: new THREE.Euler(-Math.PI, 0, -Math.PI),
      type: "SECONDARY_SCHOOL"
    },
    {
      name: {
        text:"teclab",
        color: "#fff",
      },
      image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
      href: "https://www.sfz-tuebingen.org/",
      time: [
          {
          from: "2016",
        }
      ],
      position: new THREE.Vector3(-(RADIUS - (radius_difference * 0.75)), HEIGHT_OF_ROTATION * 0.75, 0), // Ponit 2: left(0.75)
      rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      type: "INTERNSHIP"
    },
    {
      name: {
        text: "Kreismedienzentrum Tübingen",
        color: "#fff",
      },
      href: "https://kmz.kreis-tuebingen.de/Startseite.html",
      image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
      time: [
        {
          from: "2022",
        }
      ],
      position: new THREE.Vector3(0, HEIGHT_OF_ROTATION, RADIUS - radius_difference), // Ponit 2: bottom(1)
      rotation: new THREE.Euler(0, 0, 0),
      type: "INTERNSHIP"
    },
    {
      name: {
        text: "WRO",
        color: "#7c7c7c",
      },
      image: "https://imgs.search.brave.com/TtlHjQAwPfWsM0hwiu_YB5purV7BNSInvDBrJ4U62kA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG5t/eWRpc3BsYXlzbmV0/LTFkZWNhLmt4Y2Ru/LmNvbS93ZWIvaW1h/Z2UvcHJvZHVjdC50/ZW1wbGF0ZS8yMTIw/NC9pbWFnZV8yNTY",
      href: "https://www.worldrobotolympiad.de/",
      time: [
        {
          from: "2019"
        },
        {
          from: "2016"
        }
      ],
      position: new THREE.Vector3(RADIUS - (radius_difference * 0.25), HEIGHT_OF_ROTATION * 1.25, 0), // Ponit 2: right(1.25)
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
      type: "COMPETITION"
    },
    {
      name: {
        text: "VEX-Robotics-Wettbewerb",
        color: "#fff",
      },
      image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
      href: "https://www.vexrobotics.com/competition?___store=vexroboticseu&___from_store=vexrobotics",
      time: [
        {
          from: "2019"
        },
      ],
      position: new THREE.Vector3(0, HEIGHT_OF_ROTATION * 1.5, -(RADIUS - (radius_difference * 0.5))), // Ponit 3: bottom(1.5)
      rotation: new THREE.Euler(-Math.PI, 0, -Math.PI),
      type: "COMPETITION"
    },
    {
      name: {
        text: "Jugend forscht",
        color: "#fff",
      },
      image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
      href: "https://www.jugend-forscht.de/",
      time: [
        {
          from: "2024"
        },
      ],
      position: new THREE.Vector3(-(RADIUS - (radius_difference * 0.75)), HEIGHT_OF_ROTATION * 1.75, 0), // Ponit 2: left(1.75)
      rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      type: "COMPETITION"
    },
    {
      name: {
        text: "BW-KI",
        color: "#fff",
      },
      image: "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nprrlitGjP0LKInI_xY_nC2Ys9y7rO9nkonnQAUr0GTBZUOyhujPud1H8ZVjiJVpyz17QyBsLJ_7lz3rA4HM6qAh4fEzGFpvRm3y9UpFoVkxlQyB02G8AZjZbOd90-g9TZ3tYcs=s680-w680-h510-rw",
      href: "https://www.jugend-forscht.de/",
      time: [
        {
          from: "2020"
        },
      ],
      position: new THREE.Vector3(0, HEIGHT_OF_ROTATION * 2, RADIUS - radius_difference), // Ponit 2: bottom(2)
      rotation: new THREE.Euler(0, 0, 0),
      type: "COMPETITION"
    }
  ]
</script>

{#if $camera_sections_state.life > 0 && $camera_sections_state.life != 1}
  <T.Group name={"My Life"}>
    <World {content} />
  </T.Group>
{/if}