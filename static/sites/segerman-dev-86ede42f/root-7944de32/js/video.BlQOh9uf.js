var n=`vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
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
uniform sampler2D tMap;
uniform vec2 uSizes;
uniform vec2 uPlaneSizes;
uniform float uOffsetY;
uniform float uImageMode;
uniform float uHover;

uniform float uSaturation;

uniform vec3 uLightColor;
uniform vec3 uDarkColor;
uniform float uInputBlack;
uniform float uInputWhite;
uniform float uGamma;
uniform float uNoiseSize;
uniform float uNoiseAmount;
uniform float uDpr;
uniform vec2 uRes;

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
    
    vec2 uv = vUv;
    uv = uv * 0.998 - 0.001;
    uv.y += uOffsetY * 1.001;

    
    vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uSizes.x / uSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uSizes.y / uSizes.x), 1.0)
    );
    vec2 uvI = vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    
    float s = 1.0 - uHover * 0.08;
    vec2 center = vec2(0.5);
    uvI = (uvI - center) * s + center;

    vec4 final = vec4(0.);

    if (uImageMode < .5) {
        
        vec4 t = texture2D(tMap, uvI);

        vec3 col = t.rgb;

        float frontLum = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(frontLum), col, uSaturation);

        final = vec4(col, t.a);

    } else {
        

        vec4 t = texture2D(tMap, uvI);
        float grainDevPx = max(1.0, uNoiseSize * uDpr);

        vec2 dUvDx = dFdx(uv);
        vec2 dUvDy = dFdy(uv);

        float uvPerDevPx = max(length(dUvDx), length(dUvDy));
        float grainUv = max(uvPerDevPx * grainDevPx, 1e-6);

        vec2 p = uvI / grainUv;

        float freq = 8.0;
        float n = noise(p * freq);
        

        float noiseAmount = uNoiseAmount;

        vec4 tNoise = t + (n * noiseAmount);
        tNoise = t * tNoise + (n * noiseAmount);

        float lum = dot(tNoise.rgb, vec3(0.299, 0.587, 0.114));
        vec3 col = vec3(lum);

        float inBlack = uInputBlack / 255.0;
        float inWhite = uInputWhite / 255.0;
        float mid     = uGamma / 100.0;

        col = (col - inBlack) / (inWhite - inBlack);
        col = clamp(col, 0.0, 1.0);
        col = pow(col, vec3(1.0 / mid));
        col = clamp(col, 0.0, 1.0);

        float g = dot(col, vec3(0.299, 0.587, 0.114));
        g = clamp(g, 0.0, 1.0);

        vec3 overlay = mix(uDarkColor, uLightColor, g);

        final = vec4(overlay, 1.0);
    }

    

    float inside = step(0.0, uv.y) * (1.0 - step(1.0, uv.y));
    final.a *= inside;

    gl_FragColor = final;
}`,e=`vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
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
uniform sampler2D tMap;
uniform sampler2D tThumb;
uniform vec2 uSizes;
uniform vec2 uThumbSizes;
uniform vec2 uPlaneSizes;
uniform float uOffsetY;
uniform float uBackMode;
uniform float uLoad;

void main() {
    
    vec2 uv = vUv;
    uv = uv * 0.996 + 0.002;
    uv.y += uOffsetY;

    
    vec2 thumbRatio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uThumbSizes.x / uThumbSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uThumbSizes.y / uThumbSizes.x), 1.0)
    );
    vec2 thumbUvI = vec2(
    uv.x * thumbRatio.x + (1.0 - thumbRatio.x) * 0.5,
    uv.y * thumbRatio.y + (1.0 - thumbRatio.y) * 0.5
    );

    vec4 thumb = texture2D(tThumb, thumbUvI);

    vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uSizes.x / uSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uSizes.y / uSizes.x), 1.0)
    );
    vec2 uvI = vec2(
    uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    vec4 final = texture2D(tMap, uvI);

    float inside = step(0.0, uv.y) * (1.0 - step(1.0, uv.y));
    thumb.a *= inside;
    final.a *= inside;

    gl_FragColor = mix(thumb, final, uLoad);
}`;export{n as i,e as v};
//# sourceMappingURL=video.BlQOh9uf.js.map
