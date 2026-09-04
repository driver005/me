import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { m } from '$lib/paraglide/messages';
import { create_video_texture } from '$lib/util/video.svelte';
import { createOutlineMaterial, createSkinnedOutlineMaterial, addOutlineMesh } from '../effects/outline-hull';

// Pinned to the installed three revision so the decoder/transcoder version can never drift out of
// sync with DRACOLoader/KTX2Loader's own JS — same CDN pattern donmccurdy/three-gltf-viewer uses.
const THREE_CDN_BASE = `https://unpkg.com/three@0.${THREE.REVISION}.x/examples/jsm/libs`;
const DRACO_DECODER_PATH = `${THREE_CDN_BASE}/draco/gltf/`;
const BASIS_TRANSCODER_PATH = `${THREE_CDN_BASE}/basis/`;

/** The room model — loads `home-transformed.glb`, wires up material swaps/animations/clock hands. */
export class Room {
	readonly group = new THREE.Group();

	private mixer: THREE.AnimationMixer | null = null;
	private hourHand: THREE.Object3D | null = null;
	private minuteHand: THREE.Object3D | null = null;
	private jointMeshes: THREE.Mesh[] = [];
	private videoDisposers: (() => void)[] = [];
	private friendly = true;
	private disposed = false;
	private onFullyRevealed?: () => void;

	// Shared across every glass/water submesh instead of one material per mesh — the model splits
	// objects into per-material submeshes (SpaceMilk_2..9 etc.), and glass is transmissive, which
	// costs WebGLRenderer a whole extra render pass per unique transmissive material.
	private readonly glassMaterial = new THREE.MeshPhysicalMaterial({
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
		specularColor: new THREE.Color(0xfbfbfb)
	});
	private readonly waterMaterial = new THREE.MeshBasicMaterial({
		color: 0x558bc8,
		transparent: true,
		opacity: 0.4,
		depthWrite: false
	});

	// The original "LeatherCracked" material's shader crashed the WebGL context on at least one
	// GPU/driver (confirmed via gpu-diagnostics.ts's renderer.info at the moment of context loss) — a
	// flat, mapless material sidesteps it.
	private readonly leatherCrackedMaterial = new THREE.MeshStandardMaterial({
		color: 0x4a3728,
		roughness: 0.85,
		metalness: 0
	});

	private readonly outlineMaterial = createOutlineMaterial();
	private readonly outlineMaterialSkinned = createSkinnedOutlineMaterial();

	private ktx2Loader: KTX2Loader;

	constructor(renderer: THREE.WebGLRenderer, onFullyRevealed?: () => void) {
		this.onFullyRevealed = onFullyRevealed;
		this.group.name = 'Room';

		const draco = new DRACOLoader();
		draco.setDecoderPath(DRACO_DECODER_PATH);
		draco.preload();

		this.ktx2Loader = new KTX2Loader();
		this.ktx2Loader.setTranscoderPath(BASIS_TRANSCODER_PATH);
		this.ktx2Loader.detectSupport(renderer);

		const loader = new GLTFLoader();
		loader.setDRACOLoader(draco);
		loader.setKTX2Loader(this.ktx2Loader);
		loader.setMeshoptDecoder(MeshoptDecoder);

		if (import.meta.env.DEV) console.time('[timing] Room GLTF load');

		loader.load(
			m['assets.home_model'](),
			(gltf) => this.onLoad(gltf),
			undefined,
			(err) => console.error('[Room] failed to load GLTF:', err)
		);
	}

	private onLoad(gltf: GLTF): void {
		if (this.disposed) return;

		this.group.add(gltf.scene);

		if (gltf.animations.length > 0) {
			this.mixer = new THREE.AnimationMixer(gltf.scene);
			this.mixer.timeScale = 0.4;
			for (const clip of gltf.animations) this.mixer.clipAction(clip).play();
		}

		gltf.scene.traverse((obj) => {
			// setupNode() adds an outline mesh as a child of `obj`, which traverse() then visits too —
			// skip it, it's not a real room node.
			if (obj.userData.isOutlineHull) return;

			this.setupNode(obj);
			if (obj instanceof THREE.Mesh && obj.material) {
				obj.visible = this.jointMeshes.includes(obj) ? !this.friendly : true;
			}
		});

		if (import.meta.env.DEV) {
			console.timeEnd('[timing] Room GLTF load');
			const counts = Array.from(this.classificationCounts, ([label, n]) => `${label}: ${n}`).join(', ');
			console.log(`[gpu] Room mesh classification counts: ${counts || '(none)'}`);
		}

		this.onFullyRevealed?.();
	}

