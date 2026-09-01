varying vec2 vUv;
uniform sampler2D tBack;

void main() {
    gl_FragColor = texture2D(tBack, vUv);
}
