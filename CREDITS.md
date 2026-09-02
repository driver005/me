# Credits

Third-party code and techniques used in this project, beyond what's already declared in
`package.json`.

## Raymarched planets (Home/About/Gallery backgrounds)

**Source:** [jsulpis/realtime-planet-shader](https://github.com/jsulpis/realtime-planet-shader) by
Julien Sulpis, **GPL-3.0 License**.

**License note:** GPL-3.0 is copyleft. Including this code means the combined work — this
repository, once these files are part of it — needs to be GPL-3.0-compatible, and the full
corresponding source needs to be available to anyone who receives the built site (the same
obligation as if the whole repo were GPL). This is a deliberate, informed choice made in
conversation with the project owner, not an incidental inclusion — see the shader files' own
header comments for the same note inline.

Ported verbatim except for one change: the fragment shaders' `main()` originally always wrote
`alpha = 1.0` (correct for a shader that's a whole page's own background on its own site, wrong
once composited into another scene — it was overwriting this project's own stars/fog/gallery
layers everywhere, not just where the planet itself is drawn). Changed `radiance()` to also return
whether a given pixel is empty space or the planet/atmosphere, and `main()` to write that as the
alpha channel instead of a hardcoded 1.0, so only the planet itself actually replaces what's
behind it.

Files:
- `src/lib/shaders/jsulpis-planet/vertex.glsl`, `earth.fragment.glsl`, `planet.fragment.glsl`
- `src/lib/three/scenes/segerman-bg/raymarch-planet.ts` (the Three.js-side wrapper — original code,
  not from the source repo, just wires their shaders into a `THREE.ShaderMaterial`)

Real planet/stars textures also come from that repo's own `public/` assets, itself sourced from
public-domain imagery: Earth from NASA's [Visible Earth / Blue
Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble); Moon/Mars/Mercury/Venus/Jupiter
from USGS Astrogeology.

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
