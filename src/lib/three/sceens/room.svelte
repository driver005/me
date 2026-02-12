<script lang="ts">
	import { Project } from '@threlte/theatre';
	import Room from '$lib/three/models/home.svelte';
	import * as THREE from 'three';
	import { T, injectPlugin } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { onMount } from 'svelte';
	import Camera from '$lib/three/camera/room.svelte';
	import { goto } from '$app/navigation';

	// Reuseable Materials
	const glassMaterial = new THREE.MeshPhysicalMaterial({
		transmission: 1,
		opacity: 1,
		color: 0xfbfbfb,
		metalness: 0,
		roughness: 0,
		ior: 3,
		thickness: 0.01,
		specularIntensity: 1,
		// envMap: environmentMap,
		envMapIntensity: 1,
		depthWrite: false,
		specularColor: 0xfbfbfb
	});

	const socialLinks = {
		github: 'https://github.com/andrewwoan/sooahkimsfolio',
		youtube: 'https://youtu.be/AB6sulUMRGE',
		twitter: 'https://www.twitter.com/',
		instagram: 'https://www.twitter.com/'
	};

	let room_ref = $state<any>();

	$effect(() => {
		if (!room_ref) return;
		room_ref.mixer.timeScale = 0.4;
		room_ref?.actions.subscribe((actions: any) => {
			if (actions.length === 0) return;
			Object.values(actions).forEach((action: any) => {
				action.play();
			});
		});
	});

	interactivity();

	injectPlugin('room', (args) => {
		onMount(() => {
			if (args.ref instanceof THREE.Mesh && args.ref.material) {
				const name = args.ref.material.name.toLowerCase();

				if (name.includes('glass')) {
					args.ref.material = glassMaterial;
				}
			}
		});
	});

	function handlePointerDown(e: any) {
		e.stopPropagation();
		for (const obj of e.intersections ?? []) {
			if (obj != null) {
				let hit = obj.object;
				console.log(hit.name);
				if (hit.name.includes('SpaceSpeaker')) {
					goto('/speaker');
				}
				if (hit.name.includes('SpacePotion')) {
					goto('/potion');
				}
				if (hit.name.includes('SpaceMilk')) {
					goto('/milk');
				}
				if (hit.name.includes('SpaceJuice')) {
					goto('/juice');
				}
				if (hit.name.includes('SpaceCasset')) {
					goto('/casset');
				}
				let name = hit.material.name.toLowerCase();
				const linkKey = Object.keys(socialLinks).find((key) => name.includes(key));
				if (linkKey) {
					const newWindow = window.open(socialLinks[linkKey], '_blank', 'noopener,noreferrer');
					if (newWindow) {
						newWindow.opener = null;
					}
				}
				break;
			}
		}
	}
</script>

<Project name="ROOM">
	<Camera />
	<T.Group name="Room" onpointerup={(e: any) => handlePointerDown(e)}>
		<Room bind:this={room_ref}>
			{#snippet error({ error }: { error: Error })}
				<div class="error-ui">{error.message}</div>
			{/snippet}

			{#snippet fallback()}
				<p>Loading model...</p>
			{/snippet}

			{#snippet children()}{/snippet}
		</Room>
	</T.Group>
</Project>
