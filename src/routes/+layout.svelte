<script lang="ts">
	import './layout.css';
	import '../app.css';
	import CanvasPortalTarget from '$lib/three/canvas/target.svelte';
	import { Canvas } from '@threlte/core';
	import { setContext, type Snippet } from 'svelte';
	import { WebGPURenderer } from 'three/webgpu';
	import { useBreakpoint } from '$lib/util/screen.svelte';
	import Webgl from '$lib/three/dev/webgl.svelte';
	import { page } from '$app/state';
	import { Loader } from '$lib/ui/page';
	import { ModeWatcher, mode } from 'mode-watcher';

	let manual_override = $state(false);
	let helper = $state(true);
	let friendly = $state(true);

	let theme_var: string = $state(mode.current ? mode.current : 'light');

	let isDesktop = useBreakpoint('768px');

	setContext('manual_override', {
		get value() {
			return manual_override;
		},
		set value(v: boolean) {
			manual_override = v;
		}
	});

	setContext('theme', {
		get value() {
			return theme_var;
		},
		set value(v: string) {
			theme_var = v;
		}
	});

	setContext('helper', {
		get value() {
			return helper;
		},
		set value(v: boolean) {
			helper = v;
		}
	});

	setContext('friendly', {
		get value() {
			return friendly;
		},
		set value(v: boolean) {
			friendly = v;
		}
	});

	let { children }: { children: Snippet } = $props();
</script>

<ModeWatcher />

{#if isDesktop.value && page.route.id == '/'}
	<Webgl>
		<Loader />
		<div class="h-screen bg-black">
			{#if import.meta.env.MODE === 'development'}
				<Canvas><CanvasPortalTarget /></Canvas>
			{:else}
				<Canvas
					createRenderer={(canvas) => {
						return new WebGPURenderer({ canvas, antialias: true, forceWebGL: false });
					}}
				>
					<CanvasPortalTarget />
				</Canvas>
			{/if}
		</div>
	</Webgl>
{/if}

{@render children()}
