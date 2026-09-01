varying vec2 vUv;

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
}