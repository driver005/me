uniform float uMode;
uniform float uScale;
uniform float uCurveStrength;

varying vec2 vUv;

void main() {
    vUv = uv;

    vec3 pos = position;

    float mode = 1.0 - uMode;

    pos.xy *= mix(1.0, uScale, mode);

    vec2 ndc = (uv - 0.5) * 2.0;
    float r2 = dot(ndc, ndc);
    pos.z -= r2 * uCurveStrength * mode;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
