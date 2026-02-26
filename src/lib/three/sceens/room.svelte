<script lang="ts">
	import Room from '$lib/models/home.svelte';
	import * as THREE from 'three';
	import { T, injectPlugin } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { getContext, onMount, onDestroy } from 'svelte';
	import { Home, Skills, Music, Dust, Slides } from '$lib/ui/dialog';
	import { create_video_texture } from '$lib/util/video.svelte';
	import { social_links } from '$lib/data';

	let life_tab = $state(false);
	let skill_tab = $state(false);
	let music_tab = $state(false);
	let dust_tab = $state(false);
	let slides_tab = $state(false);
	let dust_opened = $state(1);

	const helper = getContext<{ value: boolean }>('helper');
	const friendly = getContext<{ value: boolean }>('friendly');

	let room_ref = $state<any>();
	let now = $state(new Date());
	let hourHand = $state<THREE.Mesh | null>(null);
	let minuteHand = $state<THREE.Mesh | null>(null);

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 60000); // 60 seconds
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (!hourHand || !minuteHand) return;

		const hours = now.getHours() % 12;
		const minutes = now.getMinutes();
		const seconds = now.getSeconds();

		const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

		const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

		minuteHand.rotation.y = -minuteAngle;
		hourHand.rotation.y = -hourAngle;
	});

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

	function change_obj(obj: any) {
		if (obj.children && obj.children.length !== 0) {
			for (const child of obj.children) {
				change_obj(child);
			}
		}

		if (obj.isMesh && obj.material) {
			const name = obj.material.name.toLowerCase();

			$effect(() => {
				if (name.includes('joint')) {
					obj.visible = !friendly.value;
				}
			});

			if (name.includes('glass')) {
				obj.material = new THREE.MeshPhysicalMaterial({
					transmission: 1,
					opacity: 1,
					color: 0xfbfbfb,
					metalness: 0,
					roughness: 0,
					ior: 3,
					thickness: 0.01,
					specularIntensity: 1,
					envMapIntensity: 1,
					depthWrite: false,
					specularColor: 0xfbfbfb
				});
			}

			if (name.includes('water')) {
				obj.material = new THREE.MeshBasicMaterial({
					color: 0x558bc8,
					transparent: true,
					opacity: 0.4,
					depthWrite: false
				});
			}

			if (name.includes('tv')) {
				obj.material = new THREE.MeshBasicMaterial({
					map: create_video_texture('/textures/video/screen.mp4'),
					name: 'tv',
					transparent: true,
					opacity: 0.9
				});
			}

			if (name.includes('auxdisplay')) {
				obj.material = new THREE.MeshBasicMaterial({
					map: create_video_texture('/textures/video/music_player.mp4'),
					name: 'aux',
					transparent: true,
					opacity: 0.9
				});
			}

			if (name.includes('hour')) {
				hourHand = obj;
			}
			if (name.includes('minute')) {
				minuteHand = obj;
			}
		}
	}

	function dispose_node(node: any) {
		if (!node) return;

		// 1. Recursive call for all children
		if (node.children) {
			for (const child of node.children) {
				dispose_node(child);
			}
		}

		// 2. Dispose Geometry
		if (node.geometry) {
			node.geometry.dispose();
		}

		// 3. Dispose Material(s)
		if (node.material) {
			const materials = Array.isArray(node.material) ? node.material : [node.material];

			for (const mat of materials) {
				// Clean up all textures assigned to the material
				for (const key of Object.keys(mat)) {
					const value = mat[key];
					if (value && typeof value === 'object' && value.isTexture) {
						value.dispose();
					}
				}
				mat.dispose();
			}
		}
	}

	injectPlugin('room', (args) => {
		onMount(() => {
			if (args.ref.children) {
				args.ref.children.forEach((child: any) => change_obj(child));
			}
		});

		onDestroy(() => {
			dispose_node(args.ref);
		});
	});

	function handlePointerUp(e: any) {
		e.stopPropagation();

		if (e.nativeEvent.button !== 2) return;

		for (const obj of e.intersections ?? []) {
			if (obj != null) {
				let name = obj.object.name.toLowerCase();
				const linkKey = Object.keys(social_links).find((key) => name.includes(key));
				if (linkKey) {
					const newWindow = window.open(social_links[linkKey], '_blank', 'noopener,noreferrer');
					if (newWindow) {
						newWindow.opener = null;
					}
				}
				break;
			}
		}
	}

	function handlePointerDown(e: any) {
		e.stopPropagation();

		if (e.nativeEvent.button !== 2) return;

		for (const obj of e.intersections ?? []) {
			if (obj != null) {
				let hit = obj.object;
				let name = hit.material.name.toLowerCase();

				if (hit.name.includes('SpacePotion')) {
					skill_tab = true;
					helper.value = false;
					break;
				}
				if (hit.name.includes('SpaceMilk')) {
					life_tab = true;
					helper.value = false;
					break;
				}
				if (hit.name.includes('SpaceJuice')) {
					life_tab = true;
					helper.value = false;
					break;
				}
				if (name.includes('tv')) {
					life_tab = true;
					helper.value = false;
					break;
				}
				if (name.includes('laptop')) {
					skill_tab = true;
					helper.value = false;
					break;
				}
				if (name.includes('dust')) {
					dust_tab = true;
					helper.value = false;
					break;
				}
				if (name.includes('gucci')) {
					slides_tab = true;
					helper.value = false;
					break;
				}
				if (!friendly.value) {
					if (hit.name.includes('SpaceSpeaker')) {
						music_tab = true;
						helper.value = false;
						break;
					}
					if (name.includes('aux')) {
						music_tab = true;
						helper.value = false;
						break;
					}
					if (hit.name.includes('SpaceCasset')) {
						music_tab = true;
						helper.value = false;
						break;
					}
				}
				break;
			}
		}
	}
</script>

<Home bind:open={life_tab} />
<Skills bind:open={skill_tab} />
<Music bind:open={music_tab} />
<Dust bind:open={dust_tab} bind:open_count={dust_opened} />
<Slides bind:open={slides_tab} />

<T.Group
	name="Room"
	onpointerup={(e: any) => handlePointerUp(e)}
	onpointerdown={(e: any) => handlePointerDown(e)}
	dispose={false}
>
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
