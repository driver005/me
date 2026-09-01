varying vec2 vUv;
uniform sampler2D tBack;
uniform sampler2D tFluid;

void main() {
    vec4 back = texture2D(tBack, vUv);
    vec3 fluid = texture2D(tFluid, vUv).rgb;
    float intensity = length(fluid.rg);
    float fluidMask = 1.0 - smoothstep(0.001, 0.003, intensity);

    gl_FragColor = mix(back, vec4(1.0), fluidMask);
}
