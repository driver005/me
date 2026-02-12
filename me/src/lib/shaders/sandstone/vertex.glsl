varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;

uniform float heightScale;

// High quality hash
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

// FBM with controllable octaves
float fbm(vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for(int i = 0; i < 6; i++) {
        if(i >= octaves) break;
        v += a * noise(p);
        p = rot * p * 2.0 + 50.0;
        a *= 0.5;
    }
    return v;
}

// Sedimentary layer displacement - emphasizes horizontal bands
float sedimentDisplace(vec2 uv) {
    // Large gentle undulations
    float large = fbm(uv * 0.5, 3) * 0.5;

    // Medium erosion patterns
    float medium = fbm(uv * 2.0, 4) * 0.3;

    // Fine weathering detail
    float fine = fbm(uv * 8.0, 5) * 0.15;

    // Subtle horizontal striations
    float strata = sin(uv.y * 12.0 + fbm(uv * 3.0, 3) * 2.0) * 0.05;

    return large + medium + fine + strata;
}

void main() {
    vec3 pos = position;
    vec2 uv = (modelMatrix * vec4(position, 1.0)).xz * 0.15;

    float height = sedimentDisplace(uv);
    pos.y += height * heightScale;

    // Calculate normal from height differences
    float eps = 0.05;
    float hL = sedimentDisplace(uv - vec2(eps, 0.0));
    float hR = sedimentDisplace(uv + vec2(eps, 0.0));
    float hD = sedimentDisplace(uv - vec2(0.0, eps));
    float hU = sedimentDisplace(uv + vec2(0.0, eps));

    vec3 calcNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
    vNormal = normalize((modelMatrix * vec4(calcNormal, 0.0)).xyz);

    vHeight = height;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}

