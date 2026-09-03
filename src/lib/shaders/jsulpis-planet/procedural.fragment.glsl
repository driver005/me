//=======================================================================================//
//
// Procedural Blue Planet
// by Julien Sulpis (https://twitter.com/jsulpis)
// https://www.shadertoy.com/view/Ds3XRl
//
//=======================================================================================//
//
// Source: jsulpis/realtime-planet-shader (https://github.com/jsulpis/realtime-planet-shader),
// GPL-3.0 License. Ported for /skills/[slug]'s shared skillPlanet — see CREDITS.md at the repo root
// for the license implications of including it, and procedural-terrain.glsl's own header for what
// changed (uNoiseTexture -> analytic hash noise) and why. Two further adaptations beyond that:
//   - uStars/spaceColor() reuse this project's existing texture-based starfield (the same one
//     planet.fragment.glsl already uses) instead of porting the original's own procedural,
//     noise-texture-based stars() — this project already loads a stars texture per planet look, so
//     there's no reason to duplicate that as analytic noise too.
//   - The built-in single hardcoded moon (MOON_OFFSET/currentMoonPosition/intersectMoon) is removed
//     entirely: /skills/[slug]'s skillPlanet has no moon of its own (the little orbiting moons live on
//     the separate shared earthPlanet, on /skills — see earth.fragment.glsl's intersectMoonFull, which
//     uses this same procedural-terrain.glsl for its own colour).

// `#version 300 es` intentionally omitted here: Three.js's `THREE.GLSL3` (set on this material)
// injects that pragma itself; a second one in this source would be a duplicate-directive error.

precision highp float;
precision mediump int;
precision mediump sampler2D;

in vec2 uv;
out vec4 fragColor;

//===================//
//  Global uniforms  //
//===================//

uniform float uTime;
uniform float uRotationOffset;
uniform vec2 uResolution;
uniform sampler2D uStars;

//==========================//
//  Controllable  uniforms  //
//==========================//

uniform vec3 uPlanetPosition;
uniform float uPlanetRadius;
uniform float uNoiseStrength;
uniform float uCloudsDensity;
uniform float uCloudsScale;
uniform float uCloudsSpeed;
uniform float uTerrainScale;
uniform vec3 uAtmosphereColor;
uniform float uAtmosphereDensity;
uniform float uSunIntensity;
uniform float uAmbientLight;
// Multiplied straight into the terrain band colour (see procedural-terrain.glsl's terrainBandColor) —
// same no-op-by-default (1,1,1) contract as planet.fragment.glsl's uSurfaceTint, so
// RaymarchPlanet.setTintColor() works unchanged against this variant too.
uniform vec3 uSurfaceTint;
// See procedural-terrain.glsl's own terrainBandColor() comment — 0 (default) is the reference
// shader's own original water/sand/tree/rock/ice mix; only setTerrainBias() (the shared skill planet)
// ever changes this.
uniform float uHillBias;
in vec3 uSunDirection;

//==========================================================//
//  Constants (could be turned into controllable uniforms)  //
//==========================================================//

#define ROTATION_SPEED .1
#define PLANET_ROTATION rotateY(uTime * ROTATION_SPEED + uRotationOffset)

#define SUN_COLOR vec3(1.0, 1.0, 0.9)
#define DEEP_SPACE vec3(0., 0., 0.0005)

#define INFINITY 1e10
#define CAMERA_POSITION vec3(0., 0., 6.0)
#define FOCAL_LENGTH CAMERA_POSITION.z / (CAMERA_POSITION.z - uPlanetPosition.z)

#define PI acos(-1.)

//=========//
//  Types  //
//=========//

struct Material {
  vec3 color;
  float diffuse;
  float specular;
};

struct Hit {
  float len;
  vec3 normal;
  Material material;
};

struct Sphere {
  vec3 position;
  float radius;
};

Hit miss = Hit(INFINITY, vec3(0.), Material(vec3(0.), -1., -1.));

Sphere getPlanet() {
  return Sphere(uPlanetPosition, uPlanetRadius);
}

//===============================================//
//  Generic utilities stolen from smarter people //
//===============================================//

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

vec2 sphereProjection(vec3 p, vec3 origin) {
  vec3 dir = normalize(p - origin);
  float longitude = atan(dir.x, dir.z); // [-PI, PI]
  float latitude = asin(dir.y); // [-PI/2, PI/2]

  return vec2(
    (longitude + PI) / (2. * PI), // [0, 1]
    (latitude + PI / 2.) / PI // [0, 1]
  );
}

// https://iquilezles.org/articles/intersectors/
float sphIntersect(in vec3 ro, in vec3 rd, in Sphere sphere) {
  vec3 oc = ro - sphere.position;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sphere.radius * sphere.radius;
  float h = b * b - c;
  if(h < 0.0)
    return -1.; // no intersection
  return -b - sqrt(h);
}

mat3 rotateY(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(//
  vec3(c, 0, s),//
  vec3(0, 1, 0),//
  vec3(-s, 0, c)//
  );
}

// Zavie - https://www.shadertoy.com/view/lslGzl
vec3 simpleReinhardToneMapping(vec3 color) {
  float exposure = 1.5;
  color *= exposure / (1. + color / exposure);
  color = pow(color, vec3(1. / 2.4));
  return color;
}

#include "./procedural-terrain.glsl"

//========//
//  Misc  //
//========//

float planetDist(in vec3 ro, in vec3 rd) {
  float smoothSphereDist = sphIntersect(ro, rd, getPlanet());

  vec3 intersection = ro + smoothSphereDist * rd;
  vec3 intersectionWithRotation = PLANET_ROTATION * (intersection - uPlanetPosition) + uPlanetPosition;

  return sphIntersect(ro, rd, Sphere(uPlanetPosition, uPlanetRadius + terrainNoiseRaw(intersectionWithRotation, uTerrainScale, uNoiseStrength)));
}

vec3 planetNormal(vec3 p) {
  vec3 rd = uPlanetPosition - p;
  float dist = planetDist(p, rd);
  // if e is too small it causes artifacts on mobile, so I interpolate
  // between .01 (large screens) and .03 (small screens)
  vec2 e = vec2(max(.01, .03 * smoothstep(1300., 300., uResolution.x)), 0);

  vec3 normal = dist - vec3(planetDist(p - e.xyy, rd), planetDist(p - e.yxy, rd), planetDist(p + e.yyx, rd));
  return normalize(normal);
}

vec3 spaceColor(vec3 direction) {
  vec3 backgroundCoord = direction * rotateY(uTime * ROTATION_SPEED / 3. + 1.5);

  vec2 textureCoord = sphereProjection(backgroundCoord, vec3(0.));
  textureCoord.x = 1. - textureCoord.x; // flip X because we are inside the texture
  vec3 stars = texture(uStars, textureCoord).rgb;

  return DEEP_SPACE + stars * stars * stars * .5;
}

vec3 atmosphereColor(vec3 ro, vec3 rd, float spaceMask) {
  float distCameraToPlanetOrigin = length(uPlanetPosition - CAMERA_POSITION);
  float distCameraToPlanetEdge = sqrt(distCameraToPlanetOrigin * distCameraToPlanetOrigin - uPlanetRadius * uPlanetRadius);

  float planetMask = 1.0 - spaceMask;

  vec3 coordFromCenter = (ro + rd * distCameraToPlanetEdge) - uPlanetPosition;
  float distFromEdge = abs(length(coordFromCenter) - uPlanetRadius);
  float planetEdge = max(uPlanetRadius - distFromEdge, 0.) / uPlanetRadius;
  float atmosphereMask = pow(remap(dot(uSunDirection, coordFromCenter), -uPlanetRadius, uPlanetRadius / 2., 0., 1.), 5.);
  atmosphereMask *= uAtmosphereDensity * uPlanetRadius * uSunIntensity;

  vec3 atmosphere = vec3(pow(planetEdge, 120.)) * .5;
  atmosphere += pow(planetEdge, 50.) * .3 * (1.5 - planetMask);
  atmosphere += pow(planetEdge, 15.) * .015;
  atmosphere += pow(planetEdge, 5.) * .04 * planetMask;

  return atmosphere * uAtmosphereColor * atmosphereMask;
}

//===============//
//  Ray Tracing  //
//===============//

Hit intersectPlanet(vec3 ro, vec3 rd) {
  float len = sphIntersect(ro, rd, getPlanet());

  if(len < 0.) {
    return miss;
  }

  vec3 position = ro + len * rd;
  vec3 rotatedPosition = PLANET_ROTATION * (position - uPlanetPosition) + uPlanetPosition;

  float altitude = terrainAltitude(rotatedPosition, uTerrainScale, uNoiseStrength);
  float specular;
  vec3 color = terrainBandColor(altitude, uSurfaceTint, uHillBias, specular);
  color = terrainApplyClouds(color, altitude, rotatedPosition, uCloudsScale, uCloudsSpeed, uCloudsDensity);

  vec3 normal = planetNormal(position);

  return Hit(len, normal, Material(color, 1., specular));
}

Hit intersectScene(vec3 ro, vec3 rd) {
  return intersectPlanet(ro, rd);
}

// alpha out-param — not in the original: this shader was built to be its whole page's own
// background, always opaque. Composited into another scene instead, "space" pixels need to stay
// transparent so what's actually behind them (this engine's own stars/fog/gallery) shows through,
// rather than this shader's own dim procedural space overwriting the entire frame at alpha 1.
vec3 radiance(vec3 ro, vec3 rd, out float alpha) {
  vec3 color = vec3(0.);
  float spaceMask = 1.;
  Hit hit = intersectScene(ro, rd);

  if(hit.len < INFINITY) {
    spaceMask = 0.;

    // Diffuse
    float directLightIntensity = pow(clamp(dot(hit.normal, uSunDirection), 0.0, 1.0), 2.) * uSunIntensity; // the power softens the shadow. Not physically accurate but it looks better to me
    vec3 diffuseLight = directLightIntensity * SUN_COLOR;
    vec3 diffuseColor = hit.material.color.rgb * (uAmbientLight + diffuseLight);

    // Phong specular
    vec3 reflected = normalize(reflect(-uSunDirection, hit.normal));
    float phongValue = pow(max(0.0, dot(rd, reflected)), 10.) * .2 * uSunIntensity;
    vec3 specularColor = hit.material.specular * vec3(phongValue);

    color = diffuseColor + specularColor;
  } else {
    float zoomFactor = min(uResolution.x / uResolution.y, 1.); // zoom for portrait mode because the background image is cropped to optimize file size
    vec3 backgroundRd = normalize(vec3(uv * zoomFactor, -1.)); // background not affected by focal length
    color = spaceColor(backgroundRd);
  }

  alpha = 1.0 - spaceMask;
  return color + atmosphereColor(ro, rd, spaceMask);
}

//========//
//  Main  //
//========//

void main() {
  vec3 ro = vec3(CAMERA_POSITION);
  vec3 rd = normalize(vec3(uv * FOCAL_LENGTH, -1.));

  float alpha;
  vec3 color = radiance(ro, rd, alpha);

  // color grading
  color = simpleReinhardToneMapping(color);

  // vignette
  color *= 1. - 0.5 * pow(length(uv), 3.);

  fragColor = vec4(color, alpha);
}
