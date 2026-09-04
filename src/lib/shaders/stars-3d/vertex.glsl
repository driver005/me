attribute float aSize;
attribute float aPhase;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vTwinkle;

void main() {
	vColor = color;
	vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aPhase * 6.2831853);

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	// Perspective-scaled point size — same falloff three.js's own PointsMaterial uses (sizeAttenuation)
	// — so a star further from the camera actually reads as farther, real perspective instead of a
	// fixed screen-space dot.
	gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;
}
