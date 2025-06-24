import { CONFIG, getRandomPlatformLightColor } from '../config/gameConfig.js';

/**
 * PlatformGenerator - Procedural Platform Generation System
 * 
 * Generates platforms in chunks to ensure continuous, climbable paths.
 * Manages platform lifecycle including creation, lighting setup, and destruction.
 * Ensures optimal performance by limiting active platform count.
 * 
 * Generation Strategy:
 * - Chunk-based generation for seamless infinite climbing
 * - Ensures viable jumping paths between platforms
 * - Strategic placement of light-emitting platforms
 * - Memory management through platform destruction
 * 
 * @author Me
 * @version 1.0.0
 */
export class PlatformGenerator {
  /**
   * Initialize the platform generation system
   * @param {Phaser.Scene} scene - The game scene
   * @param {VoidSystem} voidSystem - Reference to void system for destruction management
   */
  constructor(scene, voidSystem) {
    this.scene = scene;
    this.voidSystem = voidSystem;
    
    // Platform management
    this.platforms = [];
    this.lightEmitterPlatforms = [];
    this.nextChunkY = 0; // Y position for next chunk generation
    
    // Generation state tracking
    this.lastGeneratedY = this.scene.cameras.main.height;
    this.chunksGenerated = 0;
    
    // Performance optimization
    this.maxActivePlatforms = CONFIG.PERFORMANCE.MAX_VISIBLE_PLATFORMS;
    this.lastDestructionCheck = 0;
    
    // Platform textures (will be created procedurally)
    this.createPlatformTextures();
    
    // Generate initial chunks
    this.generateInitialChunks();
  }

  /**
   * Create procedural platform textures
   * Since we don't have image assets yet, we'll create them programmatically
   */
  createPlatformTextures() {
    // Standard platform texture
    this.createPlatformTexture('platform', CONFIG.THEME.PLATFORM_COLOR, false);
    
    // Light-emitting platform texture
    this.createPlatformTexture('lightPlatform', CONFIG.THEME.LIGHT_PLATFORM_COLOR, true);
    
    // Note: 'particle' texture is created in GameScene.createBasicTextures()
  }

  /**
   * Create a platform texture programmatically
   * @param {string} key - Texture key
   * @param {number} color - Platform color
   * @param {boolean} isLightEmitter - Whether this platform emits light
   */
  createPlatformTexture(key, color, isLightEmitter) {
    const width = CONFIG.WORLD.PLATFORM_MAX_WIDTH;
    const height = CONFIG.WORLD.PLATFORM_THICKNESS;
    
    // Create texture
    const texture = this.scene.add.graphics();
    
    if (isLightEmitter) {
      // Create glowing crystal-like platform
      
      // Base platform
      texture.fillStyle(color, 1.0);
      texture.fillRoundedRect(0, 0, width, height, 4);
      
      // Add crystal formations
      texture.fillStyle(0x7c4dff, 0.8);
      for (let i = 0; i < 3; i++) {
        const x = (width / 4) * (i + 1);
        const crystalHeight = height + 10;
        texture.fillTriangle(
          x - 8, height,
          x + 8, height,
          x, height - crystalHeight
        );
      }
      
      // Add glow effect
      texture.fillStyle(0x64ffda, 0.3);
      texture.fillRoundedRect(-2, -2, width + 4, height + 4, 6);
      
    } else {
      // Create standard stone platform
      
      // Base platform
      texture.fillStyle(color, 1.0);
      texture.fillRoundedRect(0, 0, width, height, 3);
      
      // Add texture details (stone-like appearance)
      texture.fillStyle(color + 0x101010, 0.7);
      texture.fillRect(5, 2, width - 10, 3);
      texture.fillRect(8, height - 5, width - 16, 3);
      
      // Add moss/lichen details
      texture.fillStyle(0x2d5a2d, 0.6);
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * (width - 20) + 10;
        const mossWidth = Math.random() * 10 + 5;
        texture.fillEllipse(x, height / 2, mossWidth, 4);
      }
    }
    
