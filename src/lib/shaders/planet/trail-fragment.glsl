uniform sampler2D tTrail;
uniform vec2 uRes;
uniform vec2 uMouseUV;
uniform float uDecay;
uniform float uStampRadius;
uniform float uActive;

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;

    float existing = texture2D(tTrail, uv).r * uDecay;


    float dist  = length(uv - uMouseUV);
    float stamp = uActive * pow(smoothstep(uStampRadius, 0.0, dist), 2.0);


    gl_FragColor = vec4(max(existing, stamp), 0.0, 0.0, 1.0);
}
