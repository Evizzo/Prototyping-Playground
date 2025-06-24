#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uMainSampler;
uniform float uDistortionStrength;
uniform vec2 uDistortionCenter;
uniform float uDistortionRadius;

varying vec2 outTexCoord;

/**
 * Distortion Post-Processing Shader for Aetherion Ascent
 * 
 * Creates screen distortion effects for:
 * - Heavy player landings (radial shockwave from impact point)
 * - Void proximity effects (warping reality as player gets close)
 * - Environmental effects (mystical energy surges)
 * 
 * Phase 1 Implementation: Radial distortion with configurable center and strength
 * Future Enhancement: Multiple distortion sources, different distortion types
 */

/**
 * Generate radial distortion displacement
 * @param uv - Current texture coordinates
 * @param center - Distortion center point (0-1 space)
 * @param radius - Effect radius
 * @param strength - Distortion intensity
 * @returns Displaced UV coordinates
 */
vec2 radialDistortion(vec2 uv, vec2 center, float radius, float strength) {
    // Vector from distortion center to current pixel
    vec2 offset = uv - center;
    float distance = length(offset);
    
    // Create falloff based on distance from center
    float falloff = smoothstep(radius, 0.0, distance);
    
    // Radial displacement - pushes pixels away from center
    vec2 direction = normalize(offset);
    vec2 displacement = direction * strength * falloff;
    
    // Add wave-like ripple effect
    float wave = sin(distance * 50.0 - uTime * 10.0) * 0.1;
    displacement += direction * wave * strength * falloff;
    
    return uv + displacement;
}

/**
 * Generate heat-haze style distortion for void effects
 * @param uv - Current texture coordinates
 * @param strength - Distortion intensity
 * @param time - Current time
 * @returns Displaced UV coordinates
 */
vec2 heatHazeDistortion(vec2 uv, float strength, float time) {
    // Create flowing, organic distortion pattern
    float noiseX = sin(uv.y * 10.0 + time * 2.0) * sin(uv.x * 8.0 + time * 1.5);
    float noiseY = cos(uv.x * 12.0 + time * 1.8) * cos(uv.y * 6.0 + time * 2.2);
    
    vec2 noise = vec2(noiseX, noiseY) * strength * 0.01;
    
    return uv + noise;
}

/**
 * Generate chromatic aberration for intense distortion
 * @param sampler - Texture sampler
 * @param uv - Texture coordinates
 * @param strength - Aberration intensity
 * @returns Color with chromatic aberration applied
 */
vec3 chromaticAberration(sampler2D sampler, vec2 uv, float strength) {
    vec2 direction = normalize(uv - vec2(0.5));
    
    float r = texture2D(sampler, uv + direction * strength * 0.002).r;
    float g = texture2D(sampler, uv).g;
    float b = texture2D(sampler, uv - direction * strength * 0.002).b;
    
    return vec3(r, g, b);
}

void main() {
    vec2 uv = outTexCoord;
    
    // Apply radial distortion (for impact effects)
    vec2 distortedUV = radialDistortion(uv, uDistortionCenter, uDistortionRadius, uDistortionStrength);
    
    // Add heat-haze effect for mystical atmosphere
    distortedUV = heatHazeDistortion(distortedUV, uDistortionStrength * 0.5, uTime);
    
    // Clamp UV coordinates to prevent sampling outside texture
    distortedUV = clamp(distortedUV, 0.0, 1.0);
    
    // Sample scene with distorted coordinates
    vec3 sceneColor;
    
    // Apply chromatic aberration for strong distortions
    if (uDistortionStrength > 0.5) {
        sceneColor = chromaticAberration(uMainSampler, distortedUV, uDistortionStrength);
    } else {
        sceneColor = texture2D(uMainSampler, distortedUV).rgb;
    }
    
    // Add subtle color shift during distortion
    if (uDistortionStrength > 0.0) {
        // Slight purple tint for mystical feel
        sceneColor.b += uDistortionStrength * 0.1;
        sceneColor.r += uDistortionStrength * 0.05;
    }
    
    gl_FragColor = vec4(sceneColor, 1.0);
} 