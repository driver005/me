varying vec2 vUv;
uniform float uMode;
uniform float uRadius;
uniform float uSize;
uniform float uProgress;
uniform vec3 uColor;
uniform float uOffset;

void main() {
    vec2 uv = vUv;
    uv.y += uOffset;

    float r = uRadius * .95;
    float r2 = uRadius * uSize;
    float x = mix(.9, -.9, uProgress);
    float y = mix(1., -1., uProgress);
    vec2 offset = vec2(x, y);
    offset *= r2;

    float feather = 0.025;
    vec2 p = uv - 0.5;

    float d1 = length(p);
    float d2 = length(p - offset);

    float c1 = 1.0 - smoothstep(r - feather, r + feather, d1);
    float c2 = 1.0 - smoothstep(r2 - feather, r2 + feather, d2);

    float inside = step(0.0, uv.y) * (1.0 - step(1.0, uv.y));
    float alpha = clamp(c1 - c2, 0.0, 1.0) * inside;

    vec3 col = uColor;
    gl_FragColor = vec4(col, alpha);
}
