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
}
