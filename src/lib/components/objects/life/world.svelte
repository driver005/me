<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
	import Planet1 from "$lib/components/models/Planet_1.svelte";
	import { Float, HTML } from "@threlte/extras";
	import { T, useThrelte } from "@threlte/core";
	import { RoundedPlaneGeometry } from "$lib/utils/html";
	import Timeline from "./timeline.svelte";
	import type { CONTENT } from "$lib/types/life";
	import Carousel from "./carousel.svelte";
  import { onMount } from 'svelte';
	import { writable } from "svelte/store";
  import * as THREE from "three";

  const width = writable(0);
  const height = writable(0);

  const LIFE_SCEEN_WIDHT = 10
  const LIFE_SCEEN_HIGHT = 10

  onMount(() => {
    const { renderer } = useThrelte();

    const updatePixelSize = () => {
      const fov = 50; 
      const distance = 50; // distance from camera to object

      // Get current renderer height (in drawing buffer pixels)
      const size = new THREE.Vector2();
      renderer.getSize(size);
      const rendererHeight = size.y;

      // Calculate visible height at given distance
      const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2));

      // Pixels per world unit
      const pixelsPerUnit = rendererHeight / visibleHeight;

      console.log('1 Three.js units ≈', pixelsPerUnit, 'pixels at distance', distance);

      const scale = 1.9;

      width.set((LIFE_SCEEN_WIDHT * scale) * pixelsPerUnit);
      height.set((LIFE_SCEEN_HIGHT * scale) *  pixelsPerUnit);
    };

    updatePixelSize();
    window.addEventListener("resize", updatePixelSize);
  });


  let {
    content
  }: {
    content: CONTENT[]
  } = $props()

</script>

<SheetObject key="World">
  {#snippet children()}
    {#each content as segment, index}
      <T.Group position={[0, 0, 15*(index+1)]} rotation={[-Math.PI /2, 0,Math.PI /2 ]}>
        <T.Group name="planet" scale={[0.5, 0.5, 0.5]}>
          <Planet1 />
        </T.Group>
        <T.LineSegments>
          <T.BufferGeometry 
            attributes={{
              position: new THREE.Float32BufferAttribute(
                new Float32Array([
                  0, (index % 2 === 0 ? 1.5 : -1.5), 0,
                  0, (index % 2 === 0 ? 5 : -5), 0 ,
                ]),
                3
              )
            }}
          />
          <T.LineBasicMaterial 
            color={"#bdbdbd"} 
            transparent 
            opacity={1}
            linewidth={3}
          />
        </T.LineSegments>
        <HTML
          transform
          occlude
          position={[0, (index % 2 === 0 ? 10 : -10), 0]}
        >
          <div style={segment.children ? `width: ${$width}px;` : `width: ${$width}px; height: ${$height}px;`}>
            {@render internal(segment, index)}
          </div>
        </HTML>
      </T.Group>
    {/each}
  {/snippet}
</SheetObject>

{#snippet internal(segment: CONTENT, index: number)}
  <div class="flex flex-col gap-2 bg-white p-2">
    {#if segment.image}
      <div class="relative flex w-full justify-center group">
        <img
          alt={segment.name}
          title={segment.name}
          src={segment.image.link}
          width={segment.image.widht}
          class="block rounded-lg"
        />
        {#if segment.href}
          <div class="absolute inset-0 rounded-lg bg-gray-800 bg-opacity-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <a
            href={segment.href}
            class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
          <button class="bg-white text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">
            {segment.name}
            </button>
          </a>
        {/if}
      </div>
    {/if}
    {#if segment.iframe}
      <div
        class="iframe-wrapper group relative"
        style={`width: ${segment.iframe.widht}; height: ${segment.iframe.height};`}
      >
        <iframe
          class="block fixed top-[-100px]"
          style={`left: ${index === 0 ? "0" : `${index*100}%`}`}
          title={`Project iframe number: ${segment.name}`}
          src={segment.iframe.link}
          scrolling="no"
          width="100%"
          height="100%"
          frameborder="0"
        ></iframe>
        {#if segment.href}
          <div class="absolute inset-0 bg-gray-800 bg-opacity-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <a
            href={segment.href}
            class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
          <button class="bg-white text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">
            {segment.name}
            </button>
          </a>
        {/if}
      </div>
    {/if}
    <h1 class="font-bold text-2xl">{segment.name}</h1>
    {#if segment.text}
      <h3 class="font-bold text-xl text-amber-500">{@html segment.text}</h3>
    {/if}
    {#if segment.time}
      <Timeline time={segment.time} />
    {/if}
    {#if segment.children}
      <div class="border rounded-full border-gray-300 mb-2"></div>
      <Carousel>
        {#each segment.children as child, index}
        <div class="w-full shrink-0 h-full">
          {@render internal(child, index)}
        </div>
        {/each}
      </Carousel>
    {/if}
  </div>
{/snippet}