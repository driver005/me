varying vec3 vColor;
varying float vTwinkle;

void main() {
	// gl_PointCoord is the point sprite's own local UV (0..1 across the quad three.js draws each point
	// as) — a soft circular falloff from its center instead of a hard square dot.
	vec2 centered = gl_PointCoord - 0.5;
	float dist = length(centered);
	float alpha = smoothstep(0.5, 0.0, dist);

	gl_FragColor = vec4(vColor * vTwinkle, alpha * vTwinkle);
}