    // Generate texture from graphics
    texture.generateTexture(key, width, height);
    texture.destroy();
  }



  /**
   * Generate initial platform chunks
   */
  generateInitialChunks() {
    console.log('🏗️ Starting platform generation...');
    
    // Clear any existing platforms first
    this.platforms = [];
    this.lightEmitterPlatforms = [];
    
    // Generate starting platform at bottom of screen
    this.createStartingPlatform();
    
    // Generate strategic initial platforms
    for (let i = 0; i < 3; i++) {
      this.generateChunk();
    }
    
    // Add strategic starter sequence
    this.createStarterSequence();
    
    console.log(`✅ Platform generation complete. Total platforms: ${this.platforms.length}`);
    this.debugAllPlatforms();
  }

  /**
   * Create the initial starting platform - always full width and solid
   */
  createStartingPlatform() {
    const startY = this.scene.cameras.main.height - 100;
    const fullWidth = this.scene.cameras.main.width - 40; // Full screen width minus small margin
    const startX = this.scene.cameras.main.width / 2 - fullWidth / 2;
    
    // Force creation of solid platform (no gaps allowed for starting platform)
    this.createSolidPlatform(startX, startY, fullWidth, false);
    this.lastGeneratedY = startY;
    this.nextChunkY = startY - CONFIG.WORLD.CHUNK_HEIGHT;
  }

  /**
   * Create a reachable starter sequence
   */
  createStarterSequence() {
    const startY = this.scene.cameras.main.height - 100;
    const centerX = this.scene.cameras.main.width / 2;
    
    // Create starter platforms with guaranteed reachable spacing
    const starterPlatforms = [
      { x: centerX - 100, y: startY - 70, width: 180, light: false },
      { x: centerX + 80, y: startY - 140, width: 160, light: true },
      { x: centerX - 90, y: startY - 210, width: 200, light: false },
      { x: centerX + 70, y: startY - 280, width: 170, light: true },
      { x: centerX - 110, y: startY - 350, width: 190, light: false }
    ];
    
    starterPlatforms.forEach(platform => {
      this.createPlatform(platform.x, platform.y, platform.width, platform.light);
    });
  }

  /**
   * Generate a chunk of platforms
   */
  generateChunk() {
    const chunkStartY = this.nextChunkY;
    const chunkEndY = chunkStartY - CONFIG.WORLD.CHUNK_HEIGHT;
    
    let currentY = chunkStartY;
    let previousX = this.scene.cameras.main.width / 2; // Start from screen center
    
    while (currentY > chunkEndY) {
      // Calculate next platform position
      const nextPosition = this.calculateNextPlatformPosition(previousX, currentY);
      
      // Determine platform properties
      const platformWidth = Phaser.Math.Between(
        CONFIG.WORLD.PLATFORM_MIN_WIDTH,
        CONFIG.WORLD.PLATFORM_MAX_WIDTH
      );
      
      const isLightEmitter = Math.random() < CONFIG.GENERATION.LIGHT_PLATFORM_CHANCE;
      
      // Create platform
      this.createPlatform(nextPosition.x, nextPosition.y, platformWidth, isLightEmitter);
      
      // Update for next iteration
      previousX = nextPosition.x + platformWidth / 2;
      currentY = nextPosition.y;
    }
    
    // Update generation tracking
    this.nextChunkY = chunkEndY;
    this.chunksGenerated++;
    this.lastGeneratedY = chunkEndY;
  }

  /**
   * Calculate next viable platform position
   * @param {number} previousX - X position of previous platform center
   * @param {number} currentY - Current Y position
   * @returns {object} {x, y} coordinates for next platform
   */
  calculateNextPlatformPosition(previousX, currentY) {
    // Ensure all platforms are reachable
    let verticalGap;
    
    // 70% normal gaps, 30% stepping stones (removed unreachable gaps)
    const gapType = Math.random();
    if (gapType < 0.7) {
      // Normal reachable jumping distance
      verticalGap = Phaser.Math.Between(
        CONFIG.GENERATION.VERTICAL_SPACING_MIN,
        CONFIG.GENERATION.VERTICAL_SPACING_MAX
      );
    } else {
      // Easier stepping stones for variety
      verticalGap = Phaser.Math.Between(40, 55);
    }
    
    // Smart horizontal positioning for better gameplay
    const maxHorizontalGap = CONFIG.GENERATION.MAX_HORIZONTAL_GAP;
    const minHorizontalGap = CONFIG.GENERATION.MIN_HORIZONTAL_GAP;
    
    // Ensure platforms stay within screen bounds with margin
    const screenMargin = 80;
    const minX = screenMargin;
    const maxX = this.scene.cameras.main.width - CONFIG.WORLD.PLATFORM_MAX_WIDTH - screenMargin;
    
    // Create reachable patterns with good spacing
    let horizontalOffset;
    const patternChoice = Math.random();
    
    if (patternChoice < 0.5) {
      // Gentle zigzag patterns - always reachable
      const direction = Math.sin(this.chunksGenerated * 0.4 + currentY * 0.01) > 0 ? 1 : -1;
      horizontalOffset = direction * Phaser.Math.Between(minHorizontalGap, maxHorizontalGap * 0.7);
    } else if (patternChoice < 0.9) {
      // Random positioning - limited to reachable range
      horizontalOffset = Phaser.Math.Between(-maxHorizontalGap * 0.8, maxHorizontalGap * 0.8);
    } else {
      // Close sequences for easier progression
      horizontalOffset = Phaser.Math.Between(-minHorizontalGap * 1.2, minHorizontalGap * 1.2);
    }
    
    // Ensure strategic spacing - no clustering
    if (Math.abs(horizontalOffset) < minHorizontalGap) {
      horizontalOffset = horizontalOffset >= 0 ? minHorizontalGap : -minHorizontalGap;
    }
    
    let nextX = previousX + horizontalOffset;
    
    // Smart bounds clamping that creates wall bounce effect
    if (nextX < minX) {
      nextX = minX;
      // Bias next platform away from wall
      this.wallBounceDirection = 1;
    } else if (nextX > maxX) {
      nextX = maxX;
      // Bias next platform away from wall  
      this.wallBounceDirection = -1;
    }
    
    // Apply wall bounce influence for next platform
    if (this.wallBounceDirection) {
      nextX += this.wallBounceDirection * 20;
      this.wallBounceDirection = null; // Reset
    }
    
    return {
      x: nextX,
      y: currentY - verticalGap
    };
  }

  /**
   * Create a single platform with all associated systems
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Platform width
   * @param {boolean} isLightEmitter - Whether platform emits light
   */
  createPlatform(x, y, width, isLightEmitter) {
    // Temporarily disable gap system to fix invisible platforms
    // TODO: Re-implement gap system with proper positioning
    return this.createSolidPlatform(x, y, width, isLightEmitter);
  }

  /**
   * Create a solid platform without gaps
   */
  createSolidPlatform(x, y, width, isLightEmitter) {
    // Validate inputs to prevent invisible platforms
    if (x === undefined || y === undefined || !width || width <= 0) {
      console.warn('Invalid platform parameters:', { x, y, width });
      return null;
    }
    
    // Ensure platform stays within reasonable bounds
    const screenWidth = this.scene.cameras.main.width;
    const clampedX = Phaser.Math.Clamp(x, 50, screenWidth - 50);
    const clampedWidth = Math.max(width, 60); // Minimum visible width
    
    try {
      // Create platform sprite
      const textureKey = isLightEmitter ? 'lightPlatform' : 'platform';
      const platform = this.scene.physics.add.staticSprite(clampedX, y, textureKey);
      
      // Validate that the sprite was created properly
      if (!platform || !platform.body) {
        console.error('Failed to create platform sprite or physics body');
        return null;
      }
      
      // Scale platform to desired width
      const scaleX = clampedWidth / CONFIG.WORLD.PLATFORM_MAX_WIDTH;
      platform.setScale(scaleX, 1);
      
      // Set physics body to match visual size
      platform.body.setSize(clampedWidth, CONFIG.WORLD.PLATFORM_THICKNESS);
      platform.body.setOffset(0, 0); // Reset any offset issues
      
      // Set render depth to ensure visibility
      platform.setDepth(1);
      
      // Make sure platform is visible and has proper alpha
      platform.setVisible(true);
      platform.setActive(true);
      platform.setAlpha(1.0); // Fully opaque
      
      // Add bright debug tint to make all platforms clearly visible
      platform.setTint(isLightEmitter ? 0xffffff : 0xaaaaaa);
      
      // Platform data
      platform.platformData = {
        isLightEmitter: isLightEmitter,
        width: clampedWidth,
        creationTime: this.scene.time.now,
        light: null,
        hasGap: false,
        originalX: x,
        clampedX: clampedX
      };
      
      // Add to platform list
      this.platforms.push(platform);
      
      // Setup lighting if this is a light emitter
      if (isLightEmitter) {
        this.setupPlatformLighting(platform);
        this.lightEmitterPlatforms.push(platform);
      }
      
      // Setup platform physics group (for player collision)
      if (!this.scene.platformGroup) {
        this.scene.platformGroup = this.scene.physics.add.staticGroup();
      }
      this.scene.platformGroup.add(platform);
      
      // Debug output for every platform
      console.log(`✅ Platform created: pos(${clampedX}, ${y}), size(${clampedWidth}x${CONFIG.WORLD.PLATFORM_THICKNESS}), visible: ${platform.visible}, alpha: ${platform.alpha}`);
      
      return platform;
      
    } catch (error) {
      console.error('Error creating platform:', error);
      return null;
    }
  }

  /**
   * Create a platform with a gap in the middle for jumping through
   */
  createPlatformWithGap(x, y, width, isLightEmitter) {
    const gapWidth = Phaser.Math.Between(CONFIG.GENERATION.GAP_WIDTH_MIN, CONFIG.GENERATION.GAP_WIDTH_MAX);
    const leftWidth = (width - gapWidth) * 0.5;
    const rightWidth = width - gapWidth - leftWidth;
    
    // Create left piece
    const leftPlatform = this.createSolidPlatform(x - gapWidth/2 - rightWidth/2, y, leftWidth, isLightEmitter);
    
    // Create right piece  
    const rightPlatform = this.createSolidPlatform(x + gapWidth/2 + leftWidth/2, y, rightWidth, isLightEmitter);
    
    // Mark both pieces as having gaps
    leftPlatform.platformData.hasGap = true;
    rightPlatform.platformData.hasGap = true;
    leftPlatform.platformData.gapPartner = rightPlatform;
    rightPlatform.platformData.gapPartner = leftPlatform;
    
    // Create visual gap indicator (subtle glow effect)
    this.createGapIndicator(x, y, gapWidth);
    
    return leftPlatform; // Return one for reference
  }

  /**
   * Create a visual indicator for platform gaps
   */
  createGapIndicator(x, y, gapWidth) {
    // Create subtle particle effects to show the gap
    const gapParticles = this.scene.add.particles(x, y + 5, 'particle', {
      speed: { min: 2, max: 8 },
      scale: { start: 0.2, end: 0 },
      lifespan: { min: 1000, max: 2000 },
      alpha: { start: 0.4, end: 0 },
      tint: 0x64ffda, // Cyan to match player light
      frequency: 200,
      quantity: 1,
      emitZone: { type: 'edge', source: new Phaser.Geom.Rectangle(-gapWidth/2, -5, gapWidth, 10), quantity: 2 }
    });
    
    gapParticles.setDepth(-1);
    
    // Store reference for cleanup
    if (!this.gapIndicators) {
      this.gapIndicators = [];
    }
    this.gapIndicators.push(gapParticles);
  }

  /**
   * Setup dynamic lighting for light-emitting platforms
   * @param {Phaser.GameObjects.Sprite} platform - The platform sprite
   */
  setupPlatformLighting(platform) {
    // Create light at platform position
    const light = this.scene.lights.addLight(
      platform.x,
      platform.y - CONFIG.WORLD.PLATFORM_THICKNESS / 2,
      CONFIG.LIGHTING.PLATFORM_LIGHT_RADIUS,
      getRandomPlatformLightColor(),
      CONFIG.LIGHTING.PLATFORM_LIGHT_INTENSITY
    );
    
    // Store light reference
    platform.platformData.light = light;
    
    // Add subtle particle effects
    this.createPlatformParticles(platform);
  }

  /**
   * Create particle effects for light-emitting platforms
   * @param {Phaser.GameObjects.Sprite} platform - The platform sprite
   */
  createPlatformParticles(platform) {
    const particles = this.scene.add.particles(platform.x, platform.y - 10, 'particle', {
      speed: { min: 5, max: 15 },
      scale: { start: 0.1, end: 0 },
      lifespan: { min: 2000, max: 3000 },
      alpha: { start: 0.6, end: 0 },
      tint: platform.platformData.light.color,
      frequency: 300,
      quantity: 1
    });
    
    particles.setDepth(-1);
    platform.platformData.particles = particles;
  }

  /**
   * Main update loop - DISABLED FOR PHASE 1 STABILITY
   * @param {number} cameraY - Current camera Y position
   */
  update(cameraY) {
    // PHASE 1: DISABLE ALL PLATFORM UPDATES TO PREVENT TELEPORTING
    // Static platform generation only
    
    // this.checkForNewChunkGeneration(cameraY);
    // this.updatePlatformLighting();
    // this.destroyPlatformsBelowVoid();
    
    // Platform system is now completely static for Phase 1
  }

  /**
   * Check if we need to generate new platform chunks
   * @param {number} cameraY - Current camera Y position
   */
  checkForNewChunkGeneration(cameraY) {
    const generationDistance = CONFIG.GENERATION.SAFE_SPAWN_DISTANCE;
    
    if (cameraY < this.lastGeneratedY + generationDistance) {
      this.generateChunk();
    }
  }

  /**
   * Update lighting effects for all light-emitting platforms (throttled)
   */
  updatePlatformLighting() {
    // Only update lighting every few frames to prevent visual instability
    if (this.scene.time.now % 100 < 16) { // Roughly every 6th frame at 60fps
      this.lightEmitterPlatforms.forEach(platform => {
        if (platform.platformData.light) {
          // Much more subtle flicker effect
          const flicker = Math.sin(this.scene.time.now * CONFIG.LIGHTING.LIGHT_FLICKER_SPEED * 0.0002) * 
                         (CONFIG.LIGHTING.LIGHT_FLICKER_INTENSITY * 0.3) + 1.0;
          
          platform.platformData.light.intensity = CONFIG.LIGHTING.PLATFORM_LIGHT_INTENSITY * flicker;
        }
      });
    }
  }

  /**
   * Destroy platforms that have fallen below the void
   */
  destroyPlatformsBelowVoid() {
    const destructionThreshold = this.voidSystem.getDestructionThreshold();
    
    // Filter out platforms below destruction threshold
    this.platforms = this.platforms.filter(platform => {
      if (platform.y > destructionThreshold) {
        this.destroyPlatform(platform);
        return false;
      }
      return true;
    });
    
    // Also clean light emitter list
    this.lightEmitterPlatforms = this.lightEmitterPlatforms.filter(platform => 
      platform.y <= destructionThreshold
    );
  }

  /**
   * Destroy a single platform and all associated resources
   * @param {Phaser.GameObjects.Sprite} platform - Platform to destroy
   */
  destroyPlatform(platform) {
    // Remove lighting
    if (platform.platformData.light) {
      this.scene.lights.removeLight(platform.platformData.light);
    }
    
    // Remove particles
    if (platform.platformData.particles) {
      platform.platformData.particles.destroy();
    }
    
    // Remove from physics group
    if (this.scene.platformGroup) {
      this.scene.platformGroup.remove(platform);
    }
    
    // Destroy sprite
    platform.destroy();
  }

  /**
   * Get all current platforms
   * @returns {Array} Array of platform sprites
   */
  getPlatforms() {
    return this.platforms;
  }

  /**
   * Get all light-emitting platforms
   * @returns {Array} Array of light-emitting platform sprites
   */
  getLightEmitterPlatforms() {
    return this.lightEmitterPlatforms;
  }

  /**
   * Get generation statistics
   * @returns {object} Generation stats
   */
  getStats() {
    return {
      totalPlatforms: this.platforms.length,
      lightEmitterPlatforms: this.lightEmitterPlatforms.length,
      chunksGenerated: this.chunksGenerated,
      lastGeneratedY: this.lastGeneratedY
    };
  }

  /**
   * Debug function to log all platform positions and properties
   */
  debugAllPlatforms() {
    console.log('🔍 All platforms:');
    this.platforms.forEach((platform, index) => {
      if (platform && platform.body) {
        console.log(`Platform ${index}: pos(${platform.x}, ${platform.y}), body(${platform.body.x}, ${platform.body.y}, ${platform.body.width}x${platform.body.height}), visible: ${platform.visible}, alpha: ${platform.alpha}`);
      } else {
        console.log(`Platform ${index}: INVALID - no body or sprite`);
      }
    });
  }

  /**
   * Clean up all platform resources
   */
  destroy() {
    // Destroy all platforms
    this.platforms.forEach(platform => this.destroyPlatform(platform));
    
    // Clear arrays
    this.platforms = [];
    this.lightEmitterPlatforms = [];
  }
} 