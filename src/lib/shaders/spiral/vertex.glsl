varying vec2 vUv;
#define PI 3.14159265359

uniform float uScrollSpeed;
// The original standalone /spiral page ran this whole carousel at native scale (item plane 1.7 wide,
// camera 8 units away) and a much tighter FOV, so only a short run of cards near vertical centre was
// ever in frame at once. Reusing it inside the shared engine (much larger scale, wider FOV) puts a far
// bigger index range in frame simultaneously — and pow(worldPosition.y, 2.0) below grows with the
// SQUARE of distance from centre, so that bigger visible range reads as one large sideways curve
// instead of the original's near-straight column. uCurveStrength directly scales this term's overall
// contribution — 0 turns the curve off entirely (a safe, valid value: this multiplies, it never
// divides, so there's no singularity at 0), 1 would reproduce the original's own relative strength.
uniform float uCurveStrength;

void main() {
	vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
	vec3 newPosition = position;
	newPosition.z = sin(uv.x * PI) * 0.2;

	vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
	vec4 viewPosition = viewMatrix * modelPosition;
	viewPosition.x += pow(worldPosition.y, 2.0) * uCurveStrength;
	viewPosition.x += sin(uv.y * PI) * uScrollSpeed * 2.0;
	vec4 projectedPosition = projectionMatrix * viewPosition;
	gl_Position = projectedPosition;

	vUv = uv;
}
