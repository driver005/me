uniform sampler2D uTexture;
uniform float uColorStrength;
uniform float uZoom;
uniform vec2 uPlaneSizes;
uniform vec2 uImageSizes;
uniform float uRevealProgress;

// The real compositor's own effect (output-fragment.glsl's tFluid/fluidMask, ported here) — NOT a
// permanently-gray duotone look, despite this uniform's name (kept for compatibility with existing
// callers). Every image is grainy black/navy-and-white duotone (card/fragment.glsl's uImageMode>=0.5
// branch, ported verbatim below) by default, EXCEPT where the cursor's own fluid trail has recently
// passed — there the real, full-colour image shows through in a soft circle, fading back to duotone
// as that trail dissipates (see main()'s fluidMask, driven by uTFluid — the SAME screen-space dye
// texture the compositor's own white/colour reveal samples). Only active when uDuotone > 0.5.
uniform float uDuotone;
uniform vec3 uDarkColor;
uniform vec3 uLightColor;
uniform float uInputBlack;
uniform float uInputWhite;
uniform float uGamma;
uniform float uNoiseSize;
uniform float uNoiseAmount;
uniform float uDpr;
uniform sampler2D uTFluid;
uniform vec2 uRes;

varying vec2 vUv;

float roundedRectSDF(vec2 uv, vec2 size, float radius) {
	vec2 d = abs(uv - 0.5) - size * 0.5 + radius;
	return length(max(d, 0.0)) - radius;
}

float spiralRand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float spiralNoise(vec2 p) {
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u * u * (3.0 - 2.0 * u);
	float res = mix(
		mix(spiralRand(ip), spiralRand(ip + vec2(1.0, 0.0)), u.x),
		mix(spiralRand(ip + vec2(0.0, 1.0)), spiralRand(ip + vec2(1.0, 1.0)), u.x),
		u.y
	);
	return res * res;
}

void main() {
	vec2 ratio = vec2(
		min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
		min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
	);

	vec2 uv = vec2(
		vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
		vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
	);

	vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

	vec4 color;

	if (gl_FrontFacing) {
		color = texture2D(uTexture, zoomedUv);
		color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), uColorStrength);
	} else {
		float offset = 40.0 / 1024.0;
		vec4 c = vec4(0.0);
		c += texture2D(uTexture, uv + vec2(-offset, -offset)) * 1.0;
		c += texture2D(uTexture, uv + vec2( 0.0,    -offset)) * 2.0;
		c += texture2D(uTexture, uv + vec2( offset, -offset)) * 1.0;
		c += texture2D(uTexture, uv + vec2(-offset,  0.0))    * 2.0;
		c += texture2D(uTexture, uv)                          * 4.0;
		c += texture2D(uTexture, uv + vec2( offset,  0.0))    * 2.0;
		c += texture2D(uTexture, uv + vec2(-offset,  offset)) * 1.0;
		c += texture2D(uTexture, uv + vec2( 0.0,     offset)) * 2.0;
		c += texture2D(uTexture, uv + vec2( offset,  offset)) * 1.0;
		c /= 16.0;
		color = c;
	}

	if (uDuotone > 0.5) {
		vec2 dUvDx = dFdx(uv);
		vec2 dUvDy = dFdy(uv);
		float grainDevPx = max(1.0, uNoiseSize * uDpr);
		float uvPerDevPx = max(length(dUvDx), length(dUvDy));
		float grainUv = max(uvPerDevPx * grainDevPx, 1e-6);
		vec2 p = uv / grainUv;
		float n = spiralNoise(p * 8.0);

		vec4 tNoise = color + (n * uNoiseAmount);
		tNoise = color * tNoise + (n * uNoiseAmount);

		float lum = dot(tNoise.rgb, vec3(0.299, 0.587, 0.114));
		vec3 gcol = vec3(lum);

		float inBlack = uInputBlack / 255.0;
		float inWhite = uInputWhite / 255.0;
		float mid = uGamma / 100.0;

		gcol = (gcol - inBlack) / (inWhite - inBlack);
		gcol = clamp(gcol, 0.0, 1.0);
		gcol = pow(gcol, vec3(1.0 / mid));
		gcol = clamp(gcol, 0.0, 1.0);

		float g = clamp(dot(gcol, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
		vec3 duotoneColor = mix(uDarkColor, uLightColor, g);

		// output-fragment.glsl's own fluidMask, verbatim (same screen-space dye texture, same
		// intensity thresholds) — gl_FragCoord/uRes gives this fragment's screen-space uv, since
		// vUv/uv above are the CARD's own local uv, not screen position. fluidMask=1 (no recent
		// cursor disturbance here) keeps the duotone; fluidMask=0 (cursor trail has passed through)
		// reveals the real colour underneath, exactly like the compositor's own page-wide version.
		vec2 screenUv = gl_FragCoord.xy / uRes;
		vec3 fluid = texture2D(uTFluid, screenUv).rgb;
		float intensity = length(fluid);
		float fluidMask = 1.0 - smoothstep(0.001, 0.003, intensity);

		color.rgb = mix(color.rgb, duotoneColor, fluidMask);
	}

	float reveal = clamp(uRevealProgress, 0.0, 1.0);
	vec2 revealSize = vec2(reveal);
	float baseRadius = 0.05;
	float radius = baseRadius * reveal;
	float sdf = roundedRectSDF(vUv, revealSize, radius);
	float edge = 0.002;
	float alpha = 1.0 - smoothstep(0.0, edge, sdf);
	alpha *= smoothstep(0.1, 1.0, uRevealProgress);

	gl_FragColor = vec4(color.rgb, alpha);
}
