<script lang="ts">
	import { browser } from '$app/environment';
	import * as THREE from 'three';

	const steps = [
		{
			num: '01',
			title: 'Brief',
			sub: 'Discovery',
			desc: 'Two hours of honest conversation. No decks, no wireframes yet — just questions. What are you trying to do? Who for? By when? What would success look like?',
			tags: ['Workshop', 'Research', 'Strategy'],
			accent: '#FF3B00',
		},
		{
			num: '02',
			title: 'Concept',
			sub: 'Design',
			desc: 'Three directions. One deck. Hard opinions about which is right and why. Typography-first, system-wide, with all the edge cases already solved before we build.',
			tags: ['Identity', 'Type', 'Motion'],
			accent: '#F3F2EE',
		},
		{
			num: '03',
			title: 'Build',
			sub: 'Engineering',
			desc: 'Every component hand-written. Motion choreographed per-element. Code nobody else will read but everyone will feel. Lighthouse 99+. No templates.',
			tags: ['React', 'WebGL', 'Motion'],
			accent: '#FF3B00',
		},
		{
			num: '04',
			title: 'Ship',
			sub: 'Launch',
			desc: 'A quiet Tuesday, then a loud one. Post-launch support, analytics review, and a debrief covering what worked, what didn\'t, and what we do differently next time.',
			tags: ['Deploy', 'CDN', 'Iterate'],
			accent: '#F3F2EE',
		},
	];

	let scrollYProgress = $state(0);

	$effect(() => {
		if (!browser) return;
		const el = document.getElementById('process');
		if (!el) return;
		const onScroll = () => {
			const rect = el.getBoundingClientRect();
			const total = rect.height;
			const scrolled = window.innerHeight - rect.top;
			scrollYProgress = Math.max(0, Math.min(1, scrolled / (total - window.innerHeight)));
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	let windowWidth = $state(0);

	$effect(() => {
		if (!browser) return;
		const update = () => { windowWidth = window.innerWidth; };
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});

	let x = $derived(-scrollYProgress * (steps.length - 1) * windowWidth);

	function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
		if (inMax === inMin) return outMin;
		const t = Math.max(0, Math.min(1, (v - inMin) / (inMax - inMin)));
		return outMin + t * (outMax - outMin);
	}

	function cardStyle(i: number): string {
		const center = i / (steps.length - 1);
		const half = 0.28;
		const p = scrollYProgress;

		// rotateY: linearly maps 18→0→-18 through [center-half, center, center+half]
		const fromRotY = i === 0 ? 0 : 18;
		const toRotY = i === steps.length - 1 ? 0 : -18;
		const rotateY = p <= center
			? mapRange(p, center - half, center, fromRotY, 0)
			: mapRange(p, center, center + half, 0, toRotY);

		// opacity: 4-stop map matching React source
		const fromOp = i === 0 ? 1 : 0.15;
		const toOp = i === steps.length - 1 ? 1 : 0.15;
		let opacity: number;
		if (p <= center - half * 0.4) {
			opacity = mapRange(p, center - half, center - half * 0.4, fromOp, 1);
		} else if (p >= center + half * 0.4) {
			opacity = mapRange(p, center + half * 0.4, center + half, 1, toOp);
		} else {
			opacity = 1;
		}

		// scale: 0.92→1→0.92
		const fromSc = i === 0 ? 1 : 0.92;
		const toSc = i === steps.length - 1 ? 1 : 0.92;
		const scale = p <= center
			? mapRange(p, center - half, center, fromSc, 1)
			: mapRange(p, center, center + half, 1, toSc);

		return `min-width: 100vw; perspective: 1200px; transform: rotateY(${rotateY}deg) scale(${scale}); opacity: ${opacity};`;
	}

	let vincentCanvas: HTMLCanvasElement | null = $state(null);

	const SEEDS = ['alpine', 'coastal', 'forest', 'urban', 'desert', 'aurora', 'moon', 'canyon'];

	const vincentVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

	const vincentFrag = `
uniform float time;
uniform sampler2D tex1;
uniform float scrollDif;
uniform float displace;
uniform float texScale;
uniform float saturate;
varying vec2 vUv;

vec3 rand(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p), s = fract(p);
  vec3 u = smoothstep(0.0, 1.0, s);
  return mix(
    mix(mix(dot(rand(i), s), dot(rand(i+vec3(1,0,0)), s-vec3(1,0,0)), u.x),
        mix(dot(rand(i+vec3(0,1,0)), s-vec3(0,1,0)), dot(rand(i+vec3(1,1,0)), s-vec3(1,1,0)), u.x), u.y),
    mix(mix(dot(rand(i+vec3(0,0,1)), s-vec3(0,0,1)), dot(rand(i+vec3(1,0,1)), s-vec3(1,0,1)), u.x),
        mix(dot(rand(i+vec3(0,1,1)), s-vec3(0,1,1)), dot(rand(i+vec3(1,1,1)), s-vec3(1,1,1)), u.x), u.y),
    u.z);
}

void main() {
  vec4 c = texture2D(tex1, vUv);
  float luma = dot(c.rgb, vec3(0.333));
  vec2 cuv = vUv - 0.5;
  float circle = (0.5 - distance(cuv, vec2(0.0))) * (texScale * 10.0);
  vec2 nuv = vUv - 0.5;
  nuv.xy *= 1.0 + 0.5 * displace - (1.0 - clamp(circle, 0.0, 1.0)) * displace * 0.5;
  nuv.y *= 1.0 - sin(time * 0.001 + vUv.x * 10.1 + luma * 10.1) * scrollDif * 0.01;
  nuv += 0.5;
  vec4 o = texture2D(tex1, nuv);
  float ol = dot(o.rgb, vec3(0.333));
  o.rgb = o.rgb * saturate + (1.0 - ol) * 0.4 * (1.0 - saturate);
  o.rgb *= 1.0 - distance(vUv, vec2(0.5)) * 0.5;
  gl_FragColor = o;
}
`;

	$effect(() => {
		if (!browser || !vincentCanvas) return;
		const canvas = vincentCanvas;

		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
		renderer.setClearColor(0x0F172A, 1);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		let w = window.innerWidth, h = window.innerHeight;
		renderer.setSize(w, h);

		const rt = new THREE.WebGLRenderTarget(
			w * renderer.getPixelRatio(),
			h * renderer.getPixelRatio()
		);

		const mainScene = new THREE.Scene();
		const mainCam = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 0.1, 10);
		mainCam.position.z = 1;

		const loader = new THREE.TextureLoader();
		const meshes: THREE.Mesh[] = [];
		const loadedTextures: THREE.Texture[] = [];

		function buildMesh(i: number) {
			const geo = new THREE.PlaneGeometry(w, h);
			const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
			const mesh = new THREE.Mesh(geo, mat);
			const baseY = i * h - (SEEDS.length - 1) * h / 2;
			mesh.position.set(0, baseY, 0);
			mesh.userData.baseY = baseY;
			mainScene.add(mesh);
			meshes.push(mesh);
			return mesh;
		}

		SEEDS.forEach((seed, i) => {
			const mesh = buildMesh(i);
			loader.load(`https://picsum.photos/seed/${seed}/${Math.round(w * renderer.getPixelRatio())}/${Math.round(h * renderer.getPixelRatio())}`, (tex) => {
				loadedTextures.push(tex);
				(mesh.material as THREE.MeshBasicMaterial).map = tex;
				(mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
				(mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
			});
		});

		const uniforms = {
			time: { value: 0 },
			tex1: { value: rt.texture },
			scrollDif: { value: 0 },
			displace: { value: 0 },
			texScale: { value: 0.15 },
			saturate: { value: 0.6 },
		};

		const shaderMat = new THREE.ShaderMaterial({
			vertexShader: vincentVert,
			fragmentShader: vincentFrag,
			uniforms,
		});

		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMat);
		const effectScene = new THREE.Scene();
		effectScene.add(quad);
		const effectCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
		effectCam.position.z = 1;

		let mouseX = 0.5;
		const onMouseMove = (e: MouseEvent) => {
			mouseX = e.clientX / window.innerWidth;
		};
		window.addEventListener('mousemove', onMouseMove);

		const onResize = () => {
			w = window.innerWidth;
			h = window.innerHeight;
			renderer.setSize(w, h);
			rt.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
			mainCam.left = w / -2; mainCam.right = w / 2;
			mainCam.top = h / 2; mainCam.bottom = h / -2;
			mainCam.updateProjectionMatrix();
			meshes.forEach((m, i) => {
				m.geometry.dispose();
				m.geometry = new THREE.PlaneGeometry(w, h);
				const baseY = i * h - (SEEDS.length - 1) * h / 2;
				m.userData.baseY = baseY;
				m.position.y = baseY;
			});
		};
		window.addEventListener('resize', onResize);

		let rafId: number;
		const loop = () => {
			rafId = requestAnimationFrame(loop);

			const progress = scrollYProgress;
			const scrollY = -progress * SEEDS.length * h;
			const totalH = SEEDS.length * h;

			for (let i = 0; i < meshes.length; i++) {
				const m = meshes[i];
				let y = m.userData.baseY + scrollY;
				y = ((y % totalH) + totalH) % totalH - totalH / 2;
				m.position.y = y;
			}

			renderer.setRenderTarget(rt);
			renderer.render(mainScene, mainCam);
			renderer.setRenderTarget(null);

			uniforms.time.value = performance.now();
			uniforms.displace.value = (mouseX - 0.5) * 0.6;
			uniforms.scrollDif.value = Math.abs(scrollY) * 0.05;
			uniforms.tex1.value = rt.texture;

			renderer.render(effectScene, effectCam);
		};
		rafId = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('resize', onResize);
			meshes.forEach(m => { m.geometry.dispose(); m.material instanceof THREE.Material && m.material.dispose(); });
			loadedTextures.forEach(t => t.dispose());
			shaderMat.dispose();
			quad.geometry.dispose();
			rt.dispose();
			renderer.dispose();
		};
	});
</script>

<section
	id="process"
	data-testid="process-section"
	class="relative text-[#F3F2EE]"
	style="height: {steps.length * 100}vh;"
>
	<div class="sticky top-0 h-screen overflow-hidden">
		<canvas bind:this={vincentCanvas} class="absolute inset-0 w-full h-full" style="z-index: 0;"></canvas>

		<!-- Header strip -->
		<div class="absolute top-0 left-0 right-0 z-20 grid grid-cols-12 border-b border-[#F3F2EE]/20">
			<div class="col-span-6 sm:col-span-3 px-4 sm:px-8 py-4 border-r border-[#F3F2EE]/20">
				<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#F3F2EE]/60">
					§ 05.5 — Process
				</span>
			</div>
			<div class="col-span-6 sm:col-span-6 px-4 sm:px-8 py-4 border-r border-[#F3F2EE]/20">
				<span class="font-mono text-xs uppercase tracking-[0.25em] text-[#F3F2EE]/60">
					How a project actually moves from brief to live
				</span>
			</div>
			<div class="hidden sm:block col-span-3 px-4 sm:px-8 py-4">
				<div class="flex items-center gap-3 h-full">
					<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FF3B00] flex">
						{#each steps as _, i}
							<span
								class="inline-block mx-1"
								style="opacity: {Math.max(0.3, 1 - Math.abs(scrollYProgress * (steps.length - 1) - i) / 2)};"
							>
								{String(i + 1).padStart(2, '0')}
							</span>
						{/each}
					</span>
				</div>
			</div>
		</div>

		<!-- Horizontal track -->
		<div
			class="flex h-full"
			style="padding-top: 53px; transform: translateX({x}px);"
		>
			{#each steps as step, i}
				<div
					class="relative h-full flex items-center justify-center px-4 sm:px-16 md:px-24 border-r border-[#F3F2EE]/10"
					style={cardStyle(i)}
				>
					<!-- Background number -->
					<span
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[28vw] sm:text-[22vw] select-none pointer-events-none"
						style="-webkit-text-stroke: 1px {step.accent}; color: transparent; opacity: 0.06; line-height: 1;"
						aria-hidden="true"
					>
						{step.num}
					</span>

					<div class="relative z-10 max-w-3xl w-full">
						<div class="flex items-center justify-between mb-8 sm:mb-12">
							<span
								class="font-mono text-[10px] uppercase tracking-[0.3em] px-3 py-1.5 border"
								style="border-color: {step.accent}40; color: {step.accent};"
							>
								{step.num} / {String(steps.length).padStart(2, '0')}
							</span>
							<span class="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3F2EE]/40">
								{step.sub}
							</span>
						</div>

						<h2
							class="font-display uppercase tracking-tighter leading-[0.85] text-[#F3F2EE]"
							style="font-size: clamp(4rem, 14vw, 12rem);"
						>
							{step.title}
							<span style="color: {step.accent};">.</span>
						</h2>

						<div class="mt-8 sm:mt-12 h-px w-full" style="background: linear-gradient(to right, {step.accent}, transparent);"></div>

						<div class="mt-8 sm:mt-10 grid grid-cols-12 gap-6">
							<p class="col-span-12 md:col-span-8 font-mono text-base sm:text-lg leading-relaxed text-[#F3F2EE]/80">
								{step.desc}
							</p>
							<ul class="col-span-12 md:col-span-4 flex md:flex-col flex-wrap gap-2 md:items-end">
								{#each step.tags as tag}
									<li
										class="font-mono text-[10px] uppercase tracking-[0.25em] border px-3 py-1.5"
										style="border-color: {step.accent}40; color: {step.accent};"
									>
										{tag}
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
