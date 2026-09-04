uniform float levels;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec3 banded = floor(inputColor.rgb * levels + 0.5) / levels;
	outputColor = vec4(banded, inputColor.a);
}
