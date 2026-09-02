// Cursor reveal trail — verbatim from segerman.dev's own bundle
// (static/sites/segerman-dev-86ede42f/root-7944de32/js/world.js): a single-
// channel ping-ponged render target that stamps a soft circular blob at the
// mouse position each active frame and exponentially decays otherwise —
// `existing = texture(tTrail, uv).r * uDecay; stamp = uActive * pow(smoothstep(uStampRadius, 0.0, dist), 2.0);
//  gl_FragColor = vec4(max(existing, stamp), 0, 0, 1)`.
// Their real defaults: uDecay=.995, uStampRadius=.06.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
	void main () {
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

const TRAIL_FRAGMENT = /* glsl */ `
	uniform sampler2D tTrail;
	uniform vec2 uRes;
	uniform vec2 uMouseUV;
	uniform float uDecay;
	uniform float uStampRadius;
	uniform float uActive;

	void main() {
		vec2 uv = gl_FragCoord.xy / uRes;

		float existing = texture2D(tTrail, uv).r * uDecay;

		float dist = length(uv - uMouseUV);
		float stamp = uActive * pow(smoothstep(uStampRadius, 0.0, dist), 2.0);

		gl_FragColor = vec4(max(existing, stamp), 0.0, 0.0, 1.0);
	}
`;

function rt(w: number, h: number) {
	return new THREE.WebGLRenderTarget(w, h, {
		type: THREE.HalfFloatType,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		depthBuffer: false,
		stencilBuffer: false,
	});
}

export class RevealTrail {
	private scene = new THREE.Scene();
	private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	private quad: THREE.Mesh;
	private material: THREE.ShaderMaterial;
	private a: THREE.WebGLRenderTarget;
	private b: THREE.WebGLRenderTarget;
	private res = new THREE.Vector2(512, 256);
	private mouseUV = new THREE.Vector2(0.5, 0.5);
	private active = 0;

	constructor(private renderer: THREE.WebGLRenderer) {
		this.a = rt(this.res.x, this.res.y);
		this.b = rt(this.res.x, this.res.y);

		this.material = new THREE.ShaderMaterial({
			vertexShader: VERTEX,
			fragmentShader: TRAIL_FRAGMENT,
			uniforms: {
				tTrail: { value: null },
				uRes: { value: this.res },
				uMouseUV: { value: this.mouseUV },
				uDecay: { value: 0.995 },
				uStampRadius: { value: 0.06 },
				uActive: { value: 0 },
			},
			depthTest: false,
			depthWrite: false,
		});

		this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
		this.scene.add(this.quad);
	}

	get texture() {
		return this.a.texture;
	}

	setMouse(xNorm: number, yNorm: number, active: boolean) {
		this.mouseUV.set(xNorm, 1 - yNorm);
		this.active = active ? 1 : 0;
	}

	setInactive() {
		this.active = 0;
	}

	step() {
		this.material.uniforms.tTrail.value = this.a.texture;
		this.material.uniforms.uActive.value = this.active;

		const prevTarget = this.renderer.getRenderTarget();
		this.renderer.setRenderTarget(this.b);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(prevTarget);

		[this.a, this.b] = [this.b, this.a];
	}

	dispose() {
		this.a.dispose();
		this.b.dispose();
		this.material.dispose();
		this.quad.geometry.dispose();
	}
}
