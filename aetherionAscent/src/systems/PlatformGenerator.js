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
   * @param {CoinSystem} coinSystem - Reference to coin system for coin generation
   */
  constructor(scene, voidSystem, coinSystem = null) {
    this.scene = scene;
    this.voidSystem = voidSystem;
    this.coinSystem = coinSystem;
    
    // Platform management
    this.platforms = [];
    this.lightEmitterPlatforms = [];
    this.nextChunkY = 0; // Y position for next chunk generation
    
    // Create physics group for platform collisions
    this.platformGroup = this.scene.physics.add.staticGroup();
    
    // Also store reference in scene for easy access
    this.scene.platformGroup = this.platformGroup;
    
    // Generation state tracking
    this.lastGeneratedY = this.scene.cameras.main.height;
    this.chunksGenerated = 0;
    
    // Performance optimization
    this.maxActivePlatforms = CONFIG.PERFORMANCE.MAX_VISIBLE_PLATFORMS;
    this.lastDestructionCheck = 0;
    
    // Stats tracking
    this.stats = {
      totalPlatforms: 0,
      lightEmitterPlatforms: 0,
      chunksGenerated: 0
    };
    
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
      
      // Base platform - bright and clean
      texture.fillStyle(0x6a6a8a, 1.0);
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
      // Create clean stone platform for gameplay
      
      // Base platform - bright and clearly visible
      texture.fillStyle(0x5a5a6a, 1.0);
      texture.fillRoundedRect(0, 0, width, height, 3);
      
      // Add simple texture details
      texture.fillStyle(0x6a6a7a, 1.0);
      texture.fillRect(2, 2, width - 4, height - 4);
      
      // Clean stone edges
      texture.fillStyle(0x7a7a8a, 1.0);
      texture.fillRect(0, 0, width, 2); // Top edge
      texture.fillRect(0, height - 2, width, 2); // Bottom edge
      
      // Simple stone block lines for texture
      for (let i = 0; i < width / 40; i++) {
        const lineX = i * 40 + 20;
        texture.fillStyle(0x4a4a5a, 0.7);
        texture.fillRect(lineX, 2, 1, height - 4);
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
    
    // CREATE IMMEDIATE STARTER SEQUENCE - reachable from starting platform
    this.createImmediateStarterPlatforms();
    
    // Generate strategic initial platforms
    for (let i = 0; i < 3; i++) {
      this.generateChunk();
    }
    
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
    this.createUnifiedPlatform(startX, startY, fullWidth, false);
    this.lastGeneratedY = startY;
    this.nextChunkY = startY - CONFIG.WORLD.CHUNK_HEIGHT;
  }

  /**
   * Create immediate platforms that are reachable from the starting platform
   */
  createImmediateStarterPlatforms() {
    const startY = this.scene.cameras.main.height - 100;
    const centerX = this.scene.cameras.main.width / 2;
    
    // Create a sequence of easily reachable platforms near the starting platform
    const starterPlatforms = [
      { x: centerX - 120, y: startY - 80, width: 160, light: false },   // First jump - easy
      { x: centerX + 100, y: startY - 160, width: 140, light: false },  // Second jump
      { x: centerX - 80, y: startY - 240, width: 180, light: true },    // Third jump with light
      { x: centerX + 90, y: startY - 320, width: 150, light: false },   // Fourth jump
      { x: centerX - 110, y: startY - 400, width: 170, light: true }    // Fifth jump - connects to chunks
    ];
    
    starterPlatforms.forEach((platform, index) => {
      this.createUnifiedPlatform(platform.x, platform.y, platform.width, platform.light);
      console.log(`🎯 Starter platform ${index + 1} created at (${platform.x}, ${platform.y})`);
    });
    
    // Update the last generated Y to connect properly with chunks
    this.lastGeneratedY = startY - 400;
    this.nextChunkY = startY - 500; // Start chunks from here
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
      // Determine platform properties FIRST
      const platformWidth = Phaser.Math.Between(
        CONFIG.WORLD.PLATFORM_MIN_WIDTH,
        CONFIG.WORLD.PLATFORM_MAX_WIDTH
      );
      
      // Calculate next platform position with width for collision avoidance
      const nextPosition = this.calculateNextPlatformPosition(previousX, currentY, platformWidth);
      
      const isLightEmitter = Math.random() < CONFIG.GENERATION.LIGHT_PLATFORM_CHANCE;
      
      // Create platform
      this.createUnifiedPlatform(nextPosition.x, nextPosition.y, platformWidth, isLightEmitter);
      
      // Update for next iteration - use actual platform center position
      previousX = nextPosition.x;
      currentY = nextPosition.y;
    }
    
    // Update generation tracking
    this.nextChunkY = chunkEndY;
    this.chunksGenerated++;
    this.lastGeneratedY = chunkEndY;
  }

  /**
   * Calculate next viable platform position with collision avoidance
   * @param {number} previousX - X position of previous platform center
   * @param {number} currentY - Current Y position
   * @param {number} nextPlatformWidth - Width of the platform to be created
   * @returns {object} {x, y} coordinates for next platform
   */
  calculateNextPlatformPosition(previousX, currentY, nextPlatformWidth = CONFIG.WORLD.PLATFORM_MIN_WIDTH) {
    // Ensure MINIMUM vertical spacing to prevent overlaps
    let verticalGap;
    
    // 70% normal gaps, 30% stepping stones (removed unreachable gaps)
    const gapType = Math.random();
    if (gapType < 0.7) {
      // Normal reachable jumping distance - ENSURE MINIMUM GAP
      verticalGap = Math.max(
        CONFIG.WORLD.PLATFORM_THICKNESS + 20, // Minimum to prevent overlap + safety margin
        Phaser.Math.Between(
          CONFIG.GENERATION.VERTICAL_SPACING_MIN,
          CONFIG.GENERATION.VERTICAL_SPACING_MAX
        )
      );
    } else {
      // Easier stepping stones for variety - ENSURE MINIMUM GAP
      verticalGap = Math.max(
        CONFIG.WORLD.PLATFORM_THICKNESS + 20, // Minimum to prevent overlap + safety margin
        Phaser.Math.Between(40, 55)
      );
    }
    
    // Smart horizontal positioning for better gameplay
    const maxHorizontalGap = CONFIG.GENERATION.MAX_HORIZONTAL_GAP;
    const minHorizontalGap = CONFIG.GENERATION.MIN_HORIZONTAL_GAP;
    
    // Account for platform widths to prevent horizontal overlaps
    const platformHalfWidth = nextPlatformWidth / 2;
    const maxPlatformHalfWidth = CONFIG.WORLD.PLATFORM_MAX_WIDTH / 2;
    
    // Ensure platforms stay within screen bounds with margin for platform width
    const screenMargin = Math.max(80, platformHalfWidth + 10);
    const minX = screenMargin + platformHalfWidth;
    const maxX = this.scene.cameras.main.width - screenMargin - platformHalfWidth;
    
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
    
    // Ensure strategic spacing - no clustering and account for platform widths
    const minSpacing = Math.max(minHorizontalGap, platformHalfWidth + maxPlatformHalfWidth + 10);
    if (Math.abs(horizontalOffset) < minSpacing) {
      horizontalOffset = horizontalOffset >= 0 ? minSpacing : -minSpacing;
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
    
    // Final bounds check with platform width
    nextX = Phaser.Math.Clamp(nextX, minX, maxX);
    
    return {
      x: nextX,
      y: currentY - verticalGap
    };
  }

  /**
   * 🏗️ UNIFIED PLATFORM CREATION METHOD
   * This is the ONLY method that should create platforms in the entire game.
   * All platform creation flows through here for consistency.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} width - Platform width
   * @param {boolean} hasLight - Whether platform emits light
   * @param {object} options - Additional options for platform customization
   * @returns {Phaser.Physics.Arcade.Sprite} The created platform
   */
  createUnifiedPlatform(x, y, width, hasLight = false, options = {}) {
    // Validate inputs to prevent invalid platforms
    if (x === undefined || y === undefined || !width || width <= 0) {
      console.warn('❌ Invalid platform parameters:', { x, y, width });
      return null;
    }

    // Ensure platform stays within reasonable bounds
    const screenWidth = this.scene.cameras.main.width;
    const clampedX = Phaser.Math.Clamp(x, 50, screenWidth - 50);
    const clampedWidth = Math.max(width, 60); // Minimum visible width
    
    // Check for collisions with existing platforms to prevent overlaps
    if (this.wouldOverlapExistingPlatform(clampedX, y, clampedWidth, CONFIG.WORLD.PLATFORM_THICKNESS)) {
      console.warn(`⚠️ Platform would overlap at (${clampedX}, ${y}), skipping creation`);
      return null;
    }

    try {
      // 🎮 STEP 1: Create physics sprite (always use staticSprite for consistent physics)
      const platform = this.scene.physics.add.staticSprite(clampedX, y, 'platform');
      
      if (!platform || !platform.body) {
        console.error('❌ Failed to create platform sprite or physics body');
        return null;
      }

      // 🎨 STEP 2: Configure visual appearance with high contrast
      platform.setDisplaySize(clampedWidth, CONFIG.WORLD.PLATFORM_THICKNESS);
      platform.setTint(hasLight ? CONFIG.THEME.LIGHT_PLATFORM_COLOR : CONFIG.THEME.PLATFORM_COLOR);
      platform.setDepth(15); // Higher depth to ensure visibility over background
      platform.setVisible(true);
      platform.setActive(true);
      platform.setAlpha(1.0);
      
      // Add subtle glow effect to make platforms more visible
      if (this.scene.lights) {
        // Add a subtle platform outline light for better visibility
        const outlineLight = this.scene.lights.addLight(
          platform.x,
          platform.y - 5, // Slightly above platform
          clampedWidth * 1.2, // Wider than platform
          hasLight ? 0x64ffda : 0xffffff, // Cyan for light platforms, white for normal
          0.3 // Subtle intensity
        );
        platform.platformData = platform.platformData || {};
        platform.platformData.outlineLight = outlineLight;
      }

      // ⚙️ STEP 3: Fix Static Body Alignment Bug (Phaser issue #2470)
      // Static bodies don't handle sprite origin correctly with setSize()
      // We need to manually position the body to match the visual exactly
      
      // Calculate where the physics body should be positioned
      const visualLeft = platform.x - (platform.displayWidth / 2);
      const visualTop = platform.y - (platform.displayHeight / 2);
      
      // Set physics body size first
      platform.body.setSize(clampedWidth, CONFIG.WORLD.PLATFORM_THICKNESS);
      
      // Manual body positioning to fix static body alignment bug
      platform.body.position.x = visualLeft;
      platform.body.position.y = visualTop;
      
      // Update body center after manual positioning
      platform.body.updateCenter();

      // 📊 STEP 4: Setup platform data (unified data structure)
      platform.platformData = {
        isLightEmitter: hasLight,
        width: clampedWidth,
        creationTime: this.scene.time.now,
        light: null,
        hasGap: options.hasGap || false,
        originalX: x,
        clampedX: clampedX,
        platformType: options.type || 'normal', // 'starting', 'normal', 'gap'
        ...options // Merge any additional options
      };

      // 🏗️ STEP 5: Add to unified platform management
      this.platforms.push(platform);
      this.platformGroup.add(platform);

      // 💡 STEP 6: Setup lighting if needed
      if (hasLight) {
        this.createPlatformLight(platform);
        this.lightEmitterPlatforms.push(platform);
      }

      // 📈 STEP 7: Update statistics
      this.stats.totalPlatforms++;
      if (hasLight) {
        this.stats.lightEmitterPlatforms++;
      }

      // 🔍 STEP 8: Debug logging for verification
      console.log(`✅ UNIFIED Platform created: pos(${clampedX}, ${y}), visual(${platform.displayWidth}x${platform.displayHeight}), physics(${platform.body.width}x${platform.body.height}), body pos(${Math.round(platform.body.x)}, ${Math.round(platform.body.y)}), light: ${hasLight}`);
      
      // 🪙 STEP 9: Add coin generation (after platform is created successfully)
      if (this.coinSystem && Math.random() < CONFIG.GENERATION.COIN_PLATFORM_CHANCE) {
        // Create coin at a strategic position on the platform
        // Add some variety to coin placement but keep them on platforms
        const platformLeft = platform.x - (platform.displayWidth / 2);
        const platformRight = platform.x + (platform.displayWidth / 2);
        const platformWidth = platform.displayWidth;
        
        // Position coin somewhere along the platform (avoiding edges)
        const edgeMargin = 20; // Keep coins away from platform edges
        const minX = platformLeft + edgeMargin;
        const maxX = platformRight - edgeMargin;
        
        // Random position along platform, or center if platform is too small
        let coinX = platform.x; // Default to center
        if (platformWidth > edgeMargin * 2) {
          coinX = Phaser.Math.Between(minX, maxX);
        }
        
        // Position coin at half player height (16px) above platform surface
        const platformTop = platform.y - (CONFIG.WORLD.PLATFORM_THICKNESS / 2);
        const coinY = platformTop - 16; // Half player height above platform surface
        
        this.coinSystem.createCoin(coinX, coinY, platform);
        
        console.log(`🪙 Coin placed on platform at (${Math.round(coinX)}, ${Math.round(coinY)}), platform top: ${Math.round(platformTop)}`);
      }

      return platform;

    } catch (error) {
      console.error('❌ Error in unified platform creation:', error);
      return null;
    }
  }

  /**
   * Main update loop - RE-ENABLED FOR PHASE 2
   * @param {number} cameraY - Current camera Y position
   */
  update(cameraY) {
    // PHASE 2: RE-ENABLE PLATFORM GENERATION AS PLAYER CLIMBS
    this.checkForNewChunkGeneration(cameraY);
    
    // Keep other systems disabled for now
    // this.updatePlatformLighting();
    // this.destroyPlatformsBelowVoid();
    
    // Platform generation is now active but other updates remain static
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
    // Remove main lighting
    if (platform.platformData?.light) {
      this.scene.lights.removeLight(platform.platformData.light);
    }
    
    // Remove outline lighting for visibility
    if (platform.platformData?.outlineLight) {
      this.scene.lights.removeLight(platform.platformData.outlineLight);
    }
    
    // Remove particles
    if (platform.platformData?.particles) {
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

  /**
   * Create lighting if this is a light-emitting platform
   * @param {Phaser.Physics.Arcade.Sprite} platform - The platform sprite
   */
  createPlatformLight(platform) {
    // Create light at platform position using correct Phaser 3.80.1 API
    const light = this.scene.lights.addLight(
      platform.x,
      platform.y - CONFIG.WORLD.PLATFORM_THICKNESS / 2,
      CONFIG.LIGHTING.PLATFORM_LIGHT_RADIUS,
      CONFIG.LIGHTING.PLATFORM_LIGHT_COLORS[0], // Use first color as default
      CONFIG.LIGHTING.PLATFORM_LIGHT_INTENSITY
    );
    
    // Store light reference in platform data
    if (!platform.platformData) {
      platform.platformData = {};
    }
    platform.platformData.light = light;
    
    console.log(`💡 Platform light created at (${platform.x}, ${platform.y})`);
    
    return light;
  }

  /**
   * Check if a new platform would overlap with existing platforms
   * @param {number} x - X position (center) of new platform
   * @param {number} y - Y position (center) of new platform  
   * @param {number} width - Width of new platform
   * @param {number} height - Height of new platform
   * @returns {boolean} True if would overlap, false if safe
   */
  wouldOverlapExistingPlatform(x, y, width, height) {
    // Calculate bounds of new platform
    const newLeft = x - width / 2;
    const newRight = x + width / 2;
    const newTop = y - height / 2;
    const newBottom = y + height / 2;
    
    // Check against all existing platforms
    for (const platform of this.platforms) {
      if (!platform || !platform.body) continue;
      
      // Get existing platform bounds
      const existingLeft = platform.body.x;
      const existingRight = platform.body.x + platform.body.width;
      const existingTop = platform.body.y;
      const existingBottom = platform.body.y + platform.body.height;
      
      // Check for overlap using axis-aligned bounding box collision
      const xOverlap = newLeft < existingRight && newRight > existingLeft;
      const yOverlap = newTop < existingBottom && newBottom > existingTop;
      
      if (xOverlap && yOverlap) {
        console.warn(`🚫 Collision detected with existing platform at (${platform.x}, ${platform.y})`);
        return true; // Overlap detected
      }
    }
    
    return false; // No overlap
  }
} 