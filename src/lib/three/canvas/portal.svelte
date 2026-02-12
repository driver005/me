<script lang="ts">
	import {
		addCanvasPortalSnippet,
		removeCanvasPortalSnippet
	} from '$lib/three/canvas/target.svelte';
	import { type Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();

	$effect(() => {
		addCanvasPortalSnippet(children);
		return () => removeCanvasPortalSnippet(children);
	});
</script>

