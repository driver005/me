<script lang="ts">
	import { Project } from "@threlte/theatre";
	import Common from "$lib/components/sceens/common.svelte";
	import Intro from "$lib/components/sceens/intro.svelte";
	import Life from "$lib/components/sceens/life.svelte";
	import Projects from "./projects.svelte";
  import PERSONAL from "$lib/sequences/PERSONAL.json"
	import Skills from "$lib/components/objects/skill_graph/default.svelte";
</script>

<Project name="PERSONAL" config={{state: PERSONAL}}>
  <Common />
  <Intro />
  <Life />
  <Projects />
  <Skills />
</Project>