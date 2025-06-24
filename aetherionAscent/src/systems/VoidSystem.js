import { CONFIG } from '../config/gameConfig.js';

/**
 * VoidSystem - Manages the Rising Void Mechanics
 * 
 * The void is both a visual spectacle and gameplay pressure mechanism.
 * It rises continuously, destroying platforms and threatening the player.
 * As time progresses, it accelerates, creating mounting tension.
 * 
 * Visual Features:
 * - Animated energy dissolution effect
 * - Particle emissions at the void edge
 * - Screen distortion when player gets close
 * - Dynamic lighting that interacts with environment
 * 
 * @author Me
 * @version 1.0.0
 */
export class VoidSystem {
  /**
   * Initialize the void system
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Void position and movement
    this.voidY = scene.cameras.main.height + 100; // Start below visible area
    this.currentSpeed = CONFIG.WORLD.VOID_RISE_SPEED;
    this.acceleration = CONFIG.WORLD.VOID_ACCELERATION;
    
    // Visual components
    this.voidGraphics = null;
    this.voidLight = null;
    this.edgeParticles = null;
    
    // Performance optimization
    this.platformsToDestroy = [];
    this.lastUpdateTime = 0;
    
    // Distortion effect for proximity
    this.distortionStrength = 0;
    this.proximityThreshold = 300;
    
    this.createVoidVisuals();
    this.createVoidLight();
    this.createEdgeParticles();
  }

  /**
   * Create the main void visual representation
   * A gradient rectangle with animated energy effects
   */
  createVoidVisuals() {
    const { width, height } = this.scene.cameras.main;
    
    // Create graphics object for void rendering
    this.voidGraphics = this.scene.add.graphics();
    
    // Set depth to ensure void renders behind platforms but above background
    this.voidGraphics.setDepth(-10);
    
    // Initial void height (will grow as it rises)
    this.voidHeight = 200;
    
    // Create static graphics once
    this.createStaticVoidGraphics();
  }

  /**
   * Update only the void position (not graphics) to prevent constant redrawing
   */
  updateVoidPosition() {
    // Only update position, not recreate graphics
    // Move the existing graphics object instead of redrawing
    if (this.voidGraphics) {
      this.voidGraphics.y = this.voidY;
    }
  }

  /**
   * Create static void graphics (called once, not every frame)
   */
  createStaticVoidGraphics() {
    const { width } = this.scene.cameras.main;
    
    this.voidGraphics.clear();
    
    // Create void graphics ONCE - don't recreate every frame
    this.voidGraphics.fillGradientStyle(CONFIG.THEME.VOID_COLOR, CONFIG.THEME.VOID_COLOR, 0x7c4dff, 0x7c4dff, 0.8);
    this.voidGraphics.fillRect(0, 0, width, this.voidHeight);
    
    // Add energy edge effect
    this.voidGraphics.fillStyle(0x7c4dff, 0.6);
    this.voidGraphics.fillRect(0, -10, width, 20);
  }

  /**
   * Create dynamic lighting for the void
   */
  createVoidLight() {
    // Main void light that follows the void edge
    this.voidLight = this.scene.lights.addLight(
      this.scene.cameras.main.width / 2,
      this.voidY,
      CONFIG.LIGHTING.PLATFORM_LIGHT_RADIUS * 3,
      CONFIG.THEME.VOID_COLOR,
      CONFIG.LIGHTING.PLATFORM_LIGHT_INTENSITY * 0.8
    );
  }

