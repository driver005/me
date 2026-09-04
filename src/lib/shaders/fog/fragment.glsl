varying vec2 vUv;
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
uniform float uCoverage;
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
    // uColor (fog.ts's own default navy '#20447e', or a project's dark color) is dark enough on its own
    // that at uDarkMul/uMidMul/uLightLift's default of 1 the rendered fog color comes out near-black
    // (confirmed via a render-target readback: rgb ~2,9,34 out of 255) — invisible once blended in
    // regardless of how high alpha/coverage is. FOG_COLOR_STR used to compensate for this on the
    // compositor side; removed along with FOG_AMBIENT per request, leaving nothing to brighten it. Baked
    // in here instead, on the color itself rather than as a separate tunable dial.
    color *= 3.6;

    float density = f*f*f + .6*f*f + .5*f;
    // Moving the threshold made the CONTROL linear but not the RESULT — how much on-screen area clears
    // a given threshold depends on the noise field's own (unmeasured) distribution, so equal steps in
    // coverage never produced equal steps in visible area. Fixed by splitting shape from amount: the
    // spatial SHAPE is now a fixed pattern — coverage no longer touches it at all — and uCoverage scales
    // that one fixed shape's opacity by a plain multiply, which IS linear by construction: 0 is exactly
    // none, 1 is exactly the full shape, 0.5 is exactly half its opacity everywhere.
    //
    // Lower edge 0.0 (not -0.5): density's own true minimum, so the darkest points genuinely hit 0
    // opacity instead of an always-on ~26% floor. Upper edge lowered further (0.5 -> 0.32): density's
    // practical range rarely exceeds ~1, so even 0.5 still left a lot of the field under-saturated —
    // pulling the ceiling in further means more of the typical (not just peak) range reaches full
    // opacity, reading as denser/heavier overall.
    float shape = smoothstep(0.0, 0.32, density);
    density = shape * uCoverage * uHasFog;

    gl_FragColor = vec4(density * color, density);
}
