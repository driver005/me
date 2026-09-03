precision mediump float;
precision mediump sampler2D;

uniform sampler2D uVelocity;

in highp vec2 vUv;
in highp vec2 vL;
in highp vec2 vR;
in highp vec2 vT;
in highp vec2 vB;

out vec4 FragColor;

void main () {
    float L = texture(uVelocity, vL).y;
    float R = texture(uVelocity, vR).y;
    float T = texture(uVelocity, vT).x;
    float B = texture(uVelocity, vB).x;
    float vorticity = R - L - T + B;

    FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
