<script lang="ts">
	import { Project } from '@threlte/theatre';
	import Common from '$lib/three/sceens/common.svelte';
	import Intro from '$lib/three/sceens/intro.svelte';
	import Life from '$lib/three/sceens/life.svelte';
	import Projects from './projects.svelte';
	import PERSONAL from '$lib/sequences/PERSONAL.json';
	import Skills from '$lib/three/objects/skill_graph/default.svelte';
	import { T, useThrelte } from '@threlte/core';
	import { onMount } from 'svelte';
	import Home from '$lib/three/models/home.svelte';
	import Room from '$lib/three/sceens/room.svelte';
	const { size } = useThrelte();
</script>

<Project name="PERSONAL" config={{ state: PERSONAL }}>
	<Room />
</Project>
