import{v as C,W as K}from"./vertex.DOAw2tRu.js";import{S as e,g as I,l as F,c as ee}from"./app.8ySn1L4n.js";import{c as te}from"./content.CFZxyfkA.js";import{m as ne,F as L,W as k,N as M,n as D,H as R,a as f,o as p,p as h,q as x,C as u,O as z,e as d,r as oe,j as g,s as y,V as W,L as w,P,t as V,u as re,T as N,k as A,v as S,l as ie,w as ae,x as se}from"./three.core.Cn6S0SYU.js";import{i as le,v as ue}from"./video.BlQOh9uf.js";import{w as ce}from"./workImageVertex.GqdicV0I.js";import"./Layout.astro_astro_type_script_index_0_lang.BYGFA18R.js";function U(){const s=new ne;return s.setAttribute("position",new L([-1,3,0,-1,-1,0,3,-1,0],3)),s.setAttribute("uv",new L([0,2,0,0,2,0],2)),s}function G(s,t,n){const o={read:new k(s,t,n),write:new k(s,t,n),swap:()=>{const r=o.read;o.read=o.write,o.write=r},setSize:(r,i)=>{o.read.setSize(r,i),o.write.setSize(r,i)},dispose:()=>{o.read.dispose(),o.write.dispose()}};return o}const T=`
precision highp float;

in vec3 position;
in vec2 uv;

uniform vec2 texelSize;

out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;

void main () {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);

    gl_Position = vec4(position, 1.0);
}
`,me=`
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;
uniform float value;

in highp vec2 vUv;

out vec4 FragColor;

void main () {
    FragColor = value * texture(uTexture, vUv);
}
`,ve=`
precision highp float;
precision highp sampler2D;

uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

in vec2 vUv;

out vec4 FragColor;

void main () {
    vec2 p = vUv - point.xy;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture(uTarget, vUv).xyz;

    FragColor = vec4(base + splat, 1.0);
}
`,fe=`
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

in vec2 vUv;

out vec4 FragColor;

void main () {
    vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;

    FragColor = dissipation * texture(uSource, coord);
    FragColor.a = 1.0;
}
`,de=`
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uVelocity;

in highp vec2 vUv;
in highp vec2 vL;
in highp vec2 vR;
in highp vec2 vT;
in highp vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uVelocity, vL).x;
    float R = texture(uVelocity, vR).x;
    float T = texture(uVelocity, vT).y;
    float B = texture(uVelocity, vB).y;
    vec2 C = texture(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);

    FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`,he=`
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uVelocity;

in highp vec2 vUv;
in highp vec2 vL;
in highp vec2 vR;
in highp vec2 vT;
in highp vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uVelocity, vL).y;
    float R = texture(uVelocity, vR).y;
    float T = texture(uVelocity, vT).x;
    float B = texture(uVelocity, vB).x;
    float vorticity = R - L - T + B;

    FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`,ge=`
precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;

in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uCurl, vL).x;
    float R = texture(uCurl, vR).x;
    float T = texture(uCurl, vT).x;
    float B = texture(uCurl, vB).x;
    float C = texture(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture(uVelocity, vUv).xy;

    FragColor = vec4(vel + force * dt, 0.0, 1.0);
}
`,pe=`
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;

in highp vec2 vUv;
in highp vec2 vL;
in highp vec2 vR;
in highp vec2 vT;
in highp vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    float C = texture(uPressure, vUv).x;
    float divergence = texture(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;

    FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`,xe=`
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;

in highp vec2 vUv;
in highp vec2 vL;
in highp vec2 vR;
in highp vec2 vT;
in highp vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    vec2 velocity = texture(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);

    FragColor = vec4(velocity, 0.0, 1.0);
}
`;class ye{constructor(t,{simRes:n=128,dyeRes:o=512,iterations:r=3,densityDissipation:i=.97,velocityDissipation:a=.98,pressureDissipation:l=.8,curlStrength:c=20,radius:m=.2}={}){this.renderer=t,this.simRes=n,this.dyeRes=o,this.iterations=r,this.densityDissipation=i,this.velocityDissipation=a,this.pressureDissipation=l,this.curlStrength=c,this.radius=m,this.splats=[],this.density=G(o,o,{type:R,depthBuffer:!1}),this.velocity=G(n,n,{type:R,format:oe,depthBuffer:!1}),this.pressure=G(n,n,{type:R,format:D,magFilter:M,minFilter:M,depthBuffer:!1}),this.divergence=new k(n,n,{type:R,format:D,magFilter:M,minFilter:M,depthBuffer:!1}),this.curl=new k(n,n,{type:R,format:D,magFilter:M,minFilter:M,depthBuffer:!1}),this.uniform={value:this.density.read.texture};const v={value:new f(1/n,1/n)};this.clearMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uTexture:{value:null},value:{value:l}},vertexShader:T,fragmentShader:me,blending:h,depthTest:!1,depthWrite:!1}),this.splatMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uTarget:{value:null},uAspect:{value:1},color:{value:new u},point:{value:new f},radius:{value:1}},vertexShader:T,fragmentShader:ve,blending:h,depthTest:!1,depthWrite:!1}),this.advectionMaterial=new p({glslVersion:x,uniforms:{texelSize:v,dyeTexelSize:{value:new f(1/o,1/o)},uVelocity:{value:null},uSource:{value:null},dt:{value:.016},dissipation:{value:1}},vertexShader:T,fragmentShader:fe,blending:h,depthTest:!1,depthWrite:!1}),this.divergenceMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uVelocity:{value:null}},vertexShader:T,fragmentShader:de,blending:h,depthTest:!1,depthWrite:!1}),this.curlMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uVelocity:{value:null}},vertexShader:T,fragmentShader:he,blending:h,depthTest:!1,depthWrite:!1}),this.vorticityMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uVelocity:{value:null},uCurl:{value:null},curl:{value:c},dt:{value:.016}},vertexShader:T,fragmentShader:ge,blending:h,depthTest:!1,depthWrite:!1}),this.pressureMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uPressure:{value:null},uDivergence:{value:null}},vertexShader:T,fragmentShader:pe,blending:h,depthTest:!1,depthWrite:!1}),this.gradientSubtractMaterial=new p({glslVersion:x,uniforms:{texelSize:v,uPressure:{value:null},uVelocity:{value:null}},vertexShader:T,fragmentShader:xe,blending:h,depthTest:!1,depthWrite:!1}),this.screenCamera=new z(-1,1,1,-1,0,1),this.screenTriangle=U(),this.screen=new d(this.screenTriangle),this.screen.frustumCulled=!1}update(t=1/60){const o=t/.016666666666666666;this.advectionMaterial.uniforms.dt.value=t,this.vorticityMaterial.uniforms.dt.value=t;const r=this.renderer,i=this.simRes,a=this.dyeRes,l=this.iterations,c=this.densityDissipation,m=this.velocityDissipation,v=this.pressureDissipation,E=this.curlStrength,H=this.radius,O=Math.pow(c,o),j=Math.pow(m,o),X=Math.pow(v,o),Y=r.getRenderTarget(),q=r.autoClear;r.autoClear=!1;for(let b=this.splats.length-1;b>=0;b--){const{x:Q,y:Z,dx:$,dy:J}=this.splats.splice(b,1)[0];this.splatMaterial.uniforms.uTarget.value=this.velocity.read.texture,this.splatMaterial.uniforms.point.value.set(Q,Z),this.splatMaterial.uniforms.color.value.set($,J,1),this.splatMaterial.uniforms.radius.value=H/100,this.screen.material=this.splatMaterial,r.setRenderTarget(this.velocity.write),r.render(this.screen,this.screenCamera),this.velocity.swap(),this.splatMaterial.uniforms.uTarget.value=this.density.read.texture,this.screen.material=this.splatMaterial,r.setRenderTarget(this.density.write),r.render(this.screen,this.screenCamera),this.density.swap()}this.curlMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.screen.material=this.curlMaterial,r.setRenderTarget(this.curl),r.render(this.screen,this.screenCamera),this.vorticityMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.vorticityMaterial.uniforms.uCurl.value=this.curl.texture,this.vorticityMaterial.uniforms.curl.value=E,this.screen.material=this.vorticityMaterial,r.setRenderTarget(this.velocity.write),r.render(this.screen,this.screenCamera),this.velocity.swap(),this.divergenceMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.screen.material=this.divergenceMaterial,r.setRenderTarget(this.divergence),r.render(this.screen,this.screenCamera),this.clearMaterial.uniforms.uTexture.value=this.pressure.read.texture,this.clearMaterial.uniforms.value.value=X,this.screen.material=this.clearMaterial,r.setRenderTarget(this.pressure.write),r.render(this.screen,this.screenCamera),this.pressure.swap(),this.pressureMaterial.uniforms.uDivergence.value=this.divergence.texture;for(let b=0;b<l;b++)this.pressureMaterial.uniforms.uPressure.value=this.pressure.read.texture,this.screen.material=this.pressureMaterial,r.setRenderTarget(this.pressure.write),r.render(this.screen,this.screenCamera),this.pressure.swap();this.gradientSubtractMaterial.uniforms.uPressure.value=this.pressure.read.texture,this.gradientSubtractMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.screen.material=this.gradientSubtractMaterial,r.setRenderTarget(this.velocity.write),r.render(this.screen,this.screenCamera),this.velocity.swap(),this.advectionMaterial.uniforms.dyeTexelSize.value.set(1/i,1/i),this.advectionMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.advectionMaterial.uniforms.uSource.value=this.velocity.read.texture,this.advectionMaterial.uniforms.dissipation.value=j,this.screen.material=this.advectionMaterial,r.setRenderTarget(this.velocity.write),r.render(this.screen,this.screenCamera),this.velocity.swap(),this.advectionMaterial.uniforms.dyeTexelSize.value.set(1/a,1/a),this.advectionMaterial.uniforms.uVelocity.value=this.velocity.read.texture,this.advectionMaterial.uniforms.uSource.value=this.density.read.texture,this.advectionMaterial.uniforms.dissipation.value=O,this.screen.material=this.advectionMaterial,r.setRenderTarget(this.density.write),r.render(this.screen,this.screenCamera),this.density.swap(),this.uniform.value=this.density.read.texture,r.autoClear=q,r.setRenderTarget(Y)}destroy(){this.density.dispose(),this.velocity.dispose(),this.pressure.dispose(),this.divergence.dispose(),this.curl.dispose(),this.clearMaterial.dispose(),this.splatMaterial.dispose(),this.advectionMaterial.dispose(),this.divergenceMaterial.dispose(),this.curlMaterial.dispose(),this.vorticityMaterial.dispose(),this.pressureMaterial.dispose(),this.gradientSubtractMaterial.dispose(),this.screenTriangle.dispose();for(const t in this)this[t]=null;return null}}const Be=`
vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 sum = vec4(0.0);

    vec2 texcoord = 1.0 / resolution;

    sum += texture(image, uv - 4.0 * texcoord * direction) * 0.051;
    sum += texture(image, uv - 3.0 * texcoord * direction) * 0.0918;
    sum += texture(image, uv - 2.0 * texcoord * direction) * 0.12245;
    sum += texture(image, uv - 1.0 * texcoord * direction) * 0.1531;
    sum += texture(image, uv) * 0.1633;
    sum += texture(image, uv + 1.0 * texcoord * direction) * 0.1531;
    sum += texture(image, uv + 2.0 * texcoord * direction) * 0.12245;
    sum += texture(image, uv + 3.0 * texcoord * direction) * 0.0918;
    sum += texture(image, uv + 4.0 * texcoord * direction) * 0.051;

    return sum;
}
`,Te=`
in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;

    gl_Position = vec4(position, 1.0);
}
`,we=`
precision highp float;

uniform sampler2D tMap;
uniform float uBluriness;
uniform vec2 uDirection;
uniform vec2 uResolution;

in vec2 vUv;

out vec4 FragColor;

${Be}

void main() {
    FragColor = blur(tMap, vUv, uResolution, uBluriness * uDirection);
}
`;class _ extends p{constructor(t=new f(.5,.5)){super({glslVersion:x,uniforms:{tMap:{value:null},uBluriness:{value:1},uDirection:{value:t},uResolution:{value:new f}},vertexShader:Te,fragmentShader:we,blending:h,depthTest:!1,depthWrite:!1})}}class Ce{constructor(){this.hMat=new _(new f(1,0)),this.vMat=new _(new f(0,1)),this.mesh=new d(U(),this.hMat),this.mesh.frustumCulled=!1}apply(t,n,o,r=1){const i=e.W.renderer,a=e.W.flatCamera;return this.hMat.uniforms.uBluriness.value=r,this.vMat.uniforms.uBluriness.value=r,this.hMat.uniforms.uResolution.value.set(n.width,n.height),this.vMat.uniforms.uResolution.value.set(o.width,o.height),this.hMat.uniforms.tMap.value=t,this.mesh.material=this.hMat,i.setRenderTarget(n),i.render(this.mesh,a),this.vMat.uniforms.tMap.value=n.texture,this.mesh.material=this.vMat,i.setRenderTarget(o),i.render(this.mesh,a),o.texture}applyN(t,n,o,r=2,i=1){let a=this.apply(t,n,o,i);for(let l=1;l<r;l++)a=this.apply(a,n,o,i);return a}}var be=`vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float grainHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float grainNoise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(grainHash(ip),grainHash(ip+vec2(1.0,0.0)),u.x),
    mix(grainHash(ip+vec2(0.0,1.0)),grainHash(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    
    
    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}

float noise2(vec2 p) {
    return 0.5 + 0.5 * snoise(vec3(p, 0.0));
}
vec4 over(vec4 src, vec4 dst) {
    return vec4(src.rgb + dst.rgb * (1.0 - src.a), src.a + dst.a * (1.0 - src.a));
}

vec4 getRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv - offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv + offset);
    return vec4(r.r, g.g, b.b, g.a);
}

vec4 desaturate(vec3 color, float factor){
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, factor), 1.0);
}

varying vec2 vUv;

uniform sampler2D tFront;
uniform sampler2D tBack;
uniform sampler2D tTransFront;
uniform sampler2D tTransBack;
uniform sampler2D tFluid;
uniform vec2 uRes;
uniform float uMode;
uniform float uTime;
uniform float uIsTouch;
uniform float uDirection;
uniform float uWarp;
uniform float uProgressFront;
uniform float uProgressBack;
uniform float uFinalAlpha;
uniform float uTransAlpha;
uniform float uBgOffset;
uniform vec2 uToggleCoords;
uniform float uToggleProgress;

void main() {
    vec2 uv0 = vUv;
    float warp = uWarp;
    float noiseAmt = mix(5., 3.5, uIsTouch);

    vec2 off = vec2(
    uv0.x + sin(uv0.y + uTime * 0.1) * 0.001,
    uv0.y - uTime * 0.5
    );
    float n = snoise(vec3(off, uTime * 0.1) * noiseAmt);

    float axis = mix(uv0.y, uv0.x, uIsTouch);
    float altAxis = mix(uv0.x, uv0.y, uIsTouch);
    float t = mix(axis, 1.0 - axis, uDirection);

    float x = altAxis * 2.0 - 1.0;
    float arc = sqrt(max(0.0, 1.0 - x*x));
    float dirSign = mix(-1.0, 1.0, uDirection);

    
    
    
    
    vec2 uv = uv0;
    vec4 back;
    vec4 front;

    if (warp > 0.0) {
        float bulgeMaskBack = smoothstep(0.0, 0.9, uProgressBack) * (1.0 - smoothstep(0.1, 1.0, uProgressBack));
        float tB = t + dirSign * arc * 0.3 * bulgeMaskBack;
        float edgePosBack = mix(mix(-0.05, -0.3, uDirection), mix(1.3, 1.05, uDirection), uProgressBack) + n * 0.05;
        float edgeBandBack = smoothstep(0.4, 0.0, abs(tB - edgePosBack));

        uv += (n * 0.3) * (edgeBandBack * 0.4 * warp);
        float chroma = edgeBandBack * 0.02 * warp;

        vec2 rUV = uv + vec2(chroma, 0.0);
        vec2 bUV = uv - vec2(chroma, 0.0);

        back = vec4(texture2D(tBack, rUV).r, texture2D(tBack, uv).g, texture2D(tBack, bUV).b, texture2D(tBack, uv).a);
        front = vec4(texture2D(tFront, rUV).r, texture2D(tFront, uv).g, texture2D(tFront, bUV).b, texture2D(tFront, uv).a);
    } else {
        back = texture2D(tBack, uv);
        front = texture2D(tFront, uv);
    }

    
    float bulgeMaskFront = smoothstep(0.0, 0.9, uProgressFront) * (1.0 - smoothstep(0.1, 1.0, uProgressFront));
    float tFrontEdge = t + dirSign * arc * 0.3 * bulgeMaskFront;
    float edgePosFront = mix(mix(-0.05, -0.3, uDirection), mix(1.3, 1.05, uDirection), uProgressFront) + n * 0.05;
    float edgeFront = smoothstep(edgePosFront - 0.02, edgePosFront + 0.01, tFrontEdge);

    
    vec3 fluid = texture2D(tFluid, uv).rgb;
    float intensity = length(fluid);
    float fluidMask = 1.0 - smoothstep(0.001, 0.003, intensity);

    vec4 final = mix(back, front, edgeFront * fluidMask);

    
    
    
    if (uToggleProgress * uMode > 0.0) {
        float aspect = uRes.x / uRes.y;
        vec2 toToggle = vUv - uToggleCoords;
        toToggle.x *= aspect;
        float distToToggle = length(toToggle);

        float blobRadius = (0.085 + n * 0.014) * uToggleProgress * uMode;
        float toggleMask = 1.0 - smoothstep(blobRadius - 0.001, blobRadius + 0.001, distToToggle);

        vec2 windowUV = uv + n * 0.0015 * toggleMask;
        float windowChroma = toggleMask * 0.001 + n * .0001;
        vec4 windowBack = vec4(
        texture2D(tBack, windowUV + vec2(windowChroma, 0.0)).r,
        texture2D(tBack, windowUV).g,
        texture2D(tBack, windowUV - vec2(windowChroma, 0.0)).b,
        1.0
        );

        final = mix(final, windowBack, toggleMask);
    }

    
    
    
    vec3 color;
    if (uFinalAlpha < 1.0) {
        vec4 transBack = texture2D(tTransBack, uv);
        vec4 transFront = texture2D(tTransFront, uv);
        vec4 trans = mix(transBack, transFront, fluidMask);

        float bgWidth = mix(.8, 1., uBgOffset);
        float hMask = step(0.5 - bgWidth * 0.5, uv.x) * step(uv.x, 0.5 + bgWidth * 0.5);
        float bgMask = step(uv.y, uBgOffset) * hMask;
        color = mix(trans.rgb * uTransAlpha, final.rgb, bgMask);
        color = mix(color, final.rgb, uFinalAlpha);
    } else {
        color = final.rgb;
    }

    gl_FragColor = vec4(color, 1.0);
}`;class Me{constructor(){this.texture=null;const t={x:(e.width-30)/e.width,y:1-30/e.height};this.uniforms={tFront:e.W.uniforms.tFront,tBack:e.W.uniforms.tBack,tTransFront:e.W.uniforms.tTransFront,tTransBack:e.W.uniforms.tTransBack,uTransAlpha:{value:0},uFinalAlpha:{value:1},uBgOffset:{value:0},tFluid:e.W.uniforms.tFluid,uIsTouch:e.W.uniforms.uIsTouch,uTime:e.W.uniforms.uTime,uRes:e.W.uniforms.uRes,uMode:e.W.uniforms.uMode,uWarp:{value:0},uDirection:{value:0},uProgressFront:{value:0},uProgressBack:{value:0},uToggleCoords:{value:new f(t.x,t.y)},uToggleProgress:{value:0}};const n=new g({fragmentShader:be,vertexShader:C,uniforms:this.uniforms});this.mesh=new d(e.W.fullScreenTriangle,n),this.mesh.frustumCulled=!1,this.ready=!0}loop(t,n){if(!this.ready)return;const o=e.W.renderer,r=e.W.flatCamera;o.setRenderTarget(null),o.render(this.mesh,r)}}var Re=`vec4 over(vec4 src, vec4 dst) {
    return vec4(src.rgb + dst.rgb * (1.0 - src.a), src.a + dst.a * (1.0 - src.a));
}

vec4 getRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv - offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv + offset);
    return vec4(r.r, g.g, b.b, g.a);
}

vec4 desaturate(vec3 color, float factor){
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, factor), 1.0);
}

varying vec2 vUv;

uniform sampler2D tStars;
uniform sampler2D tPlanet;
uniform sampler2D tPlanetBlur;
uniform sampler2D tFog;
uniform sampler2D tTitlesSoft;
uniform sampler2D tTitlesBlur;
uniform sampler2D tTexts;
uniform sampler2D tImagesBack;
uniform sampler2D tImagesBackBloom;
uniform sampler2D tVideo;
uniform sampler2D tFluid;
uniform sampler2D tNoise;
uniform sampler2D tTransBackContent;

uniform float uFogFloor;
uniform float uFogColorStr;
uniform float uBloomTint;
uniform float uBloomTintThreshold;
uniform float uBloomBleed;
uniform float uGlowStrength;
uniform float uGlowFogDull;
uniform float uOnPlaneBloom;
uniform float uFogAmbient;
uniform float uFogDistort;
uniform float uFogDistortMin;
uniform float uFogDistortMax;
uniform float uProjMaskMin;
uniform float uProjMaskMax;
uniform float uCentreProxMin;
uniform float uCentreProxMax;
uniform float uFogErosionEdge;
uniform float uFogErosionCentre;
uniform float uMediaCurveEdge;
uniform float uSmokeBrightness;
uniform float uSmokeFogMod;
uniform float uSmokeDesat;
uniform float uStarsRGB;
uniform float uFogRGB;
uniform float uImagesRGB;
uniform float uVideoRGB;
uniform float uTransProgress;

uniform float uIsMobile;
uniform float uIsTouch;
uniform vec2 uRes;
uniform vec3 uTextColor;
uniform vec3 uLabelColor;
uniform float uMode;
uniform float uTime;
uniform float uDpr;
uniform float uIsBackMode;
uniform float uGrainAmount;
uniform float uHasFog;
uniform float uPlanetBlurAmt;

uniform vec4 uInfoGlow;
uniform vec2 uInfoGlowOffset;
uniform float uInfoGlowSoftness;
uniform vec3 uInfoGlowColor;

vec4 getTitlesRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    float aR = texture2D(image, uv + offset).a;
    float aG = texture2D(image, uv).a;
    float aB = texture2D(image, uv - offset).a;
    float a = max(aR, max(aG, aB));
    return vec4(aR, aG, aB, a);
}

vec3 getTextsRGB(vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    vec4 tR = texture2D(tTexts, uv + offset);
    vec4 tG = texture2D(tTexts, uv);
    vec4 tB = texture2D(tTexts, uv - offset);

    vec3 cR = uTextColor * tR.r + uLabelColor * tR.g;
    vec3 cG = uTextColor * tG.r + uLabelColor * tG.g;
    vec3 cB = uTextColor * tB.r + uLabelColor * tB.g;

    return vec3(cR.r, cG.g, cB.b);
}

float grain(vec2 uv, float t) {
    vec3 p = vec3(uv, t);
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z) - 0.5;
}

float burnFBM(vec2 p) {
    float v = 0., a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * texture2D(tNoise, p / 100. + uTime * 0.001).r;
        p *= 2.2; a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUv;

    float mode = 1. - uMode;

    vec4 fluid = texture(tFluid, uv);
    float intensity = length(fluid.rg);

    
    vec4 bg = vec4(0.);

    
    vec4 stars = getRGB(tStars, uv, .1, uStarsRGB);
    vec3 col = stars.rgb;

    
    vec4 planet = texture2D(tPlanet, uv);
    vec4 planetBlur = texture2D(tPlanetBlur, uv);
    col += (planetBlur.rgb * 1.5) * uPlanetBlurAmt;
    col = mix(col, planet.rgb, planet.a);

    
    vec2 glowD = uv - (uInfoGlow.xy + uInfoGlowOffset);
    glowD.x *= uRes.x / uRes.y;
    float glowDist = length(glowD) / max(uInfoGlow.z, 1e-4);
    float infoGlow = (1.0 - smoothstep(1.0 - uInfoGlowSoftness, 1.0, glowDist)) * uInfoGlow.w;
    col += uInfoGlowColor * infoGlow;

    vec2 imageUv = mix(uv - fluid.rg * .0001, uv, uMode);
    float imageChroma = mix(intensity * .1, 0., uMode);
    vec3 images = getRGB(tImagesBack, imageUv, -.5, (uImagesRGB + .0002 * imageChroma)).rgb;
    vec3 imagesBloom = texture2D(tImagesBackBloom, imageUv).rgb;
    float bloomLum = dot(imagesBloom, vec3(0.299, 0.587, 0.114));
    float imagesAlpha = texture2D(tImagesBack, imageUv).a;

    vec4 fogT = mix(vec4(0.), getRGB(tFog, uv, .1, uFogRGB), uHasFog);
    float fog = fogT.a;
    fog = max(fog, uFogFloor);

    vec3 fogColor = mix(fogT.rgb * uFogColorStr, imagesBloom * uBloomTint, smoothstep(0.01, uBloomTintThreshold, bloomLum));
    vec3 litFog = fogColor * fog;

    vec3 bloomBleed = imagesBloom.rgb * uBloomBleed;
    litFog += bloomBleed;
    litFog = max(litFog, fogT.rgb * uFogAmbient);

    float projectionMask = smoothstep(uProjMaskMin, uProjMaskMax, bloomLum);

    float centreProximity = 1.0 - abs(uv.y - 0.5) * 2.0;
    centreProximity = smoothstep(uCentreProxMin, uCentreProxMax, centreProximity);

    float fogEdgeNoise = (fogT.a - 0.5) * 0.3;
    centreProximity = clamp(centreProximity + fogEdgeNoise, 0.0, 1.0);
    centreProximity = mix(1.0, centreProximity, uHasFog);

    float noisySoften = fogEdgeNoise * (1.0 - centreProximity);

    float erosionCentre = clamp(uFogErosionCentre + fogEdgeNoise, 0.0, 1.0);
    float fogErosion = 1.0 - fog * mix(uFogErosionEdge, erosionCentre, centreProximity);

    float imagesVisibility = imagesAlpha * projectionMask * fogErosion;

    vec3 smokyScene = images * (uSmokeBrightness + fog * uSmokeFogMod);
    float grey = dot(smokyScene, vec3(0.299, 0.587, 0.114));
    smokyScene = mix(smokyScene, vec3(grey), fog * uSmokeDesat);

    vec3 imagesCol = mix(smokyScene, images, centreProximity);
    float fogCover = fog * (1.0 - centreProximity) * imagesAlpha;
    float fogOverMedia = (1.0 - centreProximity) * fog * imagesAlpha * 0.3;

    vec3 backCol = col;
    backCol = mix(backCol, litFog, fog);
    backCol = mix(backCol, imagesCol, imagesVisibility);
    
    
    backCol += imagesBloom.rgb * imagesVisibility * centreProximity * uOnPlaneBloom;
    backCol = mix(backCol, litFog, fogCover);
    backCol = mix(backCol, litFog, fogOverMedia);

    
    
    
    float glowHalo = 1.0 - imagesAlpha;
    float glowFogDull = mix(1.0, uGlowFogDull, fog);
    backCol += imagesBloom.rgb * glowHalo * centreProximity * uGlowStrength * glowFogDull;

    vec3 frontCol = col;
    frontCol = mix(frontCol, litFog, fog);
    frontCol = mix(frontCol, imagesCol, imagesAlpha);

    col = mix(backCol, frontCol, uMode);

    
    vec2 titleUv = mix(uv - fluid.rg * .00007, uv, uMode);
    float titleChroma = mix(intensity * .05, 0., uMode);
    vec4 titlesSoft = getTitlesRGB(tTitlesSoft, titleUv, -1., .001 + .0005 * titleChroma);
    vec4 titlesBlur = getTitlesRGB(tTitlesBlur, titleUv, 1., .001 + .001 * titleChroma);
    col += titlesBlur.rgb * .35;
    col = mix(col, titlesSoft.rgb, titlesSoft.a);

    
    vec2 textUv = mix(uv - fluid.rg * .00003, uv, uMode);
    float textChroma = mix(intensity * .03, 0., uMode);
    vec3 type = getTextsRGB(textUv, 0., .001 * textChroma);
    col += type;

    float winGain = .2;
    float refract = 0.;
    float backTint = 0.;
    float autoContrast = .2;
    float uChroma = 2.;
    float tint = 0.;

    
    float win = clamp(winGain, 0., 1.);

    
    vec2 videoUv = uv - fluid.rg * mix(.00012, refract * win, uMode);

    
    float videoChroma = mix(intensity * .3, win * uChroma, uMode);
    vec4 video = getRGB(tVideo, videoUv, -.5, mix(.001, .0015, uMode) + .0002 * videoChroma);

    
    float lum    = dot(video.rgb, vec3(0.299, 0.587, 0.114));
    vec3  chroma = video.rgb - lum;

    
    float frontLum = mix(lum * 1.4, 1.0 - lum, win * autoContrast);
    vec3  videoFrontCol = chroma + frontLum;

    
    videoFrontCol = mix(videoFrontCol,
    1.0 - (1.0 - videoFrontCol) * (1.0 - backTint),
    win * tint);

    vec3 videoCol = mix(video.rgb, videoFrontCol, uMode);
    col = mix(col, videoCol, video.a);

    float grainy = grain(uv * 2.4, uTime * .000003) * uGrainAmount * uDpr;

    

    float aspect =  uRes.y / uRes.x;
    vec2 burnUv = uv;
    burnUv.y *= mix(1.0, aspect, uIsMobile);
    float bn       = burnFBM(burnUv * 5.);
    float burned   = step(bn, uTransProgress);
    float guard    = step(0.001, uTransProgress);
    float glowBand = smoothstep(uTransProgress + mix(0.001, .05, uTransProgress), uTransProgress + 0.001, bn) * (1.0 - burned) * guard;
    float charBand = smoothstep(uTransProgress + mix(0.001, .05, uTransProgress), uTransProgress,        bn) * (1.0 - burned) * guard;
    vec3  burnEdge = mix(col, col, uTransProgress);

    vec4 transContent = texture2D(tTransBackContent, uv);
    transContent.rgb = mix(transContent.rgb, burnEdge * 2.0, glowBand);
    transContent.a *= (1.0 - burned) * guard;
    transContent.a *= mix(1., .0, uTransProgress);

    col = mix(col, transContent.rgb, transContent.a);

    
    col += grainy;

    gl_FragColor = vec4(col, 1.);
}`,Se=`vec4 over(vec4 src, vec4 dst) {
    return vec4(src.rgb + dst.rgb * (1.0 - src.a), src.a + dst.a * (1.0 - src.a));
}

vec4 getRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv - offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv + offset);
    return vec4(r.r, g.g, b.b, g.a);
}

vec4 desaturate(vec3 color, float factor){
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, factor), 1.0);
}

varying vec2 vUv;

uniform sampler2D tStars;
uniform sampler2D tPlanet;
uniform sampler2D tPlanetBlur;
uniform sampler2D tFog;
uniform sampler2D tTitlesSoft;
uniform sampler2D tTitlesBlur;
uniform sampler2D tTexts;
uniform sampler2D tImagesBack;
uniform sampler2D tImagesBackBloom;
uniform sampler2D tVideo;
uniform sampler2D tFluid;

uniform float uFogFloor;
uniform float uFogColorStr;
uniform float uBloomTint;
uniform float uBloomTintThreshold;
uniform float uBloomBleed;
uniform float uGlowStrength;
uniform float uGlowFogDull;
uniform float uOnPlaneBloom;
uniform float uFogAmbient;
uniform float uFogDistort;
uniform float uFogDistortMin;
uniform float uFogDistortMax;
uniform float uProjMaskMin;
uniform float uProjMaskMax;
uniform float uCentreProxMin;
uniform float uCentreProxMax;
uniform float uFogErosionEdge;
uniform float uFogErosionCentre;
uniform float uMediaCurveEdge;
uniform float uSmokeBrightness;
uniform float uSmokeFogMod;
uniform float uSmokeDesat;
uniform float uStarsRGB;
uniform float uFogRGB;
uniform float uImagesRGB;
uniform float uVideoRGB;

uniform vec2 uRes;
uniform vec3 uTextColor;
uniform vec3 uLabelColor;
uniform float uMode;
uniform float uTime;
uniform float uDpr;
uniform float uIsBackMode;
uniform float uGrainAmount;
uniform float uHasFog;
uniform vec4 uInfoGlow;
uniform vec2 uInfoGlowOffset;
uniform float uInfoGlowSoftness;
uniform vec3 uInfoGlowColor;

vec4 getTitlesRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    float aR = texture2D(image, uv + offset).a;
    float aG = texture2D(image, uv).a;
    float aB = texture2D(image, uv - offset).a;
    float a = max(aR, max(aG, aB));

    return vec4(aR, aG, aB, a);
}

vec3 getTextsRGB(vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    vec4 tR = texture2D(tTexts, uv + offset);
    vec4 tG = texture2D(tTexts, uv);
    vec4 tB = texture2D(tTexts, uv - offset);

    vec3 cR = uTextColor * tR.r + uLabelColor * tR.g;
    vec3 cG = uTextColor * tG.r + uLabelColor * tG.g;
    vec3 cB = uTextColor * tB.r + uLabelColor * tB.g;

    return vec3(cR.r, cG.g, cB.b);
}

float grain(vec2 uv, float t) {
    vec3 p = vec3(uv, t);
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z) - 0.5;
}

void main() {
    vec2 uv = vUv;

    float mode = 1. - uMode;

    vec4 fluid = texture(tFluid, uv);
    float intensity = length(fluid.rg);

    
    vec4 bg = vec4(0.);

    
    vec4 stars = getRGB(tStars, uv, .1, uStarsRGB);
    vec3 col = stars.rgb;

    
    vec4 planet = texture2D(tPlanet, uv);
    vec4 planetBlur = texture2D(tPlanetBlur, uv);
    col += planetBlur.rgb * 1.5;
    col = mix(col, planet.rgb, planet.a);

    
    
    
    vec2 glowD = uv - (uInfoGlow.xy + uInfoGlowOffset);
    glowD.x *= uRes.x / uRes.y;
    float glowDist = length(glowD) / max(uInfoGlow.z, 1e-4);
    float infoGlow = (1.0 - smoothstep(1.0 - uInfoGlowSoftness, 1.0, glowDist)) * uInfoGlow.w;
    col += uInfoGlowColor * infoGlow;

    
    vec2 imageUv = mix(uv - fluid.rg * .0001, uv, uMode);
    float imageChroma = mix(intensity * .1, 0., uMode);
    vec3 images = getRGB(tImagesBack, imageUv, -.5, uImagesRGB + .0002 * imageChroma).rgb;
    vec3 imagesBloom = texture2D(tImagesBackBloom, imageUv).rgb;
    float imagesBloomA = texture2D(tImagesBackBloom, imageUv).a;
    float bloomLum = dot(imagesBloom, vec3(0.299, 0.587, 0.114));
    float imagesAlpha = texture2D(tImagesBack, imageUv).a;

    vec4 fogT = mix(vec4(0.), getRGB(tFog, uv, .1, uFogRGB), uHasFog);
    float fog = fogT.a;
    fog = max(fog, uFogFloor);

    vec3 fogColor = mix(fogT.rgb * uFogColorStr, imagesBloom * uBloomTint, smoothstep(0.01, uBloomTintThreshold, bloomLum));
    vec3 litFog = fogColor * fog;

    vec3 bloomBleed = imagesBloom.rgb * uBloomBleed;
    litFog += bloomBleed;
    litFog = max(litFog, fogT.rgb * uFogAmbient);

    float projectionMask = smoothstep(uProjMaskMin, uProjMaskMax, bloomLum);

    float centreProximity = 1.0 - abs(uv.y - 0.5) * 2.0;
    centreProximity = smoothstep(uCentreProxMin, uCentreProxMax, centreProximity);

    float fogEdgeNoise = (fogT.a - 0.5) * 0.3;
    centreProximity = clamp(centreProximity + fogEdgeNoise, 0.0, 1.0);
    centreProximity = mix(1.0, centreProximity, uHasFog);

    float noisySoften = fogEdgeNoise * (1.0 - centreProximity);

    float erosionCentre = clamp(uFogErosionCentre + fogEdgeNoise, 0.0, 1.0);
    float fogErosion = 1.0 - fog * mix(uFogErosionEdge, erosionCentre, centreProximity);

    float imagesVisibility = imagesAlpha * projectionMask * fogErosion;

    vec3 smokyScene = images * (uSmokeBrightness + fog * uSmokeFogMod);
    float grey = dot(smokyScene, vec3(0.299, 0.587, 0.114));
    smokyScene = mix(smokyScene, vec3(grey), fog * uSmokeDesat);

    vec3 imagesCol = mix(smokyScene, images, centreProximity);
    float fogCover = fog * (1.0 - centreProximity) * imagesAlpha;
    float fogOverMedia = (1.0 - centreProximity) * fog * imagesAlpha * 0.3;

    vec3 backCol = col;
    backCol = mix(backCol, litFog, fog);
    backCol = mix(backCol, imagesCol, imagesVisibility);
    
    
    
    backCol += imagesBloom.rgb * imagesVisibility * centreProximity * uOnPlaneBloom;
    backCol = mix(backCol, litFog, fogCover);
    backCol = mix(backCol, litFog, fogOverMedia);

    float glowHalo = 1.0 - imagesAlpha;
    float glowFogDull = mix(1.0, uGlowFogDull, fog);
    backCol += imagesBloom.rgb * glowHalo * centreProximity * uGlowStrength * glowFogDull;

    vec3 frontCol = col;
    frontCol = mix(frontCol, litFog, fog);
    frontCol = mix(frontCol, imagesCol, imagesAlpha);

    col = mix(backCol, frontCol, uMode);

    
    vec2 titleUv = mix(uv - fluid.rg * .00007, uv, uMode);
    float titleChroma = mix(intensity * .05, 0., uMode);
    vec4 titlesSoft = getTitlesRGB(tTitlesSoft, titleUv, -1., .001 + .0005 * titleChroma);
    vec4 titlesBlur = getTitlesRGB(tTitlesBlur, titleUv, 1., .001 + .001 * titleChroma);
    col += titlesBlur.rgb * .35;
    col = mix(col, titlesSoft.rgb, titlesSoft.a);

    
    vec2 textUv = mix(uv - fluid.rg * .00003, uv, uMode);
    float textChroma = mix(intensity * .03, 0., uMode);
    vec3 type = getTextsRGB(textUv, 0., .001 * textChroma);
    col += type;

    
    vec2 videoUv = mix(uv - fluid.rg * .0002, uv, uMode);
    float videoChroma = mix(intensity * .3, 0., uMode);
    vec4 video = getRGB(tVideo, videoUv, -.5, .001 + .0002 * videoChroma);
    float frontLum = dot(video.rgb, vec3(0.299, 0.587, 0.114));
    vec3 videoFrontCol = mix(vec3(frontLum), video.rgb, 1.2) * 1.4;
    vec3 videoCol = mix(video.rgb, videoFrontCol, uMode);

    col = mix(col, videoCol, video.a);

    
   

    float coverage = 0.;
    
    coverage = max(coverage, imagesAlpha);
    coverage = max(coverage, smoothstep(0., 0.08, bloomLum));

    
    coverage = max(coverage, infoGlow * 5.);

    
    coverage = max(coverage, titlesSoft.a);
    coverage = max(coverage, titlesBlur.a * 5.);

    
    coverage = max(coverage, clamp(length(type) * 5.0, 0., 1.));

    
    coverage = max(coverage, video.a);

    
    gl_FragColor = vec4(col, coverage);
}`;class B{constructor(){this.needsRender=!0}dirty(){this.needsRender=!0}render(){}loop(){if(e.isTouch){this.render();return}this.needsRender&&(this.render(),this.needsRender=!1)}}class ke extends B{constructor(){super(),this.lastRender=0,this.idleInterval=1e3/15,this.scale=()=>e.isMobile?e.dpr:Math.min(e.dpr,e.isSafari?1.4:1.5),this.scaleFront=()=>Math.min(e.dpr,e.isSafari?1:1.25),this.rt=e.W.createRT(this.scale),this.frontRt=e.W.createRT(this.scaleFront),this.transRt=e.W.createRT(this.scale),this.glowStr={home:.9,work:.4,info:.1,error:0},this.uniforms={uMode:e.W.uniforms.uMode,tFluid:e.W.uniforms.tFluid,tStars:e.W.uniforms.tStars,tPlanet:e.W.uniforms.tPlanet,tPlanetBlur:e.W.uniforms.tPlanetBlur,tFog:e.W.uniforms.tFog,tTexts:e.W.uniforms.tTexts,tTitlesSoft:e.W.uniforms.tTitlesSoft,tTitlesBlur:e.W.uniforms.tTitlesBlur,tImagesBack:e.W.uniforms.tImagesBack,tImagesBackBloom:e.W.uniforms.tImagesBackBloom,tVideo:e.W.uniforms.tVideo,uTime:e.W.uniforms.uTime,uRes:e.W.uniforms.uRes,uDpr:e.W.uniforms.uDpr,uIsMobile:e.W.uniforms.uIsMobile,uIsTouch:e.W.uniforms.uIsTouch,uHasFog:e.W.uniforms.uHasFog,tNoise:e.W.uniforms.tNoise,tTransBack:e.W.uniforms.tTransBack,tTransBackContent:e.W.uniforms.tTransBackContent,uTextColor:{value:e.W.colors.base.white},uLabelColor:{value:e.W.colors.base.grey},uGrainAmount:{value:e.isSafari||e.isMobile?.02:.025},uFogFloor:{value:.3},uFogColorStr:{value:1.9},uBloomTint:{value:.01},uBloomTintThreshold:{value:.95},uBloomBleed:{value:.6},uGlowStrength:{value:1},uGlowFogDull:{value:.05},uOnPlaneBloom:{value:.3},uFogAmbient:{value:2},uProjMaskMin:{value:0},uProjMaskMax:{value:0},uCentreProxMin:{value:0},uCentreProxMax:{value:.8},uFogErosionEdge:{value:.9},uFogErosionCentre:{value:.1},uMediaCurveEdge:{value:1.5},uSmokeBrightness:{value:.7},uSmokeFogMod:{value:.6},uSmokeDesat:{value:.3},uStarsRGB:{value:.001},uImagesRGB:{value:.001},uVideoRGB:{value:.001},uFogRGB:{value:.007},uTransProgress:{value:0},uPlanetBlurAmt:{value:1}},this.material=new g({fragmentShader:Re,vertexShader:C,uniforms:this.uniforms}),this.mesh=new d(e.W.fullScreenTriangle,this.material),this.mesh.frustumCulled=!1,this.contentRt=e.W.createRT(this.scale),this.contentMaterial=new g({fragmentShader:Se,vertexShader:C,uniforms:this.uniforms,transparent:!0,blending:h}),this.contentMesh=new d(e.W.fullScreenTriangle,this.contentMaterial),this.contentMesh.frustumCulled=!1,this.ready=!0,this.initControls()}getTransContent(){const t=e.W.renderer,n=e.W.flatCamera;t.setRenderTarget(this.contentRt);const o=t.getClearAlpha();t.setClearAlpha(0),t.clear(),t.setClearAlpha(o),t.render(this.contentMesh,n),e.W.uniforms.tTransBackContent.value=this.contentRt.texture}initControls(){if(!e.W.gui)return;const t=this.uniforms,n=e.W.gui,o=n.addFolder("Fog");o.add(t.uFogFloor,"value",0,1,.01).name("Floor"),o.add(t.uFogColorStr,"value",0,2,.01).name("Color Strength"),o.add(t.uFogAmbient,"value",0,2,.01).name("Ambient"),o.add(t.uFogRGB,"value",0,.02,.001).name("Fog RGB Shift");const r=n.addFolder("Bloom");r.add(t.uBloomTint,"value",0,3,.01).name("Tint"),r.add(t.uBloomTintThreshold,"value",0,1,.01).name("Tint Threshold"),r.add(t.uBloomBleed,"value",0,1,.01).name("Bleed"),r.add(t.uGlowStrength,"value",0,3,.01).name("Centre Glow"),r.add(t.uGlowFogDull,"value",0,1,.01).name("Glow Fog Dull"),r.add(t.uOnPlaneBloom,"value",0,1,.01).name("On-plane Bloom");const i=n.addFolder("Media");i.add(t.uProjMaskMin,"value",0,.5,.01).name("Proj Mask Min"),i.add(t.uProjMaskMax,"value",0,1,.01).name("Proj Mask Max"),i.add(t.uFogErosionEdge,"value",0,1,.01).name("Fog Erosion Edge"),i.add(t.uFogErosionCentre,"value",0,1,.01).name("Fog Erosion Centre"),i.add(t.uMediaCurveEdge,"value",0,2,.01).name("Curve Edge"),i.add(t.uSmokeBrightness,"value",0,2,.01).name("Smoke Brightness"),i.add(t.uSmokeFogMod,"value",0,2,.01).name("Smoke Fog Mod"),i.add(t.uSmokeDesat,"value",0,1,.01).name("Smoke Desat"),i.add(t.uImagesRGB,"value",0,.02,.001).name("Images RGB Shift"),i.add(t.uVideoRGB,"value",0,.02,.001).name("Video RGB Shift");const a=n.addFolder("Centre Proximity");a.add(t.uCentreProxMin,"value",0,1,.01).name("Min"),a.add(t.uCentreProxMax,"value",0,1,.01).name("Max");const l=n.addFolder("FX");l.add(t.uGrainAmount,"value",0,.5,.01).name("Grain Amount"),l.add(t.uStarsRGB,"value",0,.02,.001).name("Stars RGB Shift")}setGlowStr(){this.glowStr[e.router.pageId]&&(this.uniforms.uGlowStrength.value=this.glowStr[e.router.pageId])}getTransTexture(){const t=e.W.renderer,n=e.W.flatCamera;t.setRenderTarget(this.transRt),t.render(this.mesh,n),e.W.uniforms.tTransBack.value=this.transRt.texture}render(t,n){if(!this.ready)return;const o=e.W.renderer,r=e.W.flatCamera;let i=e.isBackMode?this.rt:this.frontRt;o.setRenderTarget(i),o.render(this.mesh,r),e.W.uniforms.tBack.value=i.texture}loop(t){if(e.isBackMode||e.isTouch){this.render(),this.lastRender=t,this.needsRender=!1;return}const n=this.needsRender?0:this.idleInterval;t-this.lastRender<n||(this.render(),this.lastRender=t,this.needsRender=!1)}}var Fe=`vec4 over(vec4 src, vec4 dst) {
    return vec4(src.rgb + dst.rgb * (1.0 - src.a), src.a + dst.a * (1.0 - src.a));
}

vec4 getRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv - offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv + offset);
    return vec4(r.r, g.g, b.b, g.a);
}

vec4 desaturate(vec3 color, float factor){
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, factor), 1.0);
}

varying vec2 vUv;

uniform sampler2D tTitles;
uniform sampler2D tTexts;
uniform sampler2D tImagesFront;
uniform sampler2D tVideo;
uniform sampler2D tFluid;
uniform float uBgOffset;

uniform vec2 uRes;
uniform vec3 uTextColor;
uniform vec3 uLabelColor;
uniform float uTime;
uniform float uIsBackMode;

void main() {
    vec2 uv = vUv;

    float bgWidth = mix(.8, 1., uBgOffset);
    float hMask = step(0.5 - bgWidth * 0.5, uv.x) * step(uv.x, 0.5 + bgWidth * 0.5);
    float bgMask = step(uv.y, uBgOffset) * hMask;
    vec4 bg = vec4(1., 1., 1., bgMask);

    
    vec4 titles = texture2D(tTitles, uv);
    vec4 texts = texture2D(tTexts, uv);
    vec4 images = texture2D(tImagesFront, uv);
    vec4 video = texture2D(tVideo, uv);

    vec3 typeColor = uTextColor * texts.r + uLabelColor * texts.g;
    vec4 type = vec4(typeColor, texts.a);
    
    
    
    
    titles.rgb = uTextColor * titles.r + uLabelColor * titles.g;

    vec4 final = bg;
    final = over(images, final);
    final = over(video, final);
    final = over(type, final);
    final = over(titles, final);

    gl_FragColor = final;
}`;class De extends B{constructor(){super(),this.lastRender=0,this.idleInterval=1e3/15,this.scale=()=>e.dpr,this.rt=e.W.createRT(this.scale),this.transRt=e.W.createRT(this.scale),this.uniforms={tTexts:e.W.uniforms.tTexts,tTitles:e.W.uniforms.tTitles,tImagesFront:e.W.uniforms.tImagesFront,tVideo:e.W.uniforms.tVideo,uTime:e.W.uniforms.uTime,uRes:e.W.uniforms.uRes,uTextColor:{value:e.W.colors.base.black},uLabelColor:{value:e.W.colors.base.grey},uBgOffset:{value:0}},this.material=new g({fragmentShader:Fe,vertexShader:C,uniforms:this.uniforms}),this.mesh=new d(e.W.fullScreenTriangle,this.material),this.mesh.frustumCulled=!1,this.ready=!0}getTransTexture(){const t=e.W.renderer,n=e.W.flatCamera;t.setRenderTarget(this.transRt),t.render(this.mesh,n),e.W.uniforms.tTransFront.value=this.transRt.texture}resize(){}render(t,n){if(!this.ready)return;const o=e.W.renderer,r=e.W.flatCamera;o.setRenderTarget(this.rt),o.render(this.mesh,r),e.W.uniforms.tFront.value=this.rt.texture}loop(t){if(e.isTouch){this.render();return}e.isBackMode&&!e.isTransitioning||!(e.router.pageId==="home"&&Math.abs(e.scroll.velocity)>.01)&&!this.needsRender&&t-this.lastRender<this.idleInterval||(this.render(),this.lastRender=t,this.needsRender=!1)}}var We=`varying vec2 vUv;

uniform vec2 uRes;
uniform vec3 uColor;
uniform vec3 uDustColor;
uniform float uBrightness;
uniform float uStarBrightness;
uniform float uDustBrightness;
uniform float uMode;
uniform float uFrontBoost;
uniform float uTime;
uniform float uIsIntro;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
    float n = hash21(p);
    return vec2(n, hash21(p + n + 17.123));
}

mat2 rot2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

float starGrid(vec2 p, float scale, float threshold, float softness, out float id) {
    vec2 sp = p * scale;
    vec2 cell = floor(sp);
    vec2 f = fract(sp);

    vec2 rnd2 = hash22(cell);
    float rnd = hash21(cell + 9.7);

    float s = step(threshold, rnd);
    vec2 d = f - rnd2;

    float core = smoothstep(softness, 0.0, length(d));
    float halo = smoothstep(softness * 3.0, 0.0, length(d)) * 0.25;

    id = hash21(cell + 33.3);
    return s * (core + halo);
}

vec3 starField(vec2 uv) {
    vec2 p = uv - 0.5;

    vec2 res = uRes;

    float aspect = res.x / res.y;
    p.x *= aspect;

    p = rot2(uTime * 0.0005) * p;

    
    float modeBoost = mix(1.0, uFrontBoost, uMode);

    
    float r = length(p * vec2(.6, .95));
    float dust = smoothstep(0.9, 0.0, r);
    vec3 dustCol = uDustColor * dust * uDustBrightness;

    
    float densityMask = mix(0.9, 1.0, smoothstep(0.6, 0.0, r));

    
    float id1, id2, id3;
    float s1 = starGrid(p,                         220.0, 0.865 - densityMask * 0.1,   0.08, id1) * 0.5;
    float s2 = starGrid(rot2(radians(17.0)) * p,   170.0, 0.985 - densityMask * 0.008, 0.10, id2) * 0.5;
    float s3 = starGrid(p,                         220.0, 1.0   - densityMask * 0.01,  0.12, id3) * 1.1;

    float stars = s1 + s2 + s3;

    
    float interval = 1.0;
    float tBlock = floor(uTime / interval);
    float tLocal = mod(uTime, interval);

    float appear = step(0.7, hash21(vec2(tBlock, 12.34)));
    float duration = 0.7;
    float life = smoothstep(0.0, 0.2, tLocal) *
    (1.0 - smoothstep(duration - 0.3, duration, tLocal));
    
    float active2 = appear * step(tLocal, duration) * (1.0 - uIsIntro);

    vec2 start = vec2(
    hash21(vec2(tBlock, 3.1)),
    0.6 + hash21(vec2(tBlock, 7.4)) * 0.4
    );
    float angle = mix(-0.5, 0.5, hash21(vec2(tBlock, 9.2)));
    vec2 dir = normalize(vec2(1.0, angle));
    vec2 pos = start + dir * tLocal * 0.5;

    vec2 d = uv - pos;
    d.x *= aspect;

    float streak = exp(-length(d * vec2(400.0, 4000.0)));
    float head   = exp(-length(d * vec2(1200.0, 1200.0)));
    float shooting = (streak * 0.5 + head * 1.5) * life * active2;

    
    vec3 cold = vec3(0.55, 0.70, 1.00);
    vec3 warm = vec3(1.00, 0.85, 0.65);
    vec3 starColor = mix(warm, cold, id3) * uStarBrightness;

    
    vec3 bg = uColor * 0.08;
    vec3 col = bg + dustCol + stars * starColor + shooting * vec3(1.0, 0.95, 0.85);

    
    float vignette = smoothstep(1.4, 0.05, r);
    col *= vignette;

    col = pow(col, vec3(0.9));
    col *= uBrightness * modeBoost;
    return col;
}

void main() {
    vec3 col = starField(vUv);
    col += uColor * 0.15;
    gl_FragColor = vec4(col, 1.0);
}`;class Ge extends B{constructor(){super(),this.rt=e.W.createRT(e.isSafari?.6:.7),this.color=new u("#064c9a").convertLinearToSRGB(),this.brightness={default:2.8,work:3.2},this.dustBrightness={default:.1,work:.2},this.uniforms={uRes:e.W.uniforms.uRes,uMode:e.W.uniforms.uMode,uColor:{value:new u("#001524").convertLinearToSRGB()},uDustColor:{value:new u("#064c9a").convertLinearToSRGB()},uBrightness:{value:1.8},uStarBrightness:{value:1.3},uDustBrightness:{value:.1},uFrontBoost:{value:1.3},uTime:e.W.uniforms.uTime,uIsIntro:e.W.uniforms.uIsIntro},this.material=new g({uniforms:this.uniforms,vertexShader:C,fragmentShader:We}),this.mesh=new d(e.W.fullScreenTriangle,this.material),this.mesh.frustumCulled=!1,this.initControls(),this.ready=!0,e.emitter.on("router:ready",()=>{this.animate(e.router.pageId,!0,!0)}),e.emitter.on("site:loaded",()=>{this.animate(e.router.pageId)})}animate(t,n=!1,o=!1){this.tl?.kill(),this.tl=I.timeline({defaults:{ease:"power3.inOut",duration:n?.001:2},onUpdate:()=>{this.dirty()},onComplete:()=>{this.tl.kill()}});let r=this.color,i=this.brightness.default,a=this.dustBrightness.default;t==="work"&&!o&&(r=e.W.colors.work[e.router.pageSlug].light,i=this.brightness.work,a=this.dustBrightness.work),this.tl.to(this.uniforms.uBrightness,{value:i},0),this.tl.to(this.uniforms.uDustBrightness,{value:a},0),this.tl.to(this.uniforms.uDustColor.value,{r:r.r,g:r.g,b:r.b},0)}initControls(){if(!e.W.gui)return;const t=this.uniforms,n=e.W.gui.addFolder("Stars");n.addColor({color:"#00060a"},"color").name("Color").onChange(o=>{t.uColor.value.set(o).convertLinearToSRGB()}),n.addColor({dust:"#002766"},"dust").name("Dust Color").onChange(o=>{t.uDustColor.value.set(o).convertLinearToSRGB()}),n.add(t.uBrightness,"value",0,5,.01).name("Brightness"),n.add(t.uStarBrightness,"value",0,3,.01).name("Star Brightness"),n.add(t.uDustBrightness,"value",0,.2,.001).name("Dust Brightness"),n.add(t.uFrontBoost,"value",1,3,.01).name("Front Mode Boost")}resize(){this._frame=0}render(t,n){if(!this.ready||(this._frame||(this._frame=0),++this._frame%2!==0&&!this.needsRender))return;const o=e.W.renderer;o.setRenderTarget(this.rt),o.render(this.mesh,e.W.flatCamera),e.W.uniforms.tStars.value=this.rt.texture}loop(){!this.needsRender&&!e.isBackMode&&e.router.pageId!=="home"&&!e.isFirstLoad||(this.render(),this.needsRender=!1)}}var Pe=`vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float grainHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float grainNoise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(grainHash(ip),grainHash(ip+vec2(1.0,0.0)),u.x),
    mix(grainHash(ip+vec2(0.0,1.0)),grainHash(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    
    
    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}

float noise2(vec2 p) {
    return 0.5 + 0.5 * snoise(vec3(p, 0.0));
}

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
attribute vec4 tangent;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform vec3 uMouseWorld;
uniform float uMouseRadius;
uniform float uMouseStrength;

uniform float uTerrainScale;
uniform float uTerrainHeight;
uniform float uTerrainDetail;
uniform float uTerrainTime;

float terrain(vec3 p) {
    float n = 0.0;
    float amp = 1.0;
    float freq = 1.0;

    for (int i = 0; i < 5; i++) {
        n += snoise(p * freq + uTerrainTime) * amp;
        freq *= uTerrainDetail;
        amp *= 0.5;
    }

    return n;
}

void main() {
    vUv = uv;

    vec3 pos = position;
    vec3 n = normalize(normal);

    
    float t = terrain(n * uTerrainScale);

    
    vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    float mouseDist = distance(normalize(worldPos), normalize(uMouseWorld));
    float mouseInfluence = smoothstep(uMouseRadius, 0.0, mouseDist);

    float totalHeight = t * uTerrainHeight + mouseInfluence * uMouseStrength;
    pos += n * totalHeight;

    
    float eps = 0.01;
    vec3 localTangent = normalize(cross(n, vec3(0.0, 1.0, 0.0)));
    if (length(cross(n, vec3(0.0, 1.0, 0.0))) < 0.001) {
        localTangent = normalize(cross(n, vec3(1.0, 0.0, 0.0)));
    }
    vec3 bitangent = normalize(cross(n, localTangent));

    float tR = terrain((n + localTangent * eps) * uTerrainScale);
    float tU = terrain((n + bitangent * eps) * uTerrainScale);

    float mouseDistR = distance(normalize((modelMatrix * vec4(position + localTangent * eps * length(position), 1.0)).xyz), normalize(uMouseWorld));
    float mouseDistU = distance(normalize((modelMatrix * vec4(position + bitangent * eps * length(position), 1.0)).xyz), normalize(uMouseWorld));
    float mouseR = smoothstep(uMouseRadius, 0.0, mouseDistR) * uMouseStrength;
    float mouseU = smoothstep(uMouseRadius, 0.0, mouseDistU) * uMouseStrength;

    float totalR = tR * uTerrainHeight + mouseR;
    float totalU = tU * uTerrainHeight + mouseU;

    float r = length(position);
    vec3 displaced = n * (1.0 + totalHeight / r);
    vec3 displacedR = (n + localTangent * eps) * (1.0 + totalR / r);
    vec3 displacedU = (n + bitangent * eps) * (1.0 + totalU / r);

    vNormal = normalize(cross(displacedR - displaced, displacedU - displaced));
    vNormal = normalize(normalMatrix * vNormal);

    vTangent   = normalize(normalMatrix * tangent.xyz);
    vBitangent = normalize(cross(vNormal, vTangent) * tangent.w);
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,Ie=`vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float grainHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float grainNoise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
    mix(grainHash(ip),grainHash(ip+vec2(1.0,0.0)),u.x),
    mix(grainHash(ip+vec2(0.0,1.0)),grainHash(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    
    
    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}

float noise2(vec2 p) {
    return 0.5 + 0.5 * snoise(vec3(p, 0.0));
}

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform sampler2D tMap;
uniform sampler2D tCracked;
uniform sampler2D tCrackedNormal;
uniform sampler2D uTrailMap;

uniform vec3 uColor;
uniform float uTime;
uniform float uMode;
uniform float uIsMobile;
uniform float uIsIntro;

uniform float uRimPow;
uniform float uGlowPow;
uniform float uGlowStr;
uniform float uRimStr;

uniform vec3 uLightColor;
uniform vec3 uDarkColor;

uniform float uLightStart;
uniform float uLightEnd;

uniform float uGlowBiasX;
uniform float uGlowBiasY;
uniform float uBiasGlowStr;
uniform float uBiasGlowPow;

uniform float uRevealRadius;
uniform float uCrackStr;
uniform float uNormalStr;
uniform float uCrackActive;

void main() {
    vec2 crackedUv = vUv * vec2(16.0, 8.0);

    
    float trailEnergy = texture2D(uTrailMap, vUv).r;
    float reveal      = pow(trailEnergy, 2.0) * uCrackActive;

    
    vec4 normalSample  = texture2D(tCrackedNormal, crackedUv);
    vec3 tangentNormal = normalSample.rgb * 2.0 - 1.0;
    tangentNormal.xy  *= uNormalStr;

    mat3 TBN             = mat3(vTangent, vBitangent, vNormal);
    vec3 perturbedNormal = normalize(TBN * tangentNormal);
    vec3 activeNormal    = normalize(mix(vNormal, perturbedNormal, reveal));

    
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float NdotV  = max(dot(activeNormal, viewDir), 0.0);
    float fresnel = 1.0 - NdotV;

    float rim  = pow(fresnel, uRimPow);
    float glow = pow(fresnel, uGlowPow);

    vec3 biasedNormal   = normalize(activeNormal + vec3(uGlowBiasX, uGlowBiasY, 0.0));
    float biasedNdotV   = max(dot(biasedNormal, viewDir), 0.0);
    float biasedFresnel = 1.0 - biasedNdotV;
    float biasGlow      = pow(biasedFresnel, uBiasGlowPow);

    float warmth  = vNormal.y * 0.5 + 0.5;
    vec3 rimColor = mix(uDarkColor, uLightColor, smoothstep(uLightStart, uLightEnd, warmth));

    vec3 corona  = rimColor * glow * uGlowStr;
    corona      += rimColor * rim  * uRimStr;
    corona      += rimColor * biasGlow * uBiasGlowStr;

    
    vec4 t         = texture2D(tMap, vUv);
    vec3 lightFill = uLightColor * 0.3;
    vec3 tCol      = t.rgb * lightFill;

    vec3 col = uColor + corona + tCol
    + mix(mix(vec3(0.0), lightFill, uIsMobile), lightFill, uMode - uIsIntro);

    
    vec4 c          = texture2D(tCracked, crackedUv);
    float crackLuma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float crackMask = pow(1.0 - crackLuma, 8.0);

    col = mix(col, uLightColor * uCrackStr, crackMask * reveal);

    gl_FragColor = vec4(col, 1.0);
}`,ze=`uniform sampler2D tTrail;
uniform vec2 uRes;
uniform vec2 uMouseUV;
uniform float uDecay;
uniform float uStampRadius;
uniform float uActive;

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;

    float existing = texture2D(tTrail, uv).r * uDecay;

    
    float dist  = length(uv - uMouseUV);
    float stamp = uActive * pow(smoothstep(uStampRadius, 0.0, dist), 2.0);

    
    gl_FragColor = vec4(max(existing, stamp), 0.0, 0.0, 1.0);
}`,Ue=`void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
}`;class Le extends B{constructor(){super(),this.lastRender=0,this.idleInterval=1e3/15,this.scene=new y,this.scale=e.isMobile?1:.8,this.rt=e.W.createRT(this.scale),this.blurRTA=e.W.createRT(.15),this.blurRTB=e.W.createRT(.15),this.lightColor=new u("#81aeca"),this.darkColor=new u("#436eb1"),this.terrainTime=0,this.color={default:new u("#00060a").convertLinearToSRGB(),work:new u("#0b0d0f").convertLinearToSRGB()},this.height={default:.7,transition:3},this.scale={default:3.9,transition:6},this.speed=.1,this.trailSize=8,this.trail={positions:Array.from({length:this.trailSize},()=>new W(0,-9999,0)),energies:Array(this.trailSize).fill(0),head:0},this.crackMode=0,this.trailRTA=new k(512,256,{minFilter:w,magFilter:w,format:D,type:R}),this.trailRTB=this.trailRTA.clone(),this.trailMaterial=new g({uniforms:{tTrail:{value:null},uRes:{value:new f(512,256)},uMouseUV:{value:new f(.5,.5)},uDecay:{value:.995},uStampRadius:{value:.06},uActive:{value:0}},vertexShader:Ue,fragmentShader:ze}),this.trailQuad=new d(new P(2,2),this.trailMaterial),this.trailScene=new y,this.trailScene.add(this.trailQuad),this.trailCamera=new z(-1,1,1,-1,0,1),this.uniforms={uColor:{value:new u("#00060a").convertLinearToSRGB()},uRimPow:{value:4.5},uGlowPow:{value:3.2},uGlowStr:{value:1},uRimStr:{value:.9},uLightColor:{value:new u("#81aeca")},uDarkColor:{value:new u("#436eb1")},uLightStart:{value:.4},uLightEnd:{value:1},uCoolStart:{value:0},uCoolEnd:{value:.5},uTerrainScale:{value:3.9},uTerrainHeight:{value:.7},uTerrainDetail:{value:1.5},uTerrainTime:{value:0},uGlowBiasX:{value:-.6},uGlowBiasY:{value:0},uBiasGlowStr:{value:1.5},uBiasGlowPow:{value:7},uMouseWorld:{value:new W(0,0,1e3)},uMouseRadius:{value:.9},uMouseStrength:{value:2.02},uTime:e.W.uniforms.uTime,uMode:e.W.uniforms.uMode,uIsIntro:e.W.uniforms.uIsIntro,uIsMobile:e.W.uniforms.uIsMobile,uRes:e.W.uniforms.uRes,tMap:{value:null},tCracked:{value:null},tCrackedNormal:{value:null},uRevealRadius:{value:1.5},uCrackStr:{value:2},uCrackActive:{value:0},uNormalStr:{value:1.2},uTrailMap:{value:this.trailRTA.texture}};const t=new g({uniforms:this.uniforms,vertexShader:Pe,fragmentShader:Ie}),n=new V(93,128,128);n.computeTangents(),this.mesh=new d(n,t),this.raycaster=new re,this.mouseVec=new f,this.mouseWorldTarget=new W(0,0,0),this.mouseUVTarget=new f(0,0),this.mouseHover=0,this.mouseHoverTarget=0,this.pages={home:{position:{x:62,y:-26,z:-10},scale:90,uniforms:{uGlowBiasX:-.6,uRimPow:4.5,uGlowPow:3.2,uGlowStr:1,uRimStr:0,uTerrainScale:3.9}},work:{position:{x:0,y:e.isMobile?-36:-32,z:-60},scale:50,uniforms:{uGlowBiasX:.6,uRimPow:4.2,uGlowPow:3.2,uGlowStr:.4,uRimStr:1,uTerrainScale:3.5}},info:{position:{x:-38,y:-40,z:-26.6},scale:150,uniforms:{uGlowBiasX:.6,uRimPow:4.2,uGlowPow:.5,uGlowStr:.6,uRimStr:1,uTerrainScale:3.9}},error:{position:{x:0,y:0,z:-200},scale:50,uniforms:{uGlowBiasX:.6,uRimPow:4.2,uGlowPow:3.2,uGlowStr:.4,uRimStr:1,uTerrainScale:3.5}}},this.angularVelocity={x:0,y:0},this.rotation={x:0,y:0},this.mesh.frustumCulled=!1,this.scene.add(this.mesh),this.initTextures(),this.initControls(),e.emitter.on("router:ready",()=>{this.animate(e.router.pageId,!0,!0)}),e.emitter.on("site:loaded",()=>{this.animate(e.router.pageId)}),this.ready=!0}initTextures(){const t=(n,o)=>new Promise(r=>{e.W.loader.load(n,i=>{o(i),r()},void 0,()=>r())});this.texturesReady=Promise.all([t("/textures/planet.webp",n=>{n=new N(n),n.generateMipmaps=!1,n.minFilter=w,n.magFilter=w,n.needsUpdate=!0,this.uniforms.tMap.value=n}),t("/textures/cracked.webp",n=>{n=new A(n),n.wrapS=S,n.wrapT=S,n.repeat.set(16,8),this.uniforms.tCracked.value=n}),t("/textures/cracked-normal.webp",n=>{n=new A(n),n.wrapS=S,n.wrapT=S,n.repeat.set(16,8),this.uniforms.tCrackedNormal.value=n})])}initControls(){if(!e.W.gui)return;const t=e.W.gui.addFolder("Planet"),n=this.uniforms;t.add(this.mesh.position,"x",-500,500,.1).name("X"),t.add(this.mesh.position,"y",-500,500,.1).name("Y"),t.add(this.mesh.position,"z",-500,500,.1).name("Z"),t.add(this.mesh.geometry.parameters,"radius",1,500,1).name("Radius").onChange(m=>{this.mesh.geometry.dispose(),this.mesh.geometry=new V(m,64,64)}),t.addColor({color:"#00060a"},"color").name("Body Color").onChange(m=>{n.uColor.value.set(m).convertLinearToSRGB()});const o=t.addFolder("Rim / Glow");o.add(n.uRimPow,"value",.5,10,.1).name("Rim Power"),o.add(n.uRimStr,"value",0,5,.1).name("Rim Strength"),o.add(n.uGlowPow,"value",.5,10,.1).name("Glow Power"),o.add(n.uGlowStr,"value",0,5,.1).name("Glow Strength");const r=t.addFolder("Corona Colors");r.addColor({c:"#81aeca"},"c").name("Light").onChange(m=>n.uLightColor.value.set(m)),r.addColor({c:"#436eb1"},"c").name("Dark").onChange(m=>n.uDarkColor.value.set(m));const i=t.addFolder("Gradient Ramp");i.add(n.uLightStart,"value",0,1,.01).name("Light Start"),i.add(n.uLightEnd,"value",0,1,.01).name("Light End");const a=t.addFolder("Glow Bias");a.add(n.uGlowBiasX,"value",-1,1,.01).name("X Bias"),a.add(n.uGlowBiasY,"value",-1,1,.01).name("Y Bias"),a.add(n.uBiasGlowPow,"value",.5,10,.1).name("Bias Power"),a.add(n.uBiasGlowStr,"value",0,5,.1).name("Bias Strength");const l=t.addFolder("Terrain");l.add(n.uTerrainScale,"value",.5,10,.1).name("Scale"),l.add(n.uTerrainHeight,"value",0,15,.1).name("Height"),l.add(n.uTerrainDetail,"value",1.5,4,.1).name("Detail (octave freq)");const c=t.addFolder("Mouse Interaction");c.add(n.uMouseRadius,"value",.1,2,.01).name("Radius"),c.add(n.uMouseStrength,"value",0,10,.1).name("Strength")}animate(t=e.router.pageId,n=!1,o=!1){const r=this.pages[t],i=e.router.transType;let a=2.3;n?a=.001:(i==="infoToHome"||i==="homeToInfo")&&(a=2.5),this.tl?.kill(),this.tl=I.timeline({defaults:{ease:"power3.inOut",duration:a},onUpdate:()=>{this.dirty()},onComplete:()=>{this.tl.kill()}}),this.tl.to(this.mesh.position,{x:r.position.x,y:r.position.y,z:r.position.z},0),Object.keys(r.uniforms).forEach(v=>{this.tl.to(this.uniforms[v],{value:r.uniforms[v]},0)});let l=this.color.default,c=this.lightColor,m=this.darkColor;if(n?e.W.back.uniforms.uPlanetBlurAmt.value=1:this.tl.to(e.W.back.uniforms.uPlanetBlurAmt,{value:.3,duration:.8,ease:"power2.out"},0),t==="work"&&!o){l=this.color.work;const v=e.W.colors.work[e.router.pageSlug];c=v.light,m=v.dark,e.router.prevPageId==="work"&&(this.speed=.1,this.tl.to(this.uniforms.uTerrainHeight,{value:2.2,duration:1.1,ease:"power3.in"},.2),this.tl.to(this.uniforms.uTerrainHeight,{value:.7,duration:1.3,ease:"power3.out"},1.3),this.tl.to(this,{speed:1,duration:1.1,ease:"power3.in"},.2),this.tl.to(this,{speed:.1,duration:1.3,ease:"power3.out"},1.3),this.tl.to(this.rotation,{y:this.rotation.y-Math.PI*.4,duration:2.6,ease:"power3.inOut",onUpdate:()=>{this.mesh.rotation.y=this.rotation.y}},0))}this.tl.to(this.rotation,{x:0,duration:2.6,ease:"power3.inOut",onUpdate:()=>{this.mesh.rotation.x=this.rotation.x}},0),n||this.tl.to(e.W.back.uniforms.uPlanetBlurAmt,{value:1,duration:1.2,ease:"power2.in"},1),this.tl.to(this.uniforms.uColor.value,{r:l.r,g:l.g,b:l.b},0),this.tl.to(this.uniforms.uLightColor.value,{r:c.r,g:c.g,b:c.b},0),this.tl.to(this.uniforms.uDarkColor.value,{r:m.r,g:m.g,b:m.b},0)}mousemove(){if(e.router.pageId!=="work"||!e.isBackMode){this.mouseHoverTarget=0;return}this.mouseVec.copy(e.mouseN),this.raycaster.setFromCamera(this.mouseVec,e.W.camera);const t=this.raycaster.intersectObject(this.mesh);t.length>0?(this.mouseWorldTarget.copy(t[0].point),this.mouseUVTarget.copy(t[0].uv),this.mouseHoverTarget=1):this.mouseHoverTarget=0}render(t,n){const o=e.W.renderer,r=e.W.camera,i=e.router.pageId==="home",a=e.router.pageId==="work";this.terrainTime+=n*.001*this.speed,this.uniforms.uTerrainTime.value=this.terrainTime;const l=a&&e.isBackMode&&!e.isTransitioning?1:0;if(this.crackMode+=(l-this.crackMode)*.03,this.crackMode>.001){const c=this.trailMaterial.uniforms;c.tTrail.value=this.trailRTA.texture,c.uActive.value=this.mouseHoverTarget*this.crackMode,c.uMouseUV.value.copy(this.mouseUVTarget),o.setRenderTarget(this.trailRTB),o.render(this.trailScene,this.trailCamera),[this.trailRTA,this.trailRTB]=[this.trailRTB,this.trailRTA],this.uniforms.uTrailMap.value=this.trailRTA.texture}if(o.setRenderTarget(this.rt),o.clear(),o.render(this.scene,r),e.W.uniforms.tPlanet.value=this.rt.texture,e.W.uniforms.tPlanetBlur.value=e.W.blur.apply(this.rt.texture,this.blurRTA,this.blurRTB),this.uniforms.uCrackActive.value=this.crackMode,this.uniforms.uMouseStrength.value=this.mouseHover*this.crackMode*.9,!e.isTransitioning){if((i||a)&&e.isBackMode){const c=e.scroll.velocity,m=a?c*-6e-5:c*2e-5;if(this.angularVelocity.y=F(this.angularVelocity.y,m,.05),this.rotation.y+=this.angularVelocity.y,this.mesh.rotation.y=this.rotation.y,i){const v=-c*7e-5;this.mesh.rotation.x=this.rotation.x,this.angularVelocity.x=F(this.angularVelocity.x,v,.05),this.rotation.x+=this.angularVelocity.x}}this.mouseHover+=(this.mouseHoverTarget-this.mouseHover)*.04,this.mouseHoverTarget===1&&this.uniforms.uMouseWorld.value.lerp(this.mouseWorldTarget,.06)}}loop(t,n){if(e.isBackMode){this.render(t,n),this.lastRender=t,this.needsRender=!1;return}const o=this.needsRender||e.isFirstLoad?0:this.idleInterval;t-this.lastRender<o||(this.render(t,n),this.lastRender=t,this.needsRender=!1)}}var Ve=`varying vec2 vUv;
uniform vec2 uRes;
uniform float uMode;
uniform vec3 uColor;
uniform float uTime;
uniform sampler2D tNoise;
uniform sampler2D tFluid;

