precision highp float;
precision highp sampler2D;

uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

in vec2 vUv;

out vec4 FragColor;

void main () {
    vec2 p = vUv - point.xy;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture(uTarget, vUv).xyz;

    FragColor = vec4(base + splat, 1.0);
}
