vec4 over(vec4 src, vec4 dst) {
    return vec4(src.rgb + dst.rgb * (1.0 - src.a), src.a + dst.a * (1.0 - src.a));
}

vec4 getRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture(image, uv - offset);
    vec4 g = texture(image, uv);
    vec4 b = texture(image, uv + offset);
    return vec4(r.r, g.g, b.b, g.a);
}

vec4 desaturate(vec3 color, float factor){
    vec3 lum = vec3(0.299, 0.587, 0.114);
    vec3 gray = vec3(dot(lum, color));
    return vec4(mix(color, gray, factor), 1.0);
}

varying vec2 vUv;

uniform sampler2D tTitles;
uniform sampler2D tTexts;
uniform sampler2D tImagesFront;
uniform sampler2D tVideo;
uniform sampler2D tFluid;
uniform float uBgOffset;

uniform vec2 uRes;
uniform vec3 uTextColor;
uniform vec3 uLabelColor;
uniform float uTime;
uniform float uIsBackMode;

void main() {
    vec2 uv = vUv;

    float bgWidth = mix(.8, 1., uBgOffset);
    float hMask = step(0.5 - bgWidth * 0.5, uv.x) * step(uv.x, 0.5 + bgWidth * 0.5);
    float bgMask = step(uv.y, uBgOffset) * hMask;
    vec4 bg = vec4(1., 1., 1., bgMask);


    vec4 titles = texture2D(tTitles, uv);
    vec4 texts = texture2D(tTexts, uv);
    vec4 images = texture2D(tImagesFront, uv);
    vec4 video = texture2D(tVideo, uv);

    vec3 typeColor = uTextColor * texts.r + uLabelColor * texts.g;
    vec4 type = vec4(typeColor, texts.a);




    titles.rgb = uTextColor * titles.r + uLabelColor * titles.g;

    vec4 final = bg;
    final = over(images, final);
    final = over(video, final);
    final = over(type, final);
    final = over(titles, final);

    gl_FragColor = final;
}
