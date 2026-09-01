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


    posA.y -= mix(1.5, 0.0, uProgress);


    vec4 clipA = projectionMatrix * modelViewMatrix * vec4(posA, 1.0);

    float ndcY = clipA.y / clipA.w;

    float screenY = ndcY * 0.5 + 0.5;


    float distanceFromCentre = abs((modelViewMatrix * vec4(posA, 1.0)).y);

    float warp = 1.0 - pow(distanceFromCentre, 2.) * mix(-.00015, -(uSpeed*.2), uProgress);


    float mask = 1.0 - smoothstep(.5, .6, screenY) * (1.0 - uWarp);

    pos.x *= mix(1.0, warp, mask * uMode);


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