uniform float uScale;
uniform float uDriftX;
uniform float uDriftY;
uniform float uQSpeed;
uniform float uQYSpeed;
uniform float uRX;
uniform float uRY;
uniform float uRXSpeed;
uniform float uRYSpeed;
uniform float uFluidStr;
uniform float uDarkMul;
uniform float uMidMul;
uniform float uLightLift;
uniform float uDensityMin;
uniform float uDensityMax;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uHasFog;

#define NUM_OCTAVES 8
#define NOISE(uv) texture(tNoise, uv / 300.).r;

float fbm(vec2 st) {
    float value = 0.0;
    float amp = .5;
    vec2 shift = vec2(100.);
    mat2 rot = mat2(cos(1.5), sin(1.5), -sin(1.5), cos(1.50));

    for (int i = 0; i < NUM_OCTAVES; ++i) {
        value += amp * NOISE(st);
        st = rot * st * 2.0 + shift;
        amp *= 0.5;
    }

    return value;
}

void main() {
    vec2 st = (vUv * uRes) / uRes.y * uScale;

    st += vec2(uOffsetX, uOffsetY);

    vec2 fluidVel = texture(tFluid, vUv).rg;

    vec2 q = vec2(0.);
    q.x = fbm(st - uTime * uQSpeed);
    q.y = fbm(st + vec2(1.0) + uTime * uQYSpeed);

    vec2 r = vec2(0.);
    r.x = fbm(st + 1.0 * q + vec2(0.910, 0.990) + uRXSpeed * uTime);
    r.y = fbm(st + 1.0 * q + vec2(0.560, -0.160) + uRYSpeed * uTime);

    r = mix(r + fluidVel * uFluidStr, r, uMode);

    float f = fbm(st + r);

    vec3 dark = uColor * uDarkMul;
    vec3 mid = uColor * uMidMul;
    vec3 light = uColor * uLightLift;

    vec3 color = mix(dark, mid, clamp((f * f) * 4.0, 0.0, 1.0));
    color = mix(color, dark * 0.5, clamp(length(q), 0.0, 1.0));
    color = mix(color, light, clamp(length(r.x), 0.0, 1.0));

    float density = f*f*f + .6*f*f + .5*f;
    density = smoothstep(uDensityMin - (1.0 - uHasFog), uDensityMax, density);

    gl_FragColor = vec4(density * color, density);
}`;class Ae extends B{constructor(){super(),this.scene=new y,this.rt=e.W.createRT(.3),this.scale={home:1.6,default:4},this.uniforms={uMode:e.W.uniforms.uMode,uRes:e.W.uniforms.uRes,uTime:e.W.uniforms.uTime,tFluid:e.W.uniforms.tFluid,uHasFog:e.W.uniforms.uHasFog,tNoise:e.W.uniforms.tNoise,uColor:{value:new u("#20447e").convertLinearToSRGB()},uScale:{value:1.6},uQSpeed:{value:.02},uQYSpeed:{value:0},uRXSpeed:{value:.08},uRYSpeed:{value:.08},uFluidStr:{value:.003},uDarkMul:{value:1},uMidMul:{value:1},uLightLift:{value:1.2},uDensityMin:{value:.1},uDensityMax:{value:1},uOffsetX:{value:0},uOffsetY:{value:0}};const t=new g({uniforms:this.uniforms,vertexShader:C,fragmentShader:Ve});this.mesh=new d(e.W.fullScreenTriangle,t),this.mesh.frustumCulled=!1,this.initControls(),e.emitter.on("router:ready",()=>{this.animate(e.router.pageId,!0)}),this.ready=!0}animate(t,n=!1){this.tl?.kill(),this.tl=I.timeline({defaults:{ease:"power2.inOut",duration:n?.001:2},onComplete:()=>{this.tl.kill()}});const o=t==="home";this.tl.to(e.W.uniforms.uHasFog,{value:o?1:0},0),this.tl.to(this.uniforms.uScale,{value:o?this.scale.home:this.scale.default},0),this.tl.to(this.uniforms.uDarkMul,{value:o?1:0},o?0:.2),this.tl.to(this.uniforms.uMidMul,{value:o?1:0},.1),this.tl.to(this.uniforms.uLightLift,{value:o?1:0},o?0:.2)}initControls(){if(!e.W.gui)return;const t=this.uniforms,n=e.W.gui.addFolder("Fog"),o=n.addFolder("Shape");o.add(t.uScale,"value",.5,10,.1).name("Scale"),o.add(t.uOffsetX,"value",0,25,.001).name("Offset X"),o.add(t.uOffsetY,"value",0,25,.001).name("Offset Y"),o.add(t.uDensityMin,"value",0,.5,.01).name("Density Min"),o.add(t.uDensityMax,"value",.1,1,.01).name("Density Max");const r=n.addFolder("Motion");r.add(t.uQSpeed,"value",0,.5,.01).name("Q Speed"),r.add(t.uQYSpeed,"value",0,.5,.01).name("Q Y Speed"),r.add(t.uRXSpeed,"value",0,.5,.01).name("R X Speed"),r.add(t.uRYSpeed,"value",0,.5,.01).name("R Y Speed"),r.add(t.uFluidStr,"value",0,.05,.001).name("Fluid Strength");const i=n.addFolder("Color");i.addColor({color:"#064C9A"},"color").name("Base Color").onChange(a=>{t.uColor.value.set(a).convertLinearToSRGB()}),i.add(t.uDarkMul,"value",0,5,.01).name("Dark Mul"),i.add(t.uMidMul,"value",0,5.5,.01).name("Mid Mul"),i.add(t.uLightLift,"value",0,5,.01).name("Light Lift")}render(t,n){if(!this.ready)return;const o=e.W.renderer;o.setRenderTarget(this.rt),o.render(this.mesh,e.W.flatCamera),e.W.uniforms.tFog.value=this.rt.texture}loop(){!this.needsRender&&!e.isBackMode&&e.router.pageId!=="home"||(this.render(),this.needsRender=!1)}}class _e extends B{constructor(){super(),this.scale=()=>e.isMobile?window.devicePixelRatio:e.dpr,this.rt=e.W.createRT(this.scale),this.scene=new y}render(){const t=e.W.renderer;t.setRenderTarget(this.rt),t.clear(),t.render(this.scene,e.W.camera),e.W.uniforms.tTexts.value=this.rt.texture}}class Ne extends B{constructor(){super(),this.scene=new y,this.texture=null,this.scale=()=>e.isMobile?e.dpr:1.5,this.backScale=()=>Math.min(e.dpr,e.isMobile?1.5:1),this.rt=e.W.createRT(this.scale),this.backRt=e.W.createRT(this.backScale),this.blurRTC=e.W.createRT(.2),this.blurRTD=e.W.createRT(.2)}render(){const t=e.W.renderer,n=e.isBackMode?this.backRt:this.rt;t.setRenderTarget(n),t.clear(),t.render(this.scene,e.W.camera),e.W.uniforms.tTitles.value=n.texture,e.W.uniforms.tTitlesSoft.value=n.texture,e.W.uniforms.tTitlesBlur.value=e.W.blur.apply(n.texture,this.blurRTC,this.blurRTD)}}var Ee=`varying vec2 vUv;
uniform sampler2D tMap;
uniform sampler2D tBloom;
uniform vec3 uColor;
uniform float uBloomReduction;
uniform float uBloomBoost;
uniform float uBloomClamp;

