<script lang="ts">
	import Room from '$lib/models/home.svelte';
	import * as THREE from 'three';
	import { T, injectPlugin } from '@threlte/core';
	import { getContext, onMount, onDestroy } from 'svelte';
	import { create_video_texture } from '$lib/util/video.svelte';

	const friendly = getContext<{ value: boolean }>('friendly');

	const video_disposers: (() => void)[] = [];

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
				const { texture, dispose } = create_video_texture('/textures/video/screen.mp4');
				video_disposers.push(dispose);
				obj.material = new THREE.MeshBasicMaterial({
					map: texture,
					name: 'tv',
					transparent: true,
					opacity: 0.9
				});
			}

			if (name.includes('auxdisplay')) {
				const { texture, dispose } = create_video_texture('/textures/video/music_player.mp4');
				video_disposers.push(dispose);
				obj.material = new THREE.MeshBasicMaterial({
					map: texture,
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
			video_disposers.forEach((d) => d());
			dispose_node(args.ref);
		});
	});

</script>

<T.Group name="Room">
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
