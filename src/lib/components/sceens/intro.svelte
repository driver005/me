<script lang="ts">
	import { Sheet } from "@threlte/theatre";
  import Camera from "$lib/components/camera/default.svelte";
  import Whale from "$lib/components/objects/whale.svelte";
	import AboutMe from "../objects/about_me/default.svelte";
</script>

<Sheet name="Intro">
  <Camera />
  <Whale />
  <AboutMe />
</Sheet>