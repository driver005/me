<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import {
		BufferGeometry,
		BufferAttribute,
		Points,
		ShaderMaterial,
		NormalBlending,
		AdditiveBlending,
		Color,
		Vector3
	} from 'three';
	import { onMount, onDestroy } from 'svelte';
	import { mode } from 'mode-watcher';

	interface Props {
		originX?: number;
		originY?: number;
		originZ?: number;
		fillDuration?: number;
		startDelay?: number;
		idleTimeout?: number;
	}

	let {
		originX = $bindable(-0.25),
		originY = $bindable(1.25),
		originZ = $bindable(1.15),
		fillDuration = 60,
		idleTimeout = 120_000
	}: Props = $props();

	const ROOM_W = 3;
	const ROOM_H = 2.5;
	const ROOM_D = 5;
	const HALF_W = ROOM_W / 2;
	const HALF_D = ROOM_D / 2;

	const { scene } = useThrelte();

	const COUNT = 320;

	const aRandom = new Float32Array(COUNT);
	const aPhase = new Float32Array(COUNT);
	const aDestX = new Float32Array(COUNT);
	const aDestY = new Float32Array(COUNT);
	const aDestZ = new Float32Array(COUNT);
	const aCurlDir = new Float32Array(COUNT);
	const aSeed = new Float32Array(COUNT * 2);

	for (let i = 0; i < COUNT; i++) {
		aRandom[i] = Math.random();
		aPhase[i] = Math.random();
		aDestX[i] = (Math.random() - 0.5) * ROOM_W * 0.9;
		aDestY[i] = Math.random() * ROOM_H * 0.92;
		aDestZ[i] = (Math.random() - 0.5) * ROOM_D * 0.9;
		aCurlDir[i] = Math.random() > 0.5 ? 1.0 : -1.0;
		aSeed[i * 2] = Math.random() * 100.0;
		aSeed[i * 2 + 1] = Math.random() * 100.0;
	}

	const dummy = new Float32Array(COUNT * 3);
	const geo = new BufferGeometry();
	geo.setAttribute('position', new BufferAttribute(dummy, 3));
	geo.setAttribute('aRandom', new BufferAttribute(aRandom, 1));
	geo.setAttribute('aPhase', new BufferAttribute(aPhase, 1));
	geo.setAttribute('aDestX', new BufferAttribute(aDestX, 1));
	geo.setAttribute('aDestY', new BufferAttribute(aDestY, 1));
	geo.setAttribute('aDestZ', new BufferAttribute(aDestZ, 1));
	geo.setAttribute('aCurlDir', new BufferAttribute(aCurlDir, 1));
	geo.setAttribute('aSeed', new BufferAttribute(aSeed, 2));

	const mat = new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		depthTest: true,
		blending: NormalBlending,

		uniforms: {
			uTime: { value: 0 },
			uOpacity: { value: 0 },
			uOrigin: { value: new Vector3(originX, originY, originZ) },
			uRoomHalfW: { value: HALF_W },
			uRoomH: { value: ROOM_H },
			uRoomHalfD: { value: HALF_D },
			uDayColor: { value: new Color('#ddd8cf') },
			uNightColor: { value: new Color('#2a3560') },
			uNightBlend: { value: 0 }
		},

		vertexShader: /* glsl */ `
			attribute float aRandom;
			attribute float aPhase;
			attribute float aDestX;
			attribute float aDestY;
			attribute float aDestZ;
			attribute float aCurlDir;
			attribute vec2  aSeed;

			uniform float uTime;
			uniform vec3  uOrigin;
			uniform float uRoomHalfW;
			uniform float uRoomH;
			uniform float uRoomHalfD;

			varying float vAlpha;
			varying float vRandom;
			varying float vSpread;
			varying vec2  vSeed;
			varying float vLifeTime;

			void main() {
				vRandom   = aRandom;
				vSeed     = aSeed;

				float speed = 0.014 + aRandom * 0.016;
				float t     = mod(uTime * speed + aPhase, 1.0);
				vLifeTime   = t;

				float riseFrac   = smoothstep(0.0, 0.40, t);
				float spreadFrac = smoothstep(0.40, 1.0, t);
				vSpread = spreadFrac;

				float curlAngle = uTime * 0.28 * aCurlDir * (0.5 + aRandom * 0.6)
				                  + aPhase * 6.28318;
				float curlR = riseFrac * 0.12 * (0.4 + aRandom * 0.6);

				float riseY = uOrigin.y + riseFrac * uRoomH;
				vec3 risingPos = vec3(
					uOrigin.x + sin(curlAngle) * curlR,
					min(riseY, uRoomH - 0.05),
					uOrigin.z + cos(curlAngle) * curlR * 0.8
				);

				float wobble = uTime * 0.010 * (0.5 + aRandom * 0.5);
				vec3 destPos = vec3(
					aDestX + sin(wobble + aRandom * 6.28)  * 0.10,
					aDestY + cos(wobble * 0.7 + aRandom * 3.14) * 0.08,
					aDestZ + sin(wobble * 0.5 + aRandom * 4.71) * 0.10
				);

				vec3 pos = mix(risingPos, destPos, spreadFrac);
				pos.x = clamp(pos.x, -uRoomHalfW + 0.05, uRoomHalfW - 0.05);
				pos.y = clamp(pos.y, 0.05, uRoomH - 0.05);
				pos.z = clamp(pos.z, -uRoomHalfD + 0.05, uRoomHalfD - 0.05);

				float fadeIn     = smoothstep(0.0, 0.08, t);
				float fadeOut    = smoothstep(1.0, 0.88, t);
				float originMask = smoothstep(0.0, 0.25, spreadFrac);
				vAlpha = fadeIn * fadeOut * (0.15 + originMask * 0.85);

				vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
				gl_Position     = projectionMatrix * mvPosition;

				float growth   = 0.10 + spreadFrac * 3.2;
				float baseSize = (220.0 + aRandom * 360.0) * growth;
				gl_PointSize   = clamp(baseSize / -mvPosition.z, 4.0, 1400.0);
			}
		`,

		fragmentShader: /* glsl */ `
			uniform vec3  uDayColor;
			uniform vec3  uNightColor;
			uniform float uOpacity;
			uniform float uNightBlend;

			varying float vAlpha;
			varying float vRandom;
			varying float vSpread;
			varying vec2  vSeed;
			varying float vLifeTime;

			float hash(vec2 p) {
				return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
			}
			float vnoise(vec2 p) {
				vec2 i = floor(p);
				vec2 f = fract(p);
				vec2 u = f * f * (3.0 - 2.0 * f);
				return mix(
					mix(hash(i),            hash(i + vec2(1,0)), u.x),
					mix(hash(i+vec2(0,1)),  hash(i + vec2(1,1)), u.x),
					u.y
				);
			}
			float fbm(vec2 p) {
				float v = 0.0, a = 0.5;
				mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
				for (int i = 0; i < 4; i++) {
					v += a * vnoise(p);
					p  = rot * p * 2.1;
					a *= 0.5;
				}
				return v;
			}
			float warpedFbm(vec2 p) {
				vec2 q = vec2(fbm(p + vec2(0.0, 0.0)),
				              fbm(p + vec2(5.2, 1.3)));
				return fbm(p + 2.5 * q);
			}

			void main() {
				vec2  uv   = gl_PointCoord - 0.5;
				float dist = length(uv);
				if (dist > 0.5) discard;

				float noiseScale = 2.8 + vRandom * 1.5;
				float scroll     = vLifeTime * (0.05 + vRandom * 0.035);
				vec2  noiseUV    = uv * noiseScale + vSeed + scroll;

				float density = warpedFbm(noiseUV);

				float envelope = exp(-dist * dist * 7.0);
				float softEdge = 1.0 - smoothstep(0.30, 0.50, dist);
				envelope *= softEdge;

				float thresh = 0.22 + vRandom * 0.12;
				float cloud  = smoothstep(thresh, thresh + 0.28, density);
				cloud *= envelope;

				if (cloud < 0.004) discard;

				vec3  base   = mix(uDayColor, uNightColor, uNightBlend);
				float shadow = 0.72 + density * 0.28;
				vec3  col    = base * shadow;

				float nightBoost = mix(1.0, 2.4, uNightBlend);
				float alpha = cloud * vAlpha * uOpacity * 0.82 * nightBoost;

				gl_FragColor = vec4(col, alpha);
			}
		`
	});

	const points = new Points(geo, mat);

	let elapsed = 0;
	let fillProgress = 0;
	let smokeStarted = false;
	let nightCur = 0;
	let opacityTarget = 0.0;

	let idleTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		mat.uniforms.uOrigin.value.set(originX, originY, originZ);
	});

	$effect(() => {
		mat.blending = mode.current == 'dark' ? AdditiveBlending : NormalBlending;
		mat.needsUpdate = true;
	});

	useTask((delta: number) => {
		elapsed += delta;
		mat.uniforms.uTime.value += delta;

		if (smokeStarted) {
			if (fillProgress < 1) {
				fillProgress = Math.min(1, fillProgress + delta / fillDuration);
				const t = fillProgress;
				const baseOpacity = t * t * (3 - 2 * t);
				mat.uniforms.uOpacity.value +=
					(baseOpacity * opacityTarget - mat.uniforms.uOpacity.value) * Math.min(delta * 2.0, 1);
			} else {
				mat.uniforms.uOpacity.value +=
					(opacityTarget - mat.uniforms.uOpacity.value) * Math.min(delta * 2.0, 1);
			}
		} else {
			mat.uniforms.uOpacity.value += (0.0 - mat.uniforms.uOpacity.value) * Math.min(delta * 2.0, 1);
		}

		const nightTarget = mode.current == 'dark' ? 1 : 0;
		nightCur += (nightTarget - nightCur) * Math.min(delta * 1.5, 1);
		mat.uniforms.uNightBlend.value = nightCur;
	});

	function resetSmoke() {
		smokeStarted = false;
		opacityTarget = 0.0;
		fillProgress = 1;

		if (idleTimer) clearTimeout(idleTimer);

		idleTimer = setTimeout(() => {
			smokeStarted = true;
			fillProgress = 0;
			opacityTarget = 1.0;
		}, idleTimeout);
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button === 1) {
			e.preventDefault();
			resetSmoke();
		}
	}

	onMount(() => {
		scene.add(points);
		window.addEventListener('mousedown', onMouseDown);

		resetSmoke();
	});

	onDestroy(() => {
		scene.remove(points);
		window.removeEventListener('mousedown', onMouseDown);
		if (idleTimer) clearTimeout(idleTimer);
		geo.dispose();
		mat.dispose();
	});
</script>
