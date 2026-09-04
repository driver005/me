uniform float outlineThickness;

void main() {
	vec3 extruded = position + normal * outlineThickness;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(extruded, 1.0);
}
