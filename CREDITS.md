# Credits

Third-party code and techniques used in this project, beyond what's already declared in
`package.json`.

## Simplex noise (`snoise`/`permute`/`taylorInvSqrt`)

**Source:** [Ian McEwan, Ashima Arts — `webgl-noise`](https://github.com/ashima/webgl-noise)
(2011), MIT License. Specifically the older `+1.0` / `0.6` / `42.0` variant also packaged as
[`hughsk/glsl-noise`](https://github.com/hughsk/glsl-noise/blob/master/simplex/3d.glsl), not the
newer 2020 `stegu/webgl-noise` revision (`+10.0` / `0.5` / `105.0`).

Used in the WebGL background engine's shaders (`src/lib/shaders/segerman-bg/`):
`planet/vertex.glsl`, `planet/fragment.glsl`, `card/fragment.glsl`, `video-card/fragment.glsl`,
`compositor/output-fragment.glsl`.

This function was ported from segerman.dev's own compiled bundle while reverse-engineering its
WebGL background this session — its shader includes the exact same `+1.0`/`0.6`/`42.0` constants
and the `i = mod(i, 289.0)` inlining (rather than a separate `mod289()` helper) that identifies
this specific widely-circulated fork, so the attribution traces back through their code to the
original Ashima/hughsk source, not to segerman.dev itself.

## The planet shader more broadly

Beyond the noise primitive above, the planet's terrain FBM, fresnel/rim glow, and mouse-hover
crack-reveal (trail-texture-driven normal-map reveal) don't have a confirmed external source —
they read as a bespoke composition specific to segerman.dev, built on top of the borrowed noise
function rather than copied from one further place. "FBM-noise terrain sphere with hover
interaction" is a common shader genre with many independent, similar-looking implementations
(e.g. [`sebastianvasquezechavarria1234/terrain-sphere-three-js-shader`](https://github.com/sebastianvasquezechavarria1234/terrain-sphere-three-js-shader),
MIT) — but none matched closely enough (in either technique or exact constants) to credit as a
direct source the way the noise function above could be.