void main() {
    vec4 base = texture2D(tMap, vUv);
    vec3 bloom = texture2D(tBloom, vUv).rgb;

    bloom = max(bloom - vec3(uBloomReduction), 0.0);
    bloom *= uBloomBoost;
    bloom = clamp(bloom, 0.0, uBloomClamp);

    
    vec3 glow = bloom * uColor;

    
    vec3 rgb = base.rgb + glow * (1.0 - base.rgb);
    rgb = clamp(rgb, 0.0, 1.0);

    
    float b = max(bloom.r, max(bloom.g, bloom.b));
    float a = clamp(max(base.a, b), 0.0, 1.0);

    gl_FragColor = vec4(rgb, a);
}`;class He extends B{constructor(){super(),this.scale=()=>e.isMobile?e.dpr:Math.min(e.dpr,e.isSafari?1.3:1.4),this.bloomScale=()=>e.isMobile?Math.min(e.dpr,1.5):Math.min(e.dpr,e.isSafari?1:1.2),this.rt=e.W.createRT(this.scale),this.tightBlurA=e.W.createRT(.5),this.tightBlurB=e.W.createRT(.5),this.wideBlurA=e.W.createRT(.1),this.wideBlurB=e.W.createRT(.1),this.bloomCompositeRT=e.W.createRT(this.bloomScale()),this.frontRT=e.W.createRT(this.scale),this.scene=new y,this.baseBloomBoost=.1,this.infoBloomBoost=.3,this._bloomBoost=this.baseBloomBoost,this.baseBloomBleed=.6,this.infoBloomBleed=1.8,this._bloomBleed=this.baseBloomBleed,this.bloomCompositeMaterial=new g({vertexShader:C,fragmentShader:Ee,uniforms:{tMap:{value:null},tBloom:{value:null},uBloomBoost:{value:this.baseBloomBoost},uBloomReduction:{value:.01},uBloomClamp:{value:1},uColor:{value:new u("white")}}}),this.bloomCompositeMesh=new d(e.W.fullScreenTriangle,this.bloomCompositeMaterial),this.bloomCompositeMesh.frustumCulled=!1,this.initControls()}initControls(){if(!e.W.gui)return;const t=e.W.gui.addFolder("Info Bloom");t.add(this,"infoBloomBoost",0,2,.01).name("boost"),t.add(this,"infoBloomBleed",0,8,.05).name("bleed")}render(){const t=e.W.renderer,n=!e.isTouch&&e.router.pageId==="info"&&e.isBackMode;this._bloomBoost=F(this._bloomBoost,n?this.infoBloomBoost:this.baseBloomBoost,.08),this.bloomCompositeMaterial.uniforms.uBloomBoost.value=this._bloomBoost;const o=e.W.back?.uniforms?.uBloomBleed;o&&(this._bloomBleed=F(this._bloomBleed,n?this.infoBloomBleed:this.baseBloomBleed,.08),o.value=this._bloomBleed),e.W.uniforms.uImageMode.value=0,t.setRenderTarget(this.rt),t.clear(),t.render(this.scene,e.W.camera);const r=e.W.blur.apply(this.rt.texture,this.tightBlurA,this.tightBlurB);e.W.blur.apply(r,this.wideBlurA,this.wideBlurB);const i=e.W.blur.apply(this.wideBlurB.texture,this.wideBlurA,this.wideBlurB);this.bloomCompositeMaterial.uniforms.tMap.value=this.rt.texture,this.bloomCompositeMaterial.uniforms.tBloom.value=r,t.setRenderTarget(this.bloomCompositeRT),t.render(this.bloomCompositeMesh,e.W.flatCamera),e.W.uniforms.tImagesBack.value=this.bloomCompositeRT.texture,e.W.uniforms.tImagesBackBloom.value=i,(!e.isBackMode||e.isTransitioning)&&(e.W.uniforms.uImageMode.value=1,t.setRenderTarget(this.frontRT),t.clear(),t.render(this.scene,e.W.camera),e.W.uniforms.tImagesFront.value=this.frontRT.texture)}loop(t){if(e.isTouch||e.router.pageId==="info"){this.render();return}!(e.router.pageId==="home"&&Math.abs(e.scroll.velocity)>.01)&&!this.needsRender||(this.render(),this.lastRender=t,this.needsRender=!1)}}class Oe extends B{constructor(){super(),this.scale=()=>e.isMobile?e.dpr:Math.min(e.dpr,1.25),this.rt=e.W.createRT(this.scale),this.scene=new y}render(){const t=e.W.renderer;t.setRenderTarget(this.rt),t.clear(),t.render(this.scene,e.W.camera),e.W.uniforms.tVideo.value=this.rt.texture}loop(){if(e.isTouch){this.render();return}!this.needsRender&&e.router.pageId!=="work"||(this.render(),this.needsRender=!1)}}class Je{constructor(){e.W=this,this.rts=[],this.layers=[],this.initControls(),this.initRenderer(),this.initColors(),this.initBlur(),this.initUniforms(),this.initNoise(),this.initLayers(),this.initFluid(),this.addEvents(),this.ready=!0}initRenderer(){this.canvas=e.body.querySelector(".canvas"),this.renderer=new K({canvas:this.canvas,alpha:!0,powerPreference:"high-performance"}),this.renderer.autoClear=!1,this.renderer.setPixelRatio(e.dpr),this.renderer.outputColorSpace=ie,this.renderer.setSize(e.width,e.height),this.scene=new y,this.camera=new ae(50,e.aspectRatio,.1,1e3),this.camera.position.z=100;const t=this.camera.fov*Math.PI/180;this.heightAtZ=2*Math.tan(t/2)*this.camera.position.z,this.widthAtZ=this.heightAtZ*this.camera.aspect,this.flatCamera=new z(-1,1,1,-1,0,1),this.fullScreenTriangle=U(),this.geometry=new P(1,1,1,1),this.mediaGeometry=new P(1,1,30,30),this.loader=new se,this.loader.setOptions({imageOrientation:"flipY",premultiplyAlpha:"none"})}initBlur(){this.blur=new Ce}initColors(){this.colors={base:{black:new u("#00031F").convertLinearToSRGB(),grey:new u("#93949F").convertLinearToSRGB(),white:new u("#ffffff").convertLinearToSRGB(),blue:new u("#038CDB").convertLinearToSRGB(),offWhite:new u("#FEF4E7").convertLinearToSRGB(),bloom:new u("#A0FFF2").convertLinearToSRGB()},work:{}},Object.values(te.projects).forEach(t=>{this.colors.work[t.slug]={},this.colors.work[t.slug].light=new u(t.lightColor),this.colors.work[t.slug].dark=new u(t.darkColor)})}initUniforms(){this.uniforms={uTime:{value:0},uRes:{value:new f(e.width,e.height)},uDpr:{value:e.dpr},uIsTouch:{value:e.isTouch?1:0},uMode:{value:1},tFluid:{value:null},tBack:{value:null},tTransBack:{value:null},tTransBackContent:{value:null},tFront:{value:null},tTransFront:{value:null},tTexts:{value:null},tTitles:{value:null},tTitlesSoft:{value:null},tTitlesBlur:{value:null},tImagesFront:{value:null},tImagesBack:{value:null},tImagesBackBloom:{value:null},tVideo:{value:null},tStars:{value:null},tPlanet:{value:null},tPlanetBlur:{value:null},tNoise:{value:null},tFog:{value:null},uHasFog:{value:0},uIsTransitioning:{value:0},uIsInfo:{value:0},uIsMobile:{value:e.isMobile?1:0},uIsIntro:{value:1},uImageMode:{value:0},uLightColor:{value:this.colors.base.white},uDarkColor:{value:this.colors.base.black},uNoiseSize:{value:e.isLowDpr||e.isSafari?4.2:e.isMobile?2:3.8},uNoiseAmount:{value:e.isMobile?.09:.12},uInputBlack:{value:15},uInputWhite:{value:200},uGamma:{value:125},uSaturation:{value:1.2},uCurveX:{value:5e-5},uCurveZ:{value:.01}}}initNoise(){this.noiseReady=new Promise(t=>{e.W.loader.load("/textures/noise.png",n=>{const o=new N(n);o.generateMipmaps=!1,o.minFilter=w,o.magFilter=w,o.wrapS=S,o.wrapT=S,o.needsUpdate=!0,this.uniforms.tNoise.value=o,t()},void 0,()=>t())})}get backdropReady(){return Promise.all([this.noiseReady,this.planet?.texturesReady])}initLayers(){this.texts=new _e,this.titles=new Ne,this.images=new He,this.video=new Oe,this.stars=new Ge,this.planet=new Le,this.fog=new Ae,this.back=new ke,this.front=new De,this.output=new Me,this.layers.push(this.texts,this.titles,this.images,this.video,this.stars,this.planet,this.fog,this.back,this.front)}dirty(){this.layers.forEach(t=>t.dirty())}initFluid(){this.fluidBackRadius=16,this.fluidFrontRadius=6,this.fluidMaxRadius=e.isBackMode?this.fluidBackRadius:this.fluidFrontRadius,this.fluidSettings={front:{densityDissipation:.73,velocityDissipation:.98,pressureDissipation:.7},back:{densityDissipation:e.isTouch?.96:.83,velocityDissipation:.9,pressureDissipation:.97}},this.fluid=new ye(this.renderer,{iterations:1,densityDissipation:this.fluidSettings.front.densityDissipation,velocityDissipation:this.fluidSettings.front.velocityDissipation,pressureDissipation:this.fluidSettings.front.pressureDissipation,curlStrength:0,radius:0}),this.fluid.splatMaterial.uniforms.uAspect.value=e.aspectRatio}addEvents(){e.emitter.on("toggle:start",this.onToggleStart.bind(this))}onToggleStart(){this.fluid.densityDissipation=e.isBackMode?this.fluidSettings.back.densityDissipation:this.fluidSettings.front.densityDissipation,this.fluid.velocityDissipation=e.isBackMode?this.fluidSettings.back.velocityDissipation:this.fluidSettings.front.velocityDissipation,this.fluid.pressureDissipation=e.isBackMode?this.fluidSettings.back.pressureDissipation:this.fluidSettings.front.pressureDissipation,this.fluidMaxRadius=e.isBackMode?this.fluidBackRadius:this.fluidFrontRadius,this._fluidIdleFrames=0}initControls(){!e.isDebug||!e.GUI||(this.gui=new e.GUI({closeFolders:!0}))}createRT(t=1){const n=typeof t=="function"?t:()=>t,o=Math.round(e.width*n()),r=Math.round(e.height*n()),i=new k(o,r,{minFilter:w,magFilter:w,depthBuffer:!1,stencilBuffer:!1});return i.texture.generateMipmaps=!1,this.rts.push({scaleFn:n,rt:i}),i}mousemove(t){if(!this.fluid)return;const n=t.clientX,o=t.clientY;if(n==null||o==null||t.pointerType==="touch"&&!t.isDown||e.isTransitioning&&!e.isBackMode)return;const r=t.dx??0,i=t.dy??0;if(this.speed=Math.abs(r)+Math.abs(i),Math.abs(r)>.2||Math.abs(i)>.2){const a=(e.isBackMode,5);this.fluid.splats.push({x:n/e.width,y:1-o/e.height,dx:r*a,dy:i*-a}),this._fluidIdleFrames=0}this.planet.mousemove()}resize(){const t=this._lastW!==e.width||this._lastH!==e.height||this._lastDpr!==e.dpr;this._lastW=e.width,this._lastH=e.height,this._lastDpr=e.dpr,this.camera.aspect=e.aspectRatio,this.camera.updateProjectionMatrix();const n=this.camera.fov*Math.PI/180;this.heightAtZ=2*Math.tan(n/2)*this.camera.position.z,this.widthAtZ=this.heightAtZ*this.camera.aspect,this.uniforms.uRes.value.set(e.width,e.height),this.uniforms.uDpr.value=e.dpr,this.fluid&&(this.fluid.splatMaterial.uniforms.uAspect.value=e.aspectRatio),t&&(this.renderer.setPixelRatio(e.dpr),this.renderer.setSize(e.width,e.height),this.rts.forEach(({rt:o,scaleFn:r})=>{o.setSize(Math.round(e.width*r()),Math.round(e.height*r()))})),requestAnimationFrame(()=>{requestAnimationFrame(()=>{this.dirty()})})}warm(){this.ready&&(this.texts?.render(),this.titles?.render(),this.images?.render(),this.video?.render(),this.front?.render(),this.fluid?.update(1/60),this.warmRoutePrograms(),this.renderer.setRenderTarget(null))}warmRoutePrograms(){const t=[{vertexShader:C,fragmentShader:le,geometry:this.geometry}];e.isTouch||t.push({vertexShader:ce,fragmentShader:ue,geometry:this.mediaGeometry});try{const n=new y;this._warmMaterials=t.map(o=>{const r=new g({vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,transparent:!0,depthWrite:!0,depthTest:!0});return n.add(new d(o.geometry,r)),r}),this.renderer.compile(n,this.flatCamera)}catch{}}loop(t,n){if(!this.ready||!e.loaded)return;if(e.introActive){if(this._lastIntroT!=null&&t-this._lastIntroT<1/30)return;this._lastIntroT=t,e.stats?.begin(),this.uniforms.uTime.value=t,this.stars?.loop(),this.planet?.loop(t,n),this.fog?.loop(),this.back?.loop(),this.output?.loop(),e.stats?.end();return}if(e.isSafari){if(this._lastRenderT!=null){if(t-this._lastRenderT<1/60-.004)return;n=(t-this._lastRenderT)*1e3}this._lastRenderT=t}e.stats?.begin(),this.uniforms.uTime.value=t;const o=this.renderer.info.render.frame;if(this.fluid){const r=this.fluid.radius>=0?this.fluid.radius:0,i=ee(0,this.fluidMaxRadius,this.speed)*.01;if(this.fluid.radius=F(r,i,.1),(this._fluidIdleFrames??0)<150){this._fluidIdleFrames=(this._fluidIdleFrames??0)+1;const a=Math.min(n/1e3,1/20);this.fluid.update(a),this.uniforms.tFluid.value=this.fluid.uniform.value}}this.stars?.loop(),this.planet?.loop(t,n),this.fog?.loop(),this.texts?.loop(),this.titles?.loop(),this.images?.loop(),this.video?.loop(),this.back?.loop(),this.front?.loop(),(e.isTouch||this.renderer.info.render.frame>o)&&this.output?.loop(),e.stats?.end()}}export{Je as default};
//# sourceMappingURL=World.CU9fEfCq.js.map
