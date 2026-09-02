varying vec2 vUv;

uniform float uSpeed;

uniform float uProgress;

uniform float uWarp;

uniform float uHover;

uniform float uMode;

uniform float uCurveZ;

uniform float uCurveX;

/** 0 = vertical strip (home gallery — items translate along Y, this shader's original axis).
 *  1 = horizontal strip (a sub-page carousel — items translate along X). Generalizes the speed-warp
 *  below so both carousels get it, instead of it being silently Y-only. */
uniform float uAxis;


void main() {
    vUv = uv;


    vec3 pos = position;

    vec3 posA = position;


    posA.y -= mix(1.5, 0.0, uProgress);


    vec4 clipA = projectionMatrix * modelViewMatrix * vec4(posA, 1.0);

    float ndcY = clipA.y / clipA.w;

    float screenY = ndcY * 0.5 + 0.5;


    vec4 mvA = modelViewMatrix * vec4(posA, 1.0);

    float distanceFromCentre = abs(mix(mvA.y, mvA.x, uAxis));

    float warp = 1.0 - pow(distanceFromCentre, 2.) * mix(-.00015, -(uSpeed*.2), uProgress);


    float mask = 1.0 - smoothstep(.5, .6, screenY) * (1.0 - uWarp);

    // The vertical strip is part of the home front/back toggle, so its squash fades out along with
    // uMode (no distortion once the view goes immersive) — that's the source's own behavior. A
    // horizontal strip (a sub-page carousel) isn't part of that toggle and sits at uMode≈0 permanently
    // (see +layout.svelte's route effect), so gating on uMode there would silence the effect entirely —
    // give it a small fixed gate instead of uMode's ~0. Capped well under 1: unlike the vertical strip
    // (whose distanceFromCentre stays small, vertex-local, most of the time), a horizontal strip's
    // items travel much further off-centre while scrolling, so the same warp formula reads far
    // stronger there — this constant is tuned down to compensate, not a stand-in for uMode.
    float modeGate = mix(uMode, 0.15, uAxis);

    float warpMix = mix(1.0, warp, mask * modeGate);

    // Vertical strip squashes width (pos.x) as it speeds past; horizontal squashes height (pos.y)
    // instead — same effect, perpendicular to whichever axis the strip actually scrolls along.
    pos.x *= mix(warpMix, 1.0, uAxis);

    pos.y *= mix(1.0, warpMix, uAxis);


    vec2 ndc = (uv - 0.5) * 2.0;

    float r2 = dot(ndc, ndc);

    float crtStrength = -1.85;

    pos.z += crtStrength * r2 * abs(1.0 - uMode);


    float planeDist = abs((modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y);

    float curved = planeDist * planeDist;

    pos.z -= curved * uCurveZ * abs(1.0 - uMode);

    pos.x += curved * uCurveX * abs(1.0 - uMode);

    float angle = curved * -0.0001 * abs(1.0 - uMode);


    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

}
