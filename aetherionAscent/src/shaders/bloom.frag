#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uMainSampler;
uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uBloomThreshold;

varying vec2 outTexCoord;

/**
 * Bloom Post-Processing Shader for Aetherion Ascent
 * 
 * Creates a luminous glow effect for bioluminescent elements.
 * This is a simplified single-pass bloom that extracts bright pixels
 * and applies a gaussian-style blur to create the glow effect.
 * 
 * Phase 1 Implementation: Basic bloom extraction and blur
 * Future Enhancement: Multi-pass gaussian blur for higher quality
 */

// Gaussian blur weights for a 9-tap kernel
const float weights[9] = float[](
    0.0162162162, 0.0540540541, 0.1216216216, 0.1945945946, 0.2270270270,
    0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162
);

/**
 * Extract bright pixels above the bloom threshold
 * @param color - Input color
 * @param threshold - Brightness threshold
 * @returns Bright pixels or black
 */
vec3 extractBright(vec3 color, float threshold) {
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722)); // Luminance
    return color * smoothstep(threshold - 0.1, threshold + 0.1, brightness);
}

/**
 * Simple blur function for bloom effect
 * @param sampler - Texture sampler
 * @param uv - Texture coordinates
 * @param radius - Blur radius
 * @returns Blurred color
 */
vec3 simpleBlur(sampler2D sampler, vec2 uv, float radius) {
    vec3 result = vec3(0.0);
    vec2 texelSize = 1.0 / uResolution;
    
    // Horizontal and vertical blur in one pass
    for (int i = -4; i <= 4; i++) {
        for (int j = -4; j <= 4; j++) {
            vec2 offset = vec2(float(i), float(j)) * texelSize * radius;
            vec3 sample = texture2D(sampler, uv + offset).rgb;
            
            // Apply gaussian-like weighting
            float weight = exp(-dot(offset, offset) * 1000.0);
            result += sample * weight;
        }
    }
    
    return result * 0.05; // Normalize
}

void main() {
    vec2 uv = outTexCoord;
    
    // Sample original scene
    vec3 originalColor = texture2D(uMainSampler, uv).rgb;
    
    // Extract bright areas for bloom
    vec3 brightColor = extractBright(originalColor, uBloomThreshold);
    
    // Apply blur to bright areas
    vec3 bloomColor = simpleBlur(uMainSampler, uv, uBloomRadius);
    
    // Combine original with bloom
    vec3 finalColor = originalColor + bloomColor * uBloomStrength;
    
    // Add subtle animation to make the world feel alive
    float pulse = sin(uTime * 2.0) * 0.02 + 1.0;
    finalColor *= pulse;
    
    gl_FragColor = vec4(finalColor, 1.0);
} 