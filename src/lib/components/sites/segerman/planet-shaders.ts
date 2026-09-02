// Real vertex + fragment shaders for segerman.dev's persistent "planet" mesh,
// pulled verbatim out of their own bundle (static/sites/segerman-dev-86ede42f/
// root-7944de32/js/world.js). This one mesh is present on every page
// (home/work/info/error — see the `pages` config in the `Le` class) at a
// different position/scale, and only gets cursor interactivity (terrain
// bump + crack reveal) when `pageId === "work" && isBackMode`.

export const PLANET_VERTEX = /* glsl */ `
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

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

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
`;

export const PLANET_FRAGMENT = /* glsl */ `
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
}
`;