  /**
   * Create particle effects for void edge
   */
  createEdgeParticles() {
    // Check if particle texture exists before creating particles
    if (this.scene.textures.exists('particle')) {
      // Particle emitter for void edge effects
      this.edgeParticles = this.scene.add.particles(0, 0, 'particle', {
        speed: { min: 20, max: 60 },
        scale: { start: 0.2, end: 0 },
        lifespan: { min: 1000, max: 2000 },
        alpha: { start: 0.8, end: 0 },
        tint: [CONFIG.THEME.VOID_COLOR, 0x7c4dff, 0x9c27b0],
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Rectangle(0, 0, this.scene.cameras.main.width, 20),
          quantity: 3
        },
        frequency: 50
      });
      
      this.edgeParticles.setDepth(-5);
    } else {
      console.warn('⚠️ Particle texture not found, void particles disabled');
      this.edgeParticles = null;
    }
  }

  /**
   * Main update loop for void system - DISABLED FOR PHASE 1 STABILITY
   * @param {number} deltaTime - Time elapsed since last frame (seconds)
   * @param {number} playerY - Current player Y position for proximity effects
   */
  update(deltaTime, playerY = null) {
    // PHASE 1: COMPLETELY DISABLE VOID MOVEMENT TO PREVENT TELEPORTING
    // All void updates disabled for maximum stability
    
    // this.updateVoidMovement(deltaTime);
    // this.updateVoidPosition();
    // this.updateVoidLight();
    // this.updateEdgeParticles();
    // this.updateProximityEffects(playerY);
    // this.checkPlatformDestruction();
    
    // Void system is now completely static for Phase 1
  }

  /**
   * Update void movement and acceleration
   * @param {number} deltaTime - Time elapsed since last frame (seconds)
   */
  updateVoidMovement(deltaTime) {
    // Gradually increase void speed (mounting pressure)
    this.currentSpeed += this.acceleration * deltaTime;
    
    // Move void upward
    this.voidY -= this.currentSpeed * deltaTime;
    
    // Increase void height slightly as it rises (visual effect)
    this.voidHeight = Math.min(this.voidHeight + deltaTime * 20, 400);
  }

  /**
   * Update void lighting effects
   */
  updateVoidLight() {
    // Update light position to follow void edge
    this.voidLight.x = this.scene.cameras.main.width / 2;
    this.voidLight.y = this.voidY;
    
    // Animate light intensity for pulsing effect
    const pulse = Math.sin(this.scene.time.now * 0.003) * 0.2 + 0.8;
    this.voidLight.intensity = CONFIG.LIGHTING.PLATFORM_LIGHT_INTENSITY * pulse;
  }

  /**
   * Update particle effects at void edge
   */
  updateEdgeParticles() {
    if (this.edgeParticles) {
      // Position particle emitter at void edge
      this.edgeParticles.setPosition(0, this.voidY);
      
      // Adjust particle emission rate based on void speed (more intense when faster)
      const intensityMultiplier = Math.min(this.currentSpeed / CONFIG.WORLD.VOID_RISE_SPEED, 3);
      this.edgeParticles.frequency = 50 / intensityMultiplier;
    }
  }

  /**
   * Handle proximity effects when player gets close to void
   * @param {number} playerY - Current player Y position
   */
  updateProximityEffects(playerY) {
    const distanceToVoid = playerY - this.voidY;
    
    if (distanceToVoid < this.proximityThreshold) {
      // Calculate proximity ratio (0 = touching void, 1 = at threshold distance)
      const proximityRatio = Math.max(0, distanceToVoid / this.proximityThreshold);
      
      // Increase distortion as player gets closer
      this.distortionStrength = (1 - proximityRatio) * CONFIG.POST_PROCESSING.DISTORTION_MAX_STRENGTH;
      
      // Apply screen shake when very close
      if (proximityRatio < 0.3) {
        const shakeIntensity = (0.3 - proximityRatio) * CONFIG.CAMERA.SHAKE_INTENSITY;
        this.scene.cameras.main.shake(100, shakeIntensity);
      }
    } else {
      // Decay distortion when away from void
      this.distortionStrength *= CONFIG.POST_PROCESSING.DISTORTION_DECAY_RATE;
    }
  }

  /**
   * Check for platforms that need to be destroyed by the void
   */
  checkPlatformDestruction() {
    // This will be called by the platform generator
    // to destroy platforms that have fallen below the void
    const destructionY = this.voidY + CONFIG.WORLD.PLATFORM_DESTRUCTION_OFFSET;
    
    // Store destruction threshold for other systems to use
    this.destructionThreshold = destructionY;
  }

  /**
   * Get current void position
   * @returns {number} Current Y position of void edge
   */
  getVoidY() {
    return this.voidY;
  }

  /**
   * Get current void speed
   * @returns {number} Current void rising speed
   */
  getVoidSpeed() {
    return this.currentSpeed;
  }

  /**
   * Get destruction threshold for platforms
   * @returns {number} Y position where platforms should be destroyed
   */
  getDestructionThreshold() {
    return this.destructionThreshold || this.voidY + CONFIG.WORLD.PLATFORM_DESTRUCTION_OFFSET;
  }

  /**
   * Get current distortion strength for post-processing
   * @returns {number} Distortion strength (0-1)
   */
  getDistortionStrength() {
    return this.distortionStrength;
  }

  /**
   * Clean up void system resources
   */
  destroy() {
    if (this.voidGraphics) {
      this.voidGraphics.destroy();
    }
    
    if (this.voidLight) {
      this.scene.lights.removeLight(this.voidLight);
    }
    
    if (this.edgeParticles) {
      this.edgeParticles.destroy();
    }
  }
} 