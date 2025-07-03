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
    CHUNK_HEIGHT: 800,               // Height of each generated chunk - increased for wider spacing
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
   * Enhanced visual effects configuration
   */
  VISUAL_EFFECTS: {
    WIND_PARTICLES_PER_INTENSITY: 20,  // Particles per wind intensity level
    WIND_DURATION_BASE: 2000,          // Base duration for wind effects
    WIND_SCREEN_SHAKE_MULTIPLIER: 2,   // Screen shake intensity multiplier
    
    COIN_SPARKLE_COUNT: 15,            // Number of sparkles per coin collection
    COIN_TRAIL_DURATION: 300,          // Duration of coin trail effect
    SCORE_POPUP_DURATION: 1000,        // Duration of score popup animation
    
    PLAYER_IMPACT_PARTICLES: 10,       // Base particle count for player impacts
    PLAYER_IMPACT_SCALE: 1.0,          // Base scale for impact effects
    
    ENEMY_ATTACK_SCREEN_SHAKE: 2,      // Screen shake intensity for enemy attacks
    ENEMY_PROJECTILE_SPEED: 150,       // Speed of enemy projectiles
    ENEMY_MUZZLE_FLASH_DURATION: 150   // Duration of muzzle flash effect
  },

  /**
   * Camera behavior and movement
   */
  CAMERA: {
    FOLLOW_SPEED: 0.08,              // Smooth camera following (lower = smoother)
    OFFSET_Y: -120,                  // Keep player slightly below screen center
    SHAKE_INTENSITY: 7,              // Screen shake magnitude
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
    LIGHT_PLATFORM_CHANCE: 0.15,    // Reduced from 0.35 to 0.15 for better performance (fewer lights)
    MIN_HORIZONTAL_GAP: 60,          // Minimum horizontal distance between platforms - increased for more challenge
    MAX_HORIZONTAL_GAP: 120,         // Maximum horizontal distance between platforms - increased but still reachable
    VERTICAL_SPACING_MIN: 80,        // Minimum vertical gap between platforms - increased (2.5x player height)
    VERTICAL_SPACING_MAX: 140,       // Maximum vertical gap between platforms - much larger spread
    SAFE_SPAWN_DISTANCE: 800,       // Distance ahead of camera to generate content
    GAP_CHANCE: 0.25,                // Probability of creating a gap/hole in a platform
    GAP_WIDTH_MIN: 40,               // Minimum width of gaps in platforms
    GAP_WIDTH_MAX: 80,               // Maximum width of gaps in platforms
    COIN_PLATFORM_CHANCE: 0.25,     // Reduced from 0.20 to 0.15 (15% instead of 20%)
  },

  /**
   * Visual theme colors and materials
   */
  THEME: {
    VOID_COLOR: 0x2d1b69,           // Deep purple void energy
    PLATFORM_COLOR: 0x9e9e9e,       // Bright silver-gray stone platform - high contrast against dark cave
    LIGHT_PLATFORM_COLOR: 0xbdbdbd, // Very bright crystal platform with light blue tint - stands out clearly
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
    BOUNCE_HEIGHT: 6,                // Vertical bounce animation height (reduced slightly)
    BOUNCE_SPEED: 3.0,               // Bounce animation speed
    COLLECTION_RADIUS: 25,           // Distance for auto-collection (increased slightly)
    LIGHT_INTENSITY: 0.8,            // Coin light emission intensity
    PLATFORM_CLEARANCE: 30,          // Minimum clearance above platform (new)
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

  /**
   * Background system configuration
   */
  BACKGROUND: {
    CHUNK_HEIGHT: 800,               // Height of each background chunk
    GENERATION_DISTANCE: 1200,       // Distance ahead to generate background
    MAX_VISIBLE_CHUNKS: 8,           // Maximum background chunks to keep active
    PARALLAX_SPEEDS: {               // Movement speeds for different layers
      far: 0.1,                     // Distant mountains, structures
      mid: 0.3,                     // Medium distance elements  
      near: 0.6,                    // Foreground details
      particles: 0.8                // Atmospheric particles
    },
    THEMES: {                        // Progressive theme configuration
      ancient_ruins: {
        heightRange: [0, 2000],
        colors: {
          primary: 0x2a2a4a,
          secondary: 0x64ffda,
          accent: 0x8d6e63
        },
        elements: {
          pillars: 5,
          ruins: 4,
          mountains: 3
        }
      },
      crystal_caverns: {
        heightRange: [2000, 4000],
        colors: {
          primary: 0x7c4dff,
          secondary: 0x64ffda,
          accent: 0x00e676
        },
        elements: {
          crystals: 6,
          smallCrystals: 8,
          caveWalls: 1
        }
      },
      sky_temples: {
        heightRange: [4000, 6000],
        colors: {
          primary: 0x3a3a6a,
          secondary: 0xe3f2fd,
          accent: 0x64ffda
        },
        elements: {
          temples: 3,
          clouds: 4,
          artifacts: 6
        }
      },
      celestial_realm: {
        heightRange: [6000, 999999],
        colors: {
          primary: 0x9c27b0,
          secondary: 0xe91e63,
          accent: 0xff6d00
        },
        elements: {
          stars: 50,
          energyStreams: 5,
          orbs: 4
        }
      }
    },
    PARTICLES: {                     // Theme-specific particle configurations
      ancient_dust: {
        speed: [5, 15],
        scale: [0.1, 0.4],
        colors: [0x8d6e63, 0xa1887f, 0xbcaaa4],
        frequency: 100
      },
      crystal_sparkles: {
        speed: [10, 30],
        scale: [0.2, 0.6],
        colors: [0x7c4dff, 0x64ffda, 0x00e676],
        frequency: 80
      },
      sky_wisps: {
        speed: [20, 50],
        scale: [0.3, 0.8],
        colors: [0xe3f2fd, 0xbbdefb, 0x90caf9],
        frequency: 60
      },
      cosmic_energy: {
        speed: [15, 40],
        scale: [0.4, 1.0],
        colors: [0x9c27b0, 0xe91e63, 0xff6d00],
        frequency: 40
      }
    },
    LIGHTING: {                      // Background lighting effects
      crystal_intensity: 0.6,
      orb_intensity: 0.8,
      atmospheric_radius: 80,
      orb_radius: 120
    }
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