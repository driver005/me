<script lang="ts">
	import HolographicMaterial from '$lib/components/holographic/default.svelte';
  import { T } from '@threlte/core';

  const images = [
    '/textures/space.png',
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5'
  ];

</script>

<T.Mesh position={[0, 0, 0]}>
	<T.PlaneGeometry args={[10, 10]} />
	<HolographicMaterial />
</T.Mesh>