// Source: jsulpis/realtime-planet-shader (https://github.com/jsulpis/realtime-planet-shader),
// GPL-3.0 License. Ported verbatim (this file and the fragment shaders it pairs with in this same
// directory) — see CREDITS.md at the repo root for the license implications of including it.
// `#version 300 es` intentionally omitted here: Three.js's `THREE.GLSL3` (set on this material)
// injects that pragma itself; a second one in this source would be a duplicate-directive error.

precision highp float;

in vec3 position;
uniform vec2 uResolution;
uniform vec2 sunDirectionXY;
uniform float uQuality;

out vec3 uSunDirection;
out vec2 uv;

void main() {
   vec2 resolution = uResolution * uQuality;
   uv = (position.xy - 0.5) * resolution / min(resolution.y, resolution.x);
   uSunDirection = normalize(vec3(sunDirectionXY, 0.));

   gl_Position = vec4(2.0 * position - 1.0, 1.0);
}