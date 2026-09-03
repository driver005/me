// Source: jsulpis/realtime-planet-shader (https://github.com/jsulpis/realtime-planet-shader),
// GPL-3.0 License — the terrain/cloud algorithm ported from that repo's procedural.fragment.glsl (see
// CREDITS.md at the repo root). Shared by procedural.fragment.glsl (the /skills/[slug] skillPlanet) AND
// earth.fragment.glsl's little orbiting moons on /skills (its intersectMoonFull) — both call the
// functions below, so a moon and the planet it orbits use the exact same terrain generator, just at
// different scales/tints.
//
// Requires the includer to already declare `uniform float uTime;`, and the functions `float
// inverseLerp(float,float,float)` / `float remap(float,float,float,float,float)` (both
// earth.fragment.glsl and procedural.fragment.glsl already do, ahead of their own #include of this
// file) — not redeclared here to avoid duplicate-definition errors when this file is included into a
// shader that already has its own copies.
//
// uNoiseTexture (sampler3D) doesn't exist in this project — terrainNoise3D()/terrainFbm() below are a
// standard analytic hash-based value noise instead (the same technique earth.fragment.glsl's own
// moonNoise3D used before this file existed), not the original's texture(uNoiseTexture, p*.05).r.

uniform float uQuality;

#define TERRAIN_WATER_COLOR_DEEP vec3(0.01, 0.05, 0.15)
#define TERRAIN_WATER_COLOR_SURFACE vec3(0.02, 0.12, 0.27)
#define TERRAIN_SAND_COLOR vec3(1.0, 1.0, 0.85)
#define TERRAIN_TREE_COLOR vec3(.02, .1, .06)
#define TERRAIN_ROCK_COLOR vec3(0.15, 0.12, 0.12)
#define TERRAIN_ICE_COLOR vec3(0.8, .9, .9)
#define TERRAIN_CLOUD_COLOR vec3(1., 1., 1.)

#define TERRAIN_WATER_SURFACE_LEVEL 0.0
#define TERRAIN_SAND_LEVEL .028
#define TERRAIN_TREE_LEVEL .03
#define TERRAIN_ROCK_LEVEL .1
#define TERRAIN_ICE_LEVEL .15
#define TERRAIN_TRANSITION .02

float terrainHash3D(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float terrainNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(terrainHash3D(i + vec3(0., 0., 0.)), terrainHash3D(i + vec3(1., 0., 0.)), f.x), mix(terrainHash3D(i + vec3(0., 1., 0.)), terrainHash3D(i + vec3(1., 1., 0.)), f.x), f.y),
    mix(mix(terrainHash3D(i + vec3(0., 0., 1.)), terrainHash3D(i + vec3(1., 0., 1.)), f.x), mix(terrainHash3D(i + vec3(0., 1., 1.)), terrainHash3D(i + vec3(1., 1., 1.)), f.x), f.y),
    f.z
  );
}

