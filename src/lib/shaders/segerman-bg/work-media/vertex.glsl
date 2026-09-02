varying vec2 vUv;
uniform float uSpeed;
uniform float uWarp;
uniform float uHover;
uniform float uMode;

void main() {
    vUv = uv;
    vec3 pos = position;
    vec3 posBack = position;
    float speed = uSpeed * 200.;

    float t = pos.y / (1. * 0.5);
    float arc = 1.0 - t * t;
    pos.x += uWarp * (t * t) * 1.;
    pos.x += speed * (t * t) * .6;

    vec4 front = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    vec4 worldPos = modelMatrix * vec4(posBack, 1.0);
    float worldX = worldPos.x;

    float R = 200.0;
    float theta = worldX / R;

    worldPos.x = R * sin(theta);
    worldPos.z += R * (cos(theta) - 1.0);

    vec4 back = projectionMatrix * viewMatrix * worldPos;

    vec4 final = mix(back, front, uMode);

    gl_Position = final;
}
