/**
 * Central Configuration Hub for Aetherion Ascent
 * 
 * This file contains all gameplay-related constants, visual parameters,
 * and system configurations. Organized by logical groups for easy maintenance
 * and balancing.
 * 
 * @author Me
 * @version 1.0.0
 */

export const CONFIG = {
  /**
   * Core game dimensions and physics constants
   */
  GAME: {
    WIDTH: 1024,
    HEIGHT: 768,
    BACKGROUND_COLOR: '#0a0a0f'
  },

  /**
   * World physics and generation parameters
   */
  WORLD: {
    GRAVITY: 800,                    // Pixels per second squared - tuned for satisfying jumps
    VOID_RISE_SPEED: 10,             // Much slower initial speed to prevent falling into void
    VOID_ACCELERATION: 0.1,          // Much slower acceleration for Phase 1
    PLATFORM_SPAWN_HEIGHT: 200,     // Vertical spacing between platform generation chunks
    PLATFORM_MIN_WIDTH: 120,        // Minimum platform width - good for strategic placement
    PLATFORM_MAX_WIDTH: 280,        // Maximum platform width - larger for gaps
    PLATFORM_THICKNESS: 20,         // Platform height
    CHUNK_HEIGHT: 500,               // Height of each generated chunk - fewer but more strategic platforms
    PLATFORM_DESTRUCTION_OFFSET: 200 // How far below void before platforms are destroyed
  },

  /**
   * Dynamic lighting system configuration
   */
  LIGHTING: {
    AMBIENT_COLOR: 0x1a1a2e,        // Dark purple ambient light
    AMBIENT_INTENSITY: 0.15,         // Low ambient for dramatic contrast
    PLAYER_LIGHT_RADIUS: 180,        // Player's light reach
    PLAYER_LIGHT_INTENSITY: 1.2,     // Player light brightness
    PLAYER_LIGHT_COLOR: 0x64ffda,    // Cyan-teal player light
    PLATFORM_LIGHT_RADIUS: 100,      // Light-emitting platform radius
    PLATFORM_LIGHT_INTENSITY: 0.9,   // Platform light brightness
    PLATFORM_LIGHT_COLORS: [         // Array of possible platform light colors
      0x64ffda,  // Cyan
      0x7c4dff,  // Purple
      0x00e676,  // Green
      0xff6d00,  // Orange
      0xe91e63   // Pink
    ],
    LIGHT_FLICKER_INTENSITY: 0.1,    // Subtle flickering for atmosphere
    LIGHT_FLICKER_SPEED: 2.0         // Flicker frequency
  },

  /**
   * Post-processing visual effects
   */
  POST_PROCESSING: {
    BLOOM_STRENGTH: 1.5,             // Intensity of bloom glow
    BLOOM_RADIUS: 1.2,               // Bloom spread
    BLOOM_THRESHOLD: 0.7,            // Brightness threshold for bloom
    VIGNETTE_STRENGTH: 0.4,          // Edge darkening intensity
    VIGNETTE_SIZE: 0.8,              // Size of clear center area
    DISTORTION_MAX_STRENGTH: 0.02,   // Maximum screen distortion
    DISTORTION_DECAY_RATE: 0.95      // How quickly distortion fades
  },

  /**
   * Camera behavior and movement
   */
  CAMERA: {
    FOLLOW_SPEED: 0.08,              // Smooth camera following (lower = smoother)
    OFFSET_Y: -120,                  // Keep player slightly below screen center
    SHAKE_INTENSITY: 5,              // Screen shake magnitude
    SHAKE_DURATION: 200              // Screen shake duration in ms
  },

  /**
   * Particle system configuration
   */
  PARTICLES: {
    AMBIENT_SPAWN_RATE: 0.1,         // Particles spawned per frame (ambient dust) - reduced
    AMBIENT_LIFETIME: 6000,          // How long ambient particles live (ms)
    AMBIENT_SPEED: { min: 10, max: 30 }, // Upward drift speed range
    AMBIENT_SCALE: { min: 0.3, max: 0.8 }, // Particle size variation
    MAX_AMBIENT_PARTICLES: 50        // Performance limit for ambient effects - reduced
  },

  /**
   * Platform generation rules
   */
  GENERATION: {
    LIGHT_PLATFORM_CHANCE: 0.35,    // Probability a platform emits light
    MIN_HORIZONTAL_GAP: 50,          // Minimum horizontal distance between platforms - reachable
    MAX_HORIZONTAL_GAP: 100,         // Maximum horizontal distance between platforms - always reachable
    VERTICAL_SPACING_MIN: 60,        // Minimum vertical gap between platforms - reachable jumps
    VERTICAL_SPACING_MAX: 90,        // Maximum vertical gap between platforms - always jumpable
    SAFE_SPAWN_DISTANCE: 800,       // Distance ahead of camera to generate content
    GAP_CHANCE: 0.25,                // Probability of creating a gap/hole in a platform
    GAP_WIDTH_MIN: 40,               // Minimum width of gaps in platforms
    GAP_WIDTH_MAX: 80,               // Maximum width of gaps in platforms
    COIN_PLATFORM_CHANCE: 0.35,     // Probability a platform has a coin (configurable)
  },

  /**
   * Visual theme colors and materials
   */
  THEME: {
    VOID_COLOR: 0x2d1b69,           // Deep purple void energy
    PLATFORM_COLOR: 0x2a2a4a,       // Dark stone platform color
    LIGHT_PLATFORM_COLOR: 0x3a3a6a, // Slightly brighter for light-emitting platforms
    BACKGROUND_GRADIENT_TOP: 0x1a1a2e,
    BACKGROUND_GRADIENT_BOTTOM: 0x0f0f1a,
    PARTICLE_COLORS: [               // Available particle colors
      0x64ffda, 0x7c4dff, 0x00e676, 0xff6d00, 0xe91e63
    ]
  },

  /**
   * Performance and optimization settings
   */
  PERFORMANCE: {
    MAX_VISIBLE_PLATFORMS: 50,       // Limit active platforms for performance
    PARTICLE_CULLING_DISTANCE: 400,  // Distance before particles are culled
    LIGHT_CULLING_DISTANCE: 500,     // Distance before lights are disabled
    TARGET_FPS: 60                   // Target frame rate
  },

  /**
   * Coin collection system configuration
   */
  COINS: {
    SIZE: 16,                        // Coin sprite diameter
    GLOW_RADIUS: 24,                 // Coin glow effect radius
    BOUNCE_HEIGHT: 8,                // Vertical bounce animation height
    BOUNCE_SPEED: 3.0,               // Bounce animation speed
    COLLECTION_RADIUS: 20,           // Distance for auto-collection
    LIGHT_INTENSITY: 0.8,            // Coin light emission intensity
    COLORS: [                        // Available coin colors (golden variations)
      0xffd700,  // Gold
      0xffed4e,  // Light gold
      0xffc107,  // Amber gold
      0xfff176   // Pale gold
    ],
    PARTICLE_COUNT: 8,               // Particles spawned when collected
    PARTICLE_LIFETIME: 1000          // Collection effect particle duration
  },

  /**
   * Scoring system configuration
   */
  SCORING: {
    HEIGHT_DIVISOR: 10,              // Height units per score point
    HEIGHT_SCORE_MULTIPLIER: 1,     // Multiplier for height score
    COIN_VALUE: 50,                  // Base points per coin
    BONUS_COIN_VALUE: 100,           // Special coin bonus value
    COMBO_MULTIPLIER: 1.5,           // Score multiplier for coin combos
    COMBO_TIME_WINDOW: 2000          // Time window for combo collection (ms)
  },
};

/**
 * Utility function to get a random platform light color
 * @returns {number} Hex color value
 */
export const getRandomPlatformLightColor = () => {
  const colors = CONFIG.LIGHTING.PLATFORM_LIGHT_COLORS;
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Utility function to get a random particle color
 * @returns {number} Hex color value
 */
export const getRandomParticleColor = () => {
  const colors = CONFIG.THEME.PARTICLE_COLORS;
  return colors[Math.floor(Math.random() * colors.length)];
}; 