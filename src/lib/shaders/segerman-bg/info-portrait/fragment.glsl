varying vec2 vUv;
uniform sampler2D tMap;
uniform vec2 uSizes;
uniform vec2 uPlaneSizes;

void main() {
    // "Cover" UV mapping (same formula as card/fragment.glsl) — the plane now stretches to fill its
    // half/full viewport exactly, so without this the image would distort to match instead of cropping.
    vec2 ratio = vec2(
        min((uPlaneSizes.x / uPlaneSizes.y) / (uSizes.x / uSizes.y), 1.0),
        min((uPlaneSizes.y / uPlaneSizes.x) / (uSizes.y / uSizes.x), 1.0)
    );
    vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    gl_FragColor = texture2D(tMap, uv);
}
