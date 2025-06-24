#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uMainSampler;
uniform float uVignetteStrength;
uniform float uVignetteSize;

varying vec2 outTexCoord;

/**
 * Vignette Post-Processing Shader for Aetherion Ascent
 * 
 * Creates a subtle, dynamic vignette effect that focuses attention
 * on the center of the screen where the player action takes place.
 * The vignette subtly pulses to match the mystical atmosphere.
 * 
 * Phase 1 Implementation: Smooth circular vignette with atmospheric pulse
 */

/**
 * Generate smooth vignette mask
 * @param uv - Texture coordinates (0-1)
 * @param size - Size of clear center area (0-1)
 * @param strength - Intensity of vignette effect
 * @returns Vignette multiplier (0-1)
 */
float createVignette(vec2 uv, float size, float strength) {
    // Convert to centered coordinates (-1 to 1)
    vec2 centered = uv * 2.0 - 1.0;
    
    // Calculate distance from center
    float distance = length(centered);
    
    // Create smooth vignette falloff
    float vignette = smoothstep(size, size + strength, distance);
    
    // Invert so center is bright (1.0) and edges are dark (0.0)
    return 1.0 - vignette;
}

/**
 * Add atmospheric breathing effect to vignette
 * @param baseVignette - Base vignette value
 * @param time - Current time
 * @returns Animated vignette value
 */
float animateVignette(float baseVignette, float time) {
    // Subtle breathing effect - slower than bloom pulse
    float breathe = sin(time * 1.5) * 0.1 + 1.0;
    
    // Very subtle random variation for organic feel
    float organic = sin(time * 3.7) * sin(time * 2.3) * 0.05 + 1.0;
    
    return baseVignette * breathe * organic;
}

void main() {
    vec2 uv = outTexCoord;
    
    // Sample the original scene
    vec3 sceneColor = texture2D(uMainSampler, uv).rgb;
    
    // Generate base vignette
    float vignette = createVignette(uv, uVignetteSize, uVignetteStrength);
    
    // Add atmospheric animation
    vignette = animateVignette(vignette, uTime);
    
    // Ensure vignette doesn't get too dark (maintain visibility)
    vignette = max(vignette, 0.2);
    
    // Apply vignette to scene
    vec3 finalColor = sceneColor * vignette;
    
    // Subtle color temperature shift towards edges for mystical feel
    float warmth = 1.0 - (1.0 - vignette) * 0.3;
    finalColor.r *= warmth;
    finalColor.b *= (2.0 - warmth);
    
    gl_FragColor = vec4(finalColor, 1.0);
} 