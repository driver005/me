<script lang="ts">
	import { T } from '@threlte/core';
  import { Align, HTML, Text3DGeometry } from '@threlte/extras'
	import { SheetObject } from '@threlte/theatre';
  import * as THREE from 'three'
	import Images from './images.svelte';

  // config
  const Start = 10;
  const End = -37.5;
  let fade_thresholde = 0.1;
  let movement_thresholde = 0.2;

  // reactive tuple for position
  let groupPosition: [number, number, number] = $state([-10, 5, Start]);
  let opacity = $state(0);
  let transform_images = $state(0);

  function change(start: number) {
    if (start <= movement_thresholde) {
      groupPosition = [
        -10,
        5,
        Start + (End - Start) * start / movement_thresholde,
      ];
      opacity = THREE.MathUtils.clamp(start / fade_thresholde, 0, 1);
    } 
    else if (start >= (1-movement_thresholde)) {
      groupPosition = [
        -10,
        5,
        Start + (End - Start) * start / (1-movement_thresholde),
      ];
      opacity = THREE.MathUtils.clamp((1 - start) / fade_thresholde, 0, 1);
    } else {
      opacity = 1;
      // position / max for refrence
      transform_images = THREE.MathUtils.clamp(((start - movement_thresholde) / (1 - 2 * movement_thresholde)), 0, 1);
    }
  }
</script>

<SheetObject key="About Me" props={{ start: 0 }} onchange={({start}) => change(start)}>
  <T.Group name={"About Me"}>
    {#snippet children()}
      <T.Group name={"About Me Text"} position={groupPosition}>
        <Align rotation={[0, THREE.MathUtils.degToRad(90), 0]}>
          {#snippet children({ align })}
            <T.Mesh position={[10, 0, 0]}>
              <Text3DGeometry
                text="About ME"
                size={2}
                depth={0.5}
                bevelEnabled
                bevelOffset={0}
                bevelSize={0.15}
                bevelThickness={0.10}
                bevelSegments={20} 
                curveSegments={12}
                smooth={0.1}
                oncreate={() => {
                  align()
                }}
              />
              <T.MeshStandardMaterial
                color="var(--color-primary)"
                toneMapped={false}
                metalness={1.0}
                roughness={0.1}
                opacity={opacity}
                transparent={true}
              />
            </T.Mesh>      
            <HTML
              position={[-30, 0, 0]}
              transform
              style={`opacity: ${opacity}`}
              oncreate={() => {
                align()
              }}
            >
              <div class="bg-indigo-500 rounded-xl shadow-lg p-6">
                <h1 class="text-white text-3xl font-bold mb-4">Die Über-Mich-Seite im Lebenslauf</h1>
                <p class="text-white mb-2">Ich bin ein kreativer Entwickler</p>
                <p class="text-white mb-2">Leidenschaftlich für 3D & interaktive Erfahrungen</p>
                <p class="text-white">Ich baue immersive Web-Erlebnisse</p>
              </div>
            </HTML>
          {/snippet}
        </Align>
      </T.Group>
      <Images start={transform_images} />
    {/snippet}
  </T.Group>
</SheetObject>