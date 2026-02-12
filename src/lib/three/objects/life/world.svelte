<script lang="ts">
	import { SheetObject } from "@threlte/theatre";
	import { T, useThrelte } from "@threlte/core";
	import Timeline from "./timeline.svelte";
	import type { CONTENT, CONTENT_TIME } from "$lib/types/life";
	import Carousel from "./carousel.svelte";
  import * as THREE from "three";
  import fragment_shader from '$lib/shader/image/fragment_shader.glsl?raw'
  import vertex_shader from '$lib/shader/image/vertex_shader.glsl?raw'
	import { camera_sections_state } from "$lib/stores/camera";
	import { onDestroy } from "svelte";
	import { header_content } from "$lib/stores/html";
	import { Text } from "@threlte/extras";

  const SIZE = 3


  let {
    content
  }: {
    content: CONTENT[]
  } = $props()

  const sections = 1 / (content.length + 1);

  const unsubscribeCameraPositions = camera_sections_state.subscribe((current) => {
    if(current.life >= (1-sections/2) || current.life <= sections/2) {
      header_content.set({
        info: "",
        render: false
      })

      return;
    }
    content.forEach((val, index) => {
      const pos = (sections*index)+sections/2;
      if (current.life > pos && current.life <= pos+sections) {
        header_content.set({
          info: val.type,
          text: val.text,
          time: val.time,
          render: true
        })
      }
    })
  })

  onDestroy(() => {
    unsubscribeCameraPositions()
  })
</script>



<SheetObject key="World">
  {#snippet children()}

  <T.Mesh position={[0, 0, 0]}>
    <T.BoxGeometry args={[10, 20, 10]} />
    <T.MeshBasicMaterial color="#0a0a0a" />
  </T.Mesh>
  {#each content as segment}
    <T.Mesh 
      position={segment.position.toArray()} 
      rotation={segment.rotation.toArray()} 
    >
      <Text
        position={[
          -(SIZE - 0.5)/2,
          -(SIZE - 1.6)/2,
          0.2
        ]}
        text={segment.name.text}
        fontSize={0.15}
        color={segment.name.color}
        textAlign="center"
      />
      <T.PlaneGeometry args={[SIZE, SIZE-1]} />
      <T.ShaderMaterial
        fragmentShader={fragment_shader}
        vertexShader={vertex_shader}
        transparent={true}
        uniforms={{
          uTexture: { value: new THREE.TextureLoader().load(segment.image) },
          uOffset: { value: new THREE.Vector2(0.0, 0.0) },
          uAlpha: { value: 1.0 }
        }}
      />
    </T.Mesh>
  {/each}
    <!-- {#each content as segment, index}
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
    {/each} -->
  {/snippet}
</SheetObject>

{#snippet internal(segment: CONTENT, index: number)}
  <div class="flex flex-col gap-2 bg-white p-2">
    {#if segment.image}
      <div class="relative flex w-full justify-center group">
        <img
          alt={segment.name.text}
          title={segment.name.text}
          src={segment.image}
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