vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
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
}