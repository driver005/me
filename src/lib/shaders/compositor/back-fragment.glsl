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

uniform sampler2D tStars;
uniform sampler2D tPlanet;
uniform sampler2D tPlanetBlur;
uniform sampler2D tFog;
uniform sampler2D tTitlesSoft;
uniform sampler2D tTitlesBlur;
uniform sampler2D tTexts;
uniform sampler2D tImagesBack;
uniform sampler2D tImagesBackBloom;
uniform sampler2D tVideo;
uniform sampler2D tFluid;

uniform float uBloomTint;
uniform float uBloomTintThreshold;
uniform float uBloomBleed;
uniform float uGlowStrength;
uniform float uGlowFogDull;
uniform float uOnPlaneBloom;
uniform float uFogDistort;
uniform float uFogDistortMin;
uniform float uFogDistortMax;
uniform float uProjMaskMin;
uniform float uProjMaskMax;
uniform float uCentreProxMin;
uniform float uCentreProxMax;
uniform float uFogErosionEdge;
uniform float uFogErosionCentre;
uniform float uMediaCurveEdge;
uniform float uSmokeBrightness;
uniform float uSmokeFogMod;
uniform float uSmokeDesat;
uniform float uStarsRGB;
uniform float uFogRGB;
uniform float uImagesRGB;
uniform float uVideoRGB;

uniform float uIsMobile;
uniform float uIsTouch;
uniform vec2 uRes;
uniform vec3 uTextColor;
uniform vec3 uLabelColor;
uniform float uMode;
uniform float uTime;
uniform float uDpr;
uniform float uIsBackMode;
uniform float uGrainAmount;
uniform float uHasFog;
uniform float uPlanetBlurAmt;

uniform vec4 uInfoGlow;
uniform vec2 uInfoGlowOffset;
uniform float uInfoGlowSoftness;
uniform vec3 uInfoGlowColor;

vec4 getTitlesRGB(sampler2D image, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    float aR = texture2D(image, uv + offset).a;
    float aG = texture2D(image, uv).a;
    float aB = texture2D(image, uv - offset).a;
    float a = max(aR, max(aG, aB));
    return vec4(aR, aG, aB, a);
}

vec3 getTextsRGB(vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    vec4 tR = texture2D(tTexts, uv + offset);
    vec4 tG = texture2D(tTexts, uv);
    vec4 tB = texture2D(tTexts, uv - offset);

    vec3 cR = uTextColor * tR.r + uLabelColor * tR.g;
    vec3 cG = uTextColor * tG.r + uLabelColor * tG.g;
    vec3 cB = uTextColor * tB.r + uLabelColor * tB.g;

    return vec3(cR.r, cG.g, cB.b);
}

float grain(vec2 uv, float t) {
    vec3 p = vec3(uv, t);
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z) - 0.5;
}


void main() {
    vec2 uv = vUv;

    float mode = 1. - uMode;

    vec4 fluid = texture(tFluid, uv);
    float intensity = length(fluid.rg);

    
    vec4 bg = vec4(0.);

    
    vec4 stars = getRGB(tStars, uv, .1, uStarsRGB);
    vec3 col = stars.rgb;

    
    vec4 planet = texture2D(tPlanet, uv);
    vec4 planetBlur = texture2D(tPlanetBlur, uv);
    // Only shows while the white front plate is hidden (mode = back-ness, 1 when fully immersive/back,
    // 0 when the front view is fully up) — previously always-on regardless of uMode, visible bleeding
    // through even while the white layer covered it.
    // Gentle breathing intensity on the bleed itself — adapted from a volumetric planet-glow shader's
    // own animated wind term (its `0.4*sin(time*2.)+0.6`), scaled way down in both speed and depth to
    // stay a subtle ambient drift rather than a visible pulse.
    float glowBreath = 0.92 + 0.08 * sin(uTime * 0.35);
    col += (planetBlur.rgb * 1.5) * uPlanetBlurAmt * mode * glowBreath;
    col = mix(col, planet.rgb, planet.a);

    
    vec2 glowD = uv - (uInfoGlow.xy + uInfoGlowOffset);
    glowD.x *= uRes.x / uRes.y;
    float glowDist = length(glowD) / max(uInfoGlow.z, 1e-4);
    float infoGlow = (1.0 - smoothstep(1.0 - uInfoGlowSoftness, 1.0, glowDist)) * uInfoGlow.w;
    col += uInfoGlowColor * infoGlow;

    vec2 imageUv = mix(uv - fluid.rg * .0001, uv, uMode);
    float imageChroma = mix(intensity * .1, 0., uMode);
    vec3 images = getRGB(tImagesBack, imageUv, -.5, (uImagesRGB + .0002 * imageChroma)).rgb;
    vec3 imagesBloom = texture2D(tImagesBackBloom, imageUv).rgb;
    float bloomLum = dot(imagesBloom, vec3(0.299, 0.587, 0.114));
    float imagesAlpha = texture2D(tImagesBack, imageUv).a;

    // uHasFog is the ONE knob that controls how much fog shows, full stop — everything below derives
    // from fogT, which already carries that single scale (see the mix() right here). uFogAmbient and
    // uFogColorStr used to add two more "look" multipliers on top of this (color boost, ambient floor)
    // — removed per request: fog/fogCoverage (PAGE_LOOK, driving uHasFog and uDensityMin) were judged
    // enough control on their own, and the extra multipliers were just amplifying the same fogT value
    // this already carries.
    vec4 fogT = mix(vec4(0.), getRGB(tFog, uv, .1, uFogRGB), uHasFog);
    float fog = fogT.a;

    vec3 fogColor = mix(fogT.rgb, imagesBloom * uBloomTint, smoothstep(0.01, uBloomTintThreshold, bloomLum));
    vec3 litFog = fogColor * fog;

    vec3 bloomBleed = imagesBloom.rgb * uBloomBleed;
    litFog += bloomBleed;

    float projectionMask = smoothstep(uProjMaskMin, uProjMaskMax, bloomLum);

    float centreProximity = 1.0 - abs(uv.y - 0.5) * 2.0;
    centreProximity = smoothstep(uCentreProxMin, uCentreProxMax, centreProximity);

    float fogEdgeNoise = (fogT.a - 0.5) * 0.3;
    centreProximity = clamp(centreProximity + fogEdgeNoise, 0.0, 1.0);
    centreProximity = mix(1.0, centreProximity, uHasFog);

    float noisySoften = fogEdgeNoise * (1.0 - centreProximity);

    float erosionCentre = clamp(uFogErosionCentre + fogEdgeNoise, 0.0, 1.0);
    float fogErosion = 1.0 - fog * mix(uFogErosionEdge, erosionCentre, centreProximity);

    float imagesVisibility = imagesAlpha * projectionMask * fogErosion;

    vec3 smokyScene = images * (uSmokeBrightness + fog * uSmokeFogMod);
    float grey = dot(smokyScene, vec3(0.299, 0.587, 0.114));
    smokyScene = mix(smokyScene, vec3(grey), fog * uSmokeDesat);

    vec3 imagesCol = mix(smokyScene, images, centreProximity);
    float fogCover = fog * (1.0 - centreProximity) * imagesAlpha;
    float fogOverMedia = (1.0 - centreProximity) * fog * imagesAlpha * 0.3;

    vec3 backCol = col;
    backCol = mix(backCol, litFog, fog);
    backCol = mix(backCol, imagesCol, imagesVisibility);
    
    
    backCol += imagesBloom.rgb * imagesVisibility * centreProximity * uOnPlaneBloom;
    backCol = mix(backCol, litFog, fogCover);
    backCol = mix(backCol, litFog, fogOverMedia);

    
    
    
    float glowHalo = 1.0 - imagesAlpha;
    float glowFogDull = mix(1.0, uGlowFogDull, fog);
    backCol += imagesBloom.rgb * glowHalo * centreProximity * uGlowStrength * glowFogDull;

    vec3 frontCol = col;
    frontCol = mix(frontCol, litFog, fog);
    frontCol = mix(frontCol, imagesCol, imagesAlpha);

    col = mix(backCol, frontCol, uMode);

    
    vec2 titleUv = mix(uv - fluid.rg * .00007, uv, uMode);
    float titleChroma = mix(intensity * .05, 0., uMode);
    vec4 titlesSoft = getTitlesRGB(tTitlesSoft, titleUv, -1., .001 + .0005 * titleChroma);
    vec4 titlesBlur = getTitlesRGB(tTitlesBlur, titleUv, 1., .001 + .001 * titleChroma);
    col += titlesBlur.rgb * .35;
    col = mix(col, titlesSoft.rgb, titlesSoft.a);

    
    vec2 textUv = mix(uv - fluid.rg * .00003, uv, uMode);
    float textChroma = mix(intensity * .03, 0., uMode);
    vec3 type = getTextsRGB(textUv, 0., .001 * textChroma);
    col += type;

    float winGain = .2;
    float refract = 0.;
    float backTint = 0.;
    float autoContrast = .2;
    float uChroma = 2.;
    float tint = 0.;

    
    float win = clamp(winGain, 0., 1.);

    
    vec2 videoUv = uv - fluid.rg * mix(.00012, refract * win, uMode);

    
    float videoChroma = mix(intensity * .3, win * uChroma, uMode);
    vec4 video = getRGB(tVideo, videoUv, -.5, mix(.001, .0015, uMode) + .0002 * videoChroma);

    
    float lum    = dot(video.rgb, vec3(0.299, 0.587, 0.114));
    vec3  chroma = video.rgb - lum;

    
    float frontLum = mix(lum * 1.4, 1.0 - lum, win * autoContrast);
    vec3  videoFrontCol = chroma + frontLum;

    
    videoFrontCol = mix(videoFrontCol,
    1.0 - (1.0 - videoFrontCol) * (1.0 - backTint),
    win * tint);

    vec3 videoCol = mix(video.rgb, videoFrontCol, uMode);
    col = mix(col, videoCol, video.a);

    float grainy = grain(uv * 2.4, uTime * .000003) * uGrainAmount * uDpr;

    

    

    
    col += grainy;

    gl_FragColor = vec4(col, 1.);
}
