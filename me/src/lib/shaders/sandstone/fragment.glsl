precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;

// Hash and noise functions
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// FBM for texture detail
float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for(int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        v += a * noise(p);
        p = rot * p * 2.0 + 10.0;
        a *= 0.5;
    }
    return v;
}

// Domain warping for natural patterns
vec2 warp(vec2 p) {
    return vec2(
        fbm(p + vec2(1.7, 9.2), 4),
        fbm(p + vec2(8.3, 2.8), 4)
    );
}

// Sedimentary band pattern
float sedimentBands(vec2 uv) {
    // Horizontal stratification with slight waviness
    float waveOffset = fbm(uv * 2.0, 3) * 0.4;
    float bands = sin((uv.y + waveOffset) * 25.0) * 0.5 + 0.5;

    // Add cross-bedding effect
    float crossBed = sin((uv.x * 0.3 + uv.y) * 15.0 + fbm(uv * 4.0, 3) * 1.5) * 0.5 + 0.5;
    bands = mix(bands, crossBed, 0.3);

    return smoothstep(0.3, 0.7, bands);
}

void main() {
    vec2 uv = vWorldPos.xz * 0.15;

    // Domain warp for organic feel
    vec2 warpedUV = uv + warp(uv * 0.8) * 0.3;

    // Sedimentary layers
    float layers = sedimentBands(warpedUV);

    // Fine grain texture
    float grain = fbm(warpedUV * 40.0, 5);
    float microGrain = noise(warpedUV * 120.0);

    // Weathering and erosion marks
    float weathering = fbm(warpedUV * 6.0, 4);
    float cracks = pow(1.0 - fbm(warpedUV * 20.0, 6), 4.0) * 0.15;

    // Realistic sandstone color palette
    vec3 darkRust = vec3(0.55, 0.35, 0.22);      // Deep iron-rich layer
    vec3 warmBrown = vec3(0.72, 0.52, 0.35);    // Mid-tone sandstone
    vec3 sandyTan = vec3(0.85, 0.72, 0.55);     // Light sandy layer
    vec3 creamHigh = vec3(0.95, 0.88, 0.75);    // Highlights
    vec3 redOxide = vec3(0.65, 0.38, 0.28);     // Iron oxide streak

    // Build color from layers
    vec3 color = mix(darkRust, warmBrown, layers);
    color = mix(color, sandyTan, layers * 0.6 + grain * 0.2);
    color = mix(color, creamHigh, pow(layers, 2.0) * 0.4);

    // Add iron oxide streaks
    float oxideStreak = smoothstep(0.6, 0.8, fbm(warpedUV * vec2(1.0, 8.0), 4));
    color = mix(color, redOxide, oxideStreak * 0.25);

    // Add subtle color variation per band
    float colorVar = fbm(warpedUV * 10.0, 3) * 0.1;
    color += vec3(colorVar * 0.5, colorVar * 0.3, -colorVar * 0.2);

    // Lighting
    vec3 lightDir = normalize(vec3(0.4, 1.0, 0.3));
    vec3 normal = normalize(vNormal);

    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.35;

    // Soft shadows in crevices
    float ao = 1.0 - weathering * 0.3;

    vec3 lighting = vec3(ambient + diffuse * 0.65) * ao;
    color *= lighting;

    // Apply grain and weathering
    color -= microGrain * 0.04;
    color -= cracks;

    // Subtle warm color grading
    color = pow(color, vec3(0.95, 1.0, 1.05));

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}

