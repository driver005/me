varying vec2 vUv;

uniform float uSpeed;

uniform float uProgress;

uniform float uWarp;

uniform float uHover;

uniform float uMode;

uniform float uCurveZ;

uniform float uCurveX;


void main() {
    vUv = uv;


    vec3 pos = position;

    vec3 posA = position;


    // Ported from a vertically-scrolling gallery (the original scrolls up/down, so this shader's
    // warp/mask/curve math keys off each card's vertical screen position — its "distance from centre"
    // as it scrolls through view). This port's gallery scrolls horizontally instead (phase 2b's own
    // design choice), so every card sat at nearly identical Y regardless of scroll position, making
    // this math near-inert and producing warp/entrance motion that read as vertical on a horizontal
    // layout. Swapped to key off X, matching this port's actual scroll axis.
    posA.x -= mix(1.5, 0.0, uProgress);


    vec4 clipA = projectionMatrix * modelViewMatrix * vec4(posA, 1.0);

    float ndcX = clipA.x / clipA.w;

    float screenX = ndcX * 0.5 + 0.5;


    float distanceFromCentre = abs((modelViewMatrix * vec4(posA, 1.0)).x);

    float warp = 1.0 - pow(distanceFromCentre, 2.) * mix(-.00015, -(uSpeed*.2), uProgress);


    float mask = 1.0 - smoothstep(.5, .6, screenX) * (1.0 - uWarp);

    pos.x *= mix(1.0, warp, mask * uMode);


    vec2 ndc = (uv - 0.5) * 2.0;

    float r2 = dot(ndc, ndc);

    float crtStrength = -1.85;

    pos.z += crtStrength * r2 * abs(1.0 - uMode);


    float planeDist = abs((modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).x);

    float curved = planeDist * planeDist;

    pos.z -= curved * uCurveZ * abs(1.0 - uMode);

    pos.x += curved * uCurveX * abs(1.0 - uMode);

    float angle = curved * -0.0001 * abs(1.0 - uMode);


    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

}
