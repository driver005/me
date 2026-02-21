<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import {
		BufferGeometry,
		BufferAttribute,
		Points,
		ShaderMaterial,
		NormalBlending,
		Color
	} from 'three';
	import { Tween } from 'svelte/motion';
	import { quadOut } from 'svelte/easing';
	import { onMount, onDestroy, getContext } from 'svelte';

	const { scene } = useThrelte();

	const theme = getContext<{ value: string }>('theme');

	const LIGHT_MODE_COLOR = new Color('#0a3d8f'); // deep navy  — pops on light bg
	const DARK_MODE_COLOR = new Color('#7ab8ff'); // soft blue  — pops on dark bg

	const RAIN_COUNT = 15000;
	const RAIN_AREA = 40;
	const RAIN_HEIGHT = 20;

	const positions = new Float32Array(RAIN_COUNT * 3);
	const phases = new Float32Array(RAIN_COUNT);

	for (let i = 0; i < RAIN_COUNT; i++) {
		positions[i * 3 + 0] = (Math.random() - 0.5) * RAIN_AREA;
		positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
		positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
		phases[i] = Math.random();
	}

	const rainGeo = new BufferGeometry();
	rainGeo.setAttribute('position', new BufferAttribute(positions, 3));
	rainGeo.setAttribute('phase', new BufferAttribute(phases, 1));

	const rainMat = new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: NormalBlending,

		uniforms: {
			uTime: { value: 0 },
			uOpacity: { value: 0 },
			uHeight: { value: RAIN_HEIGHT },
			uSpeed: { value: 6.0 },
			uColor: { value: theme.value == 'dark' ? DARK_MODE_COLOR : LIGHT_MODE_COLOR },
			uDropSize: { value: theme.value == 'dark' ? 50 : 120 }
		},

		vertexShader: /* glsl */ `
			attribute float phase;

			uniform float uTime;
			uniform float uHeight;
			uniform float uSpeed;
			uniform float uDropSize;

			varying float vAlpha;

			void main() {
				float y = mod(position.y - phase * uHeight - uTime * uSpeed, uHeight);

				vec3 pos = vec3(
					position.x,
					y,
					position.z
				);

				vAlpha = smoothstep(0.0, 2.0, y);

				vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
				gl_Position = projectionMatrix * mvPosition;

				// Point size driven by uDropSize uniform
				gl_PointSize = clamp(uDropSize / -mvPosition.z, 6.0, 20.0);
			}
		`,

		fragmentShader: /* glsl */ `
			uniform vec3  uColor;
			uniform float uOpacity;

			varying float vAlpha;

			void main() {
				vec2 uv = gl_PointCoord;

				// Remap to -1..1
				vec2 p = uv * 2.0 - 1.0;

				// Elongate vertically so the drop is tall and thin
				p.y *= 0.35;

				// Squash horizontally even further
				p.x *= 1.8;

				// Shift upward so the pointed tip is at the bottom
				p.y -= 0.3;

				// SDF circle — round top
				float d = length(p);

				// Soft circular mask for the body
				float body = smoothstep(0.55, 0.45, d);

				// Pointed tail: narrow wedge below center
				float tail = smoothstep(0.08, 0.0, abs(uv.x - 0.5))
				           * smoothstep(0.4, 1.0, uv.y);

				float shape = clamp(body + tail, 0.0, 1.0);

				float alpha = shape * vAlpha * uOpacity;

				if (alpha < 0.001) discard;

				// Slightly lighter core for a glassy feel
				vec3 col = mix(uColor * 0.6, uColor, shape);

				gl_FragColor = vec4(col, alpha);
			}
		`
	});

	const rain = new Points(rainGeo, rainMat);

	$effect(() => {
		rainMat.uniforms.uColor.value = theme.value == 'dark' ? DARK_MODE_COLOR : LIGHT_MODE_COLOR;
		rainMat.uniforms.uDropSize.value = theme.value == 'dark' ? 50 : 120;
		rainMat.uniforms.uColor.value.needsUpdate = true; // Ensure shader updates with new color
	});

	const rainOpacity = new Tween(0, { duration: 5000, easing: quadOut });
	let timer: ReturnType<typeof setTimeout>;

	onMount(() => {
		scene.add(rain);
		timer = setTimeout(() => rainOpacity.set(1.0), 1000);
	});

	onDestroy(() => {
		clearTimeout(timer);
		scene.remove(rain);
		rainGeo.dispose();
		rainMat.dispose();
	});

	useTask((delta: number) => {
		rainMat.uniforms.uTime.value += delta;
		rainMat.uniforms.uOpacity.value = rainOpacity.current;
	});
</script>
