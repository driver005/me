#include <common>
#include <skinning_pars_vertex>

uniform float outlineThickness;

void main() {
	#include <skinbase_vertex>

	vec3 transformed = position + normal * outlineThickness;

	#include <skinning_vertex>

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
