<script lang="ts">
  import { Canvas, T } from '@threlte/core'
	import { OrbitControls, Stars } from '@threlte/extras';
	import { Studio } from '@threlte/studio';
	import type { Snippet } from 'svelte';
     import { World } from '@threlte/rapier'
	import { SKILL_OFFSET } from '$lib/consts';
	import { Vector3 } from 'three';

  // Skill data
  export const skills = [
    { name: 'JavaScript', level: 0.9, color: 0xffd86b, moons: ['React', 'Node', 'Three.js'] },
    { name: 'CSS', level: 0.7, color: 0x6bb5ff, moons: ['Sass', 'Tailwind'] },
    { name: 'Backend', level: 0.6, color: 0xa78bfa, moons: ['Node', 'Postgres'] }
  ]

  
  let { children }: { children: Snippet } = $props()
</script>

<div style="width:100vw; height:400vh; background:#0c0c14">
<div style="width:100vw; height:100vh; background:#0c0c14; position: sticky; top: 0%; left: 0%;">
  <Canvas>
    <World autoStart>

        <Studio>
          <Stars radius={200} depth={100} count={12000} factor={6} saturation={0} fade color="#ffffff" />
          <!-- Lighting -->
          <T.AmbientLight intensity={0.15} />
      <T.PointLight position={[0,0,0]} intensity={1.2} />
      <T.PointLight position={[0,0,0]} intensity={0.8} color="#4fc3f7" />
      <T.PointLight position={[0,0,0]} intensity={0.8} color="#2979ff" />
      
      <!-- Camera optimized for radial layout -->
      <T.PerspectiveCamera makeDefault position={[10,10,10]} fov={55}>
        <OrbitControls 
        target={[0,0,0]}
          enablePan
            enableZoom
            enableRotate
          />
        </T.PerspectiveCamera>
        
        {@render children()}    
      </Studio>
    </World>
  </Canvas>
</div>
</div>