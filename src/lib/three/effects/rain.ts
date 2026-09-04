import * as THREE from 'three';

const LIGHT_MODE_COLOR = new THREE.Color('#0a3d8f');
const DARK_MODE_COLOR = new THREE.Color('#7ab8ff');

const RAIN_COUNT = 15000;
const RAIN_AREA = 40;
const RAIN_HEIGHT = 20;
const FADE_IN_DURATION = 5; // seconds — matches extra/rain.svelte's own 5000ms Tween
const FADE_IN_DELAY = 1; // seconds — matches its own 1000ms setTimeout before the tween starts

const vertexShader = /* glsl */ `
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

	gl_PointSize = clamp(uDropSize / -mvPosition.z, 6.0, 20.0);
}`;

const fragmentShader = /* glsl */ `
uniform vec3  uColor;
uniform float uOpacity;

varying float vAlpha;

void main() {
	vec2 uv = gl_PointCoord;
	vec2 p = uv * 2.0 - 1.0;
	p.y *= 0.35;
	p.x *= 1.8;
	p.y -= 0.3;

	float d = length(p);
	float body = smoothstep(0.55, 0.45, d);
	float tail = smoothstep(0.08, 0.0, abs(uv.x - 0.5))
	           * smoothstep(0.4, 1.0, uv.y);

	float shape = clamp(body + tail, 0.0, 1.0);
	float alpha = shape * vAlpha * uOpacity;
	if (alpha < 0.001) discard;

	vec3 col = mix(uColor * 0.6, uColor, shape);
	gl_FragColor = vec4(col, alpha);
}`;

/** /home's rain overlay (weather-gated — see HomeScene.ts's own weatherPromise check, ported from
 *  extra/default.svelte's own `{#await weatherPromise}`) — a shader-point-cloud of falling drops,
 *  fading in over its own first few seconds once constructed. Ported straight from extra/rain.svelte:
 *  same particle math, same fade-in timing, just wrapped in a plain class instead of a component. */
export class Rain {
	private scene: THREE.Scene;
	private points: THREE.Points;
	private material: THREE.ShaderMaterial;
	private geometry: THREE.BufferGeometry;
	private elapsedSinceStart = 0;
	private isDark = false;

	constructor(scene: THREE.Scene) {
		this.scene = scene;

		const positions = new Float32Array(RAIN_COUNT * 3);
		const phases = new Float32Array(RAIN_COUNT);
		for (let i = 0; i < RAIN_COUNT; i++) {
			positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
			positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
			positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
			phases[i] = Math.random();
		}

		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		this.geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

		this.material = new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: THREE.NormalBlending,
			uniforms: {
				uTime: { value: 0 },
				uOpacity: { value: 0 },
				uHeight: { value: RAIN_HEIGHT },
				uSpeed: { value: 6.0 },
				uColor: { value: LIGHT_MODE_COLOR.clone() },
				uDropSize: { value: 120 }
			},
			vertexShader,
			fragmentShader
		});

		this.points = new THREE.Points(this.geometry, this.material);
		scene.add(this.points);
	}

	setDark(isDark: boolean): void {
		this.isDark = isDark;
		this.material.uniforms.uColor.value.copy(isDark ? DARK_MODE_COLOR : LIGHT_MODE_COLOR);
		this.material.uniforms.uDropSize.value = isDark ? 50 : 120;
	}

	loop(delta: number): void {
		this.material.uniforms.uTime.value += delta;

		this.elapsedSinceStart += delta;
		if (this.elapsedSinceStart < FADE_IN_DELAY) return;
		const t = Math.min(1, (this.elapsedSinceStart - FADE_IN_DELAY) / FADE_IN_DURATION);
		// quadOut, matching the original's own Tween easing.
		this.material.uniforms.uOpacity.value = 1 - (1 - t) * (1 - t);
	}

	dispose(): void {
		this.scene.remove(this.points);
		this.geometry.dispose();
		this.material.dispose();
	}
}