	/** Material swaps and named-mesh references, matched by material/mesh name substring. */
	private setupNode(obj: THREE.Object3D): void {
		if (obj.userData.isOutlineHull) return;
		if (!(obj instanceof THREE.Mesh) || !obj.material) return;

		obj.castShadow = true;
		obj.receiveShadow = true;

		const material = obj.material as THREE.Material;
		const name = (material.name ?? '').toLowerCase();

		if (name.includes('joint')) {
			this.jointMeshes.push(obj);
			this.countClassification('joint');
		}

		if (name.includes('leathercracked')) {
			obj.material = this.leatherCrackedMaterial;
			this.countClassification('leathercracked (substitute material)');
		} else if (name.includes('glass')) {
			obj.material = this.glassMaterial;
			this.countClassification('glass (shared material)');
		} else if (name.includes('water')) {
			obj.material = this.waterMaterial;
			this.countClassification('water (shared material)');
		} else if (name.includes('tv')) {
			const { texture, dispose } = create_video_texture(m['assets.room_screen_video']());
			this.videoDisposers.push(dispose);
			obj.material = new THREE.MeshBasicMaterial({ map: texture, name: 'tv', transparent: true, opacity: 0.9 });
			this.countClassification('tv (video texture)');
		} else if (name.includes('auxdisplay')) {
			const { texture, dispose } = create_video_texture(m['assets.room_music_player_video']());
			this.videoDisposers.push(dispose);
			obj.material = new THREE.MeshBasicMaterial({ map: texture, name: 'aux', transparent: true, opacity: 0.9 });
			this.countClassification('auxdisplay (video texture)');
		}

		if (name.includes('hour')) this.hourHand = obj;
		if (name.includes('minute')) this.minuteHand = obj;

		// tv/auxdisplay are flat video quads (outline reads wrong on a flat mesh); glass/water use
		// depthWrite: false so the outline's back faces can't occlude correctly against them.
		const skipOutline =
			name.includes('tv') || name.includes('auxdisplay') || name.includes('glass') || name.includes('water');
		if (!skipOutline) addOutlineMesh(obj, this.outlineMaterial, this.outlineMaterialSkinned);
	}

	private classificationCounts = new Map<string, number>();

	private countClassification(label: string): void {
		if (!import.meta.env.DEV) return;
		this.classificationCounts.set(label, (this.classificationCounts.get(label) ?? 0) + 1);
	}

	/** "Safe mode" — hides the model's joint/rig meshes when friendly mode is on. */
	setFriendly(friendly: boolean): void {
		this.friendly = friendly;
		for (const mesh of this.jointMeshes) mesh.visible = !this.friendly;
	}

	loop(delta: number): void {
		this.mixer?.update(delta);

		if (this.hourHand && this.minuteHand) {
			const now = new Date();
			const hours = now.getHours() % 12;
			const minutes = now.getMinutes();
			const seconds = now.getSeconds();
			const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);
			const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);
			this.minuteHand.rotation.y = -minuteAngle;
			this.hourHand.rotation.y = -hourAngle;
		}
	}

	// GPU resources (geometry/material/texture buffers) aren't disposed here individually —
	// HomeEngineRoot.svelte's own cleanup calls renderer.forceContextLoss() right after this, which
	// frees the whole WebGL context (and everything in it) at once. Only non-GPU resources need
	// explicit cleanup: the DOM <video> elements behind video textures, and KTX2Loader's worker pool.
	dispose(): void {
		this.disposed = true;
		this.videoDisposers.forEach((d) => d());
		this.ktx2Loader.dispose();
	}
}
