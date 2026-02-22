<script lang="ts">
	import Room from '$lib/three/sceens/room.svelte';
	import Camera from '$lib/three/camera/room.svelte';
	import SkyBox from '$lib/three/skybox/default.svelte';
	import Ligths from '$lib/three/ligths/default.svelte';
	import PostProcessing from '$lib/three/postprocessing/default.svelte';
	import Extras from '$lib/three/extra/default.svelte';
</script>

<SkyBox />
<Camera />
<Extras />
<PostProcessing />
<Ligths />
<Room />