// Ported from procedural.fragment.glsl's own fbm() — uQuality-based octave degradation kept (both
// includers already receive uQuality via RaymarchPlanet's commonUniforms).
float terrainFbm(vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  float amplitude = 0.5;
  float frequency = 3.0;
  float total = 0.0;
  float normalization = 0.0;
  int qualityDegradation = 2 - int(floor(uQuality)); // 0 when quality=optimal, 2 when quality=low
  int octavesWithQuality = max(octaves - qualityDegradation, 1);

  for(int i = 0; i < octavesWithQuality; ++i) {
    float noiseValue = terrainNoise3D(p * frequency);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  total /= normalization;
  total = total * 0.8 + 0.1;
  total = pow(total, exponentiation);

  return total;
}

float terrainDomainWarpingFbm(vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  vec3 offset = vec3(
    terrainFbm(p, octaves, persistence, lacunarity, exponentiation),
    terrainFbm(p + vec3(43.235, 23.112, 0.0), octaves, persistence, lacunarity, exponentiation),
    0.0
  );

  return terrainFbm(p + 1. * offset, 2, persistence, lacunarity, exponentiation);
}

// Un-scaled flattened fbm (oceans smoothed toward flat) — used as a bump amount added straight to a
// sphere's radius (see procedural.fragment.glsl's planetDist()). terrainAltitude() below is this times
// 5, the value the colour bands and cloud mask actually threshold against.
float terrainNoiseRaw(vec3 p, float terrainScale, float noiseStrength) {
  float n = terrainFbm(p * terrainScale, 6, .5, 2., 5.) * noiseStrength;
  return mix(n / 3. + noiseStrength / 50., n, smoothstep(TERRAIN_SAND_LEVEL, TERRAIN_SAND_LEVEL + TERRAIN_TRANSITION / 2., n * 5.));
}

float terrainAltitude(vec3 p, float terrainScale, float noiseStrength) {
  return 5. * terrainNoiseRaw(p, terrainScale, noiseStrength);
}

// Water/sand/tree/rock/ice bands from a single fbm "altitude" value, tinted by `tint` (a skill's own
// colour) — no bump-perturbed normal (a caller with no terrain-height concept of its own, like a tiny
// moon, just gets a flat-shaded band colour). `outSpecular` mirrors the original's sand-level highlight.
//
// `hillBias` (-1..1, 0 = the reference shader's own original mix) shifts every band's own threshold
// down as it rises toward +1 — the fbm altitude then crosses into sand/tree/rock/ice sooner, so less
// of the sphere reads as water and more as hills/rock ("a lot of hills" for a statically-typed
// language's own skill planet/moon — see raymarch-planet.ts's getHillBiasForSkill()). Toward -1 the
// thresholds rise instead, so altitude has to climb much higher before leaving water at all ("a lot of
// water" for a dynamically-typed one). TERRAIN_WATER_SURFACE_LEVEL itself is never shifted — water
// only ever starts at sea level (altitude 0); biasing it too would just uniformly deepen or shallow
// the ocean floor's own colour, not change how much of the surface stays underwater.
vec3 terrainBandColor(float altitude, vec3 tint, float hillBias, out float outSpecular) {
  float sandLevel = TERRAIN_SAND_LEVEL - hillBias * 0.02;
  float treeLevel = TERRAIN_TREE_LEVEL - hillBias * 0.02;
  float rockLevel = TERRAIN_ROCK_LEVEL - hillBias * 0.06;
  float iceLevel = TERRAIN_ICE_LEVEL - hillBias * 0.08;

  vec3 color = mix(TERRAIN_WATER_COLOR_DEEP, TERRAIN_WATER_COLOR_SURFACE, smoothstep(TERRAIN_WATER_SURFACE_LEVEL, TERRAIN_WATER_SURFACE_LEVEL + TERRAIN_TRANSITION, altitude));
  color = mix(color, TERRAIN_SAND_COLOR, smoothstep(sandLevel, sandLevel + TERRAIN_TRANSITION / 2., altitude));
  color = mix(color, TERRAIN_TREE_COLOR, smoothstep(treeLevel, treeLevel + TERRAIN_TRANSITION, altitude));
  color = mix(color, TERRAIN_ROCK_COLOR, smoothstep(rockLevel, rockLevel + TERRAIN_TRANSITION, altitude));
  color = mix(color, TERRAIN_ICE_COLOR, smoothstep(iceLevel, iceLevel + TERRAIN_TRANSITION, altitude));
  color *= tint;

  outSpecular = smoothstep(sandLevel + TERRAIN_TRANSITION, sandLevel, altitude);
  return color;
}

// Adds the domain-warped cloud layer on top of an existing band colour — only used by the planet
// itself (skillPlanet); the tiny orbiting moons skip this (clouds at moon scale/pixel budget just read
// as noise, and they cost a second fbm pass per pixel for no visible benefit at that size).
vec3 terrainApplyClouds(vec3 color, float altitude, vec3 rotatedPosition, float cloudsScale, float cloudsSpeed, float cloudsDensityParam) {
  vec3 cloudsCoord = (rotatedPosition + vec3(uTime * .008 * cloudsSpeed)) * cloudsScale;
  float cloudsDensity = remap(terrainDomainWarpingFbm(cloudsCoord, 3, .3, 5., cloudsScale), -1.0, 1.0, 0.0, 1.0);
  float cloudsThreshold = 1. - cloudsDensityParam * .5;
  cloudsDensity *= smoothstep(cloudsThreshold, cloudsThreshold + .1, cloudsDensity);
  cloudsDensity *= smoothstep(TERRAIN_ROCK_LEVEL, (TERRAIN_ROCK_LEVEL + TERRAIN_TREE_LEVEL) / 2., altitude);
  return mix(color, TERRAIN_CLOUD_COLOR, cloudsDensity);
}
