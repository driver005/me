precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;
uniform float value;

in highp vec2 vUv;

out vec4 FragColor;

void main () {
    FragColor = value * texture(uTexture, vUv);
}
