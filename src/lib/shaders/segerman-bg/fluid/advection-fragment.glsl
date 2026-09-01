precision highp float;
precision highp sampler2D;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

in vec2 vUv;

out vec4 FragColor;

void main () {
    vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;

    FragColor = dissipation * texture(uSource, coord);
    FragColor.a = 1.0;
}
