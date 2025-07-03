import { CONFIG, getRandomParticleColor } from '../config/gameConfig.js';
import { VoidSystem } from '../systems/VoidSystem.js';
import { PlatformGenerator } from '../systems/PlatformGenerator.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { ScoringSystem } from '../systems/ScoringSystem.js';
import { CoinSystem } from '../systems/CoinSystem.js';
import { BackgroundSystem } from '../systems/BackgroundSystem.js';
import { AiSystem } from '../systems/AiSystem.js';
import { ChatSystem } from '../systems/ChatSystem.js';
import { VisualEffectsSystem } from '../systems/VisualEffectsSystem.js';

// Import shaders as text
import bloomShader from '../shaders/bloom.frag?raw';
import vignetteShader from '../shaders/vignette.frag?raw';
import distortionShader from '../shaders/distortion.frag?raw';

/**
 * GameScene - Main Gameplay Scene for Aetherion Ascent
 * 
 * This scene orchestrates all game systems and visual effects:
 * - Light2D pipeline for dynamic lighting and shadows
 * - Post-processing effects (bloom, vignette, distortion)
 * - Rising void mechanics and visual spectacle
 * - Procedural platform generation
 * - Atmospheric particle systems
 * - Smooth camera following
 * 
 * Phase 1 Focus:
 * - Establish robust visual foundation
 * - Ensure all pipelines work flawlessly
 * - Create stunning atmospheric world
 * - Prepare for player integration in Phase 2
 * 
 * @author Me
 * @version 1.0.0
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    
    // Core systems
    this.voidSystem = null;
    this.platformGenerator = null;
    this.player = null;
    this.scoringSystem = null;
    this.coinSystem = null;
    this.backgroundSystem = null;
    
    // AI and Enemy systems
    this.enemies = [];
    this.aiSystem = null;
    this.chatSystem = null;
    
    // Visual systems
    this.backgroundLayers = [];
    this.ambientParticles = null;
    this.lightManager = null;
    this.visualEffectsSystem = null;
    
    // Post-processing
    this.postProcessingPipeline = null;
    this.shaderUniforms = {};
    
    // Camera and world state
    this.cameraTarget = { x: 0, y: 0 };
    this.worldBounds = {
      top: -10000, // Extend upward for infinite climbing
      bottom: 2000,
      left: 0,
      right: CONFIG.GAME.WIDTH
    };
    
    // Debug and performance
    this.debugMode = true;
    this.performanceMetrics = {
      platformCount: 0,
      particleCount: 0,
      lightCount: 0
    };
  }

  /**
   * Preload assets and shaders
   */
  preload() {
    console.log('🔄 Loading Aetherion Ascent assets...');
    
    // Since we're creating textures procedurally, we don't need external assets
    // This is placeholder for future asset loading
    
    this.load.on('progress', (value) => {
      console.log(`📦 Loading progress: ${Math.round(value * 100)}%`);
    });
  }

  /**
   * Initialize the game world and all systems
   */
  create() {
    console.log('🌟 Creating mystical world of Aetherion Ascent...');
    
    // Create basic textures first (needed by other systems)
    this.createBasicTextures();
    
    // Setup rendering pipelines
    this.setupLightingPipeline();
    this.setupPostProcessingPipeline();
    
    // Create world environment (now handled by BackgroundSystem)
    this.createAmbientParticles();
    
    // Initialize core game systems
    this.initializeCoreSystems();
    
    // Initialize visual effects system
    this.visualEffectsSystem = new VisualEffectsSystem(this);
    
    // Setup camera behavior
    this.setupCamera();
    
    // Setup world physics bounds
    this.setupWorldBounds();
    
    // Initialize debug systems if needed
    this.setupDebugSystems();
    
    // Set initial camera target (center of starting platform)
    this.cameraTarget.x = CONFIG.GAME.WIDTH / 2;
    this.cameraTarget.y = CONFIG.GAME.HEIGHT - 100;
    
    // Wait for systems to be ready, then create player
    // This ensures platforms are created before setting up collisions
    this.time.delayedCall(100, () => {
      this.createPlayer();
      this.createScoreDisplay();
      this.initializeAiSystems();
      
      // Connect AI system to visual effects system
      if (this.aiSystem && this.visualEffectsSystem) {
        this.aiSystem.setVisualEffectsSystem(this.visualEffectsSystem);
      }
      
      // Connect coin system to visual effects system
      if (this.coinSystem && this.visualEffectsSystem) {
        this.coinSystem.setVisualEffectsSystem(this.visualEffectsSystem);
      }
      
      // Connect player to visual effects system
      if (this.player && this.visualEffectsSystem) {
        this.player.setVisualEffectsSystem(this.visualEffectsSystem);
      }
    });
    
    console.log('✨ Mystical world created successfully!');
    this.logSystemStatus();
    
    // Make scene globally accessible for debugging
    window.gameScene = this;
    console.log('🔧 Debug: gameScene is now available globally. Try: gameScene.aiSystem.testWindEffect()');
  }

  /**
   * Create basic textures needed by various systems
   */
  createBasicTextures() {
    console.log('🎨 Creating basic textures...');
    
    // Create simple particle texture for effects
    const size = 8;
    const texture = this.add.graphics();
    
    // Create glowing particle
    texture.fillStyle(0xffffff, 1.0);
    texture.fillCircle(size / 2, size / 2, size / 2);
    
    // Add glow
    texture.fillStyle(0xffffff, 0.3);
    texture.fillCircle(size / 2, size / 2, size);
    
    texture.generateTexture('particle', size * 2, size * 2);
    texture.destroy();
    
    // Create player texture - glowing hero character
    const playerGfx = this.add.graphics();
    
    // Main player body (rectangle with rounded corners)
    playerGfx.fillStyle(CONFIG.LIGHTING.PLAYER_LIGHT_COLOR, 1.0);
    playerGfx.fillRoundedRect(2, 2, 20, 28, 4);
    
    // Inner glow
    playerGfx.fillStyle(0xffffff, 0.8);
    playerGfx.fillRoundedRect(6, 6, 12, 20, 2);
    
    // Eyes or core light
    playerGfx.fillStyle(0xffffff, 1.0);
    playerGfx.fillCircle(8, 12, 1);
    playerGfx.fillCircle(16, 12, 1);
    
    playerGfx.generateTexture('player', 24, 32);
    playerGfx.destroy();
    
    // Create platform texture
    const platformTexture = this.add.graphics();
    platformTexture.fillStyle(CONFIG.THEME.PLATFORM_COLOR);
    platformTexture.fillRect(0, 0, 200, CONFIG.WORLD.PLATFORM_THICKNESS);
    platformTexture.generateTexture('platform', 200, CONFIG.WORLD.PLATFORM_THICKNESS);
    platformTexture.destroy();
    
    // Create enemy texture - evil placeholder
    const enemyGfx = this.add.graphics();
    
    // Main enemy body (dark and menacing)
    enemyGfx.fillStyle(0x2a2a2a, 1.0); // Dark gray
    enemyGfx.fillRoundedRect(2, 2, 20, 28, 4);
    
    // Red glow for evil eyes
    enemyGfx.fillStyle(0xff0000, 0.8);
    enemyGfx.fillCircle(8, 12, 2);
    enemyGfx.fillCircle(16, 12, 2);
    
    // Dark aura
    enemyGfx.fillStyle(0x330033, 0.3);
    enemyGfx.fillCircle(12, 16, 16);
    
    enemyGfx.generateTexture('enemy', 24, 32);
    enemyGfx.destroy();
    
    // DEBUG: Verify texture was created
    if (this.textures.exists('platform')) {
      console.log('✅ Platform texture created successfully');
    } else {
      console.error('❌ Platform texture creation failed!');
    }
    
    if (this.textures.exists('enemy')) {
      console.log('✅ Enemy texture created successfully');
    } else {
      console.error('❌ Enemy texture creation failed!');
    }
    
    console.log('✅ Basic textures created');
  }

  /**
   * Initialize AI-related systems
   */
  initializeAiSystems() {
    // Create chat system first
    this.chatSystem = new ChatSystem(this);
    
    // Connect chat system to player for input blocking
    if (this.player) {
      this.player.setChatSystem(this.chatSystem);
      this.chatSystem.setPlayer(this.player);
      console.log('🎮 Player connected to chat system for input blocking and key capture control');
    }
    
    // Check if we have enemies that need AI system connection
    if (this.enemies && this.enemies.length > 0 && !this.aiSystem && this.player) {
      console.log('🤖 Found existing enemies, connecting AI system...');
      
      // Connect AI system to first enemy
      const firstEnemy = this.enemies[0];
      try {
        this.aiSystem = new AiSystem(this, firstEnemy, this.player);
        this.chatSystem.setAiSystem(this.aiSystem);
        console.log('🤖 AI system connected to existing enemy SUCCESSFULLY!');
      } catch (error) {
        console.error('🤖 Failed to connect AI system to existing enemy:', error);
      }
    }
    
    console.log('🤖 AI systems initialized (enemies:', this.enemies?.length || 0, ', AI system:', !!this.aiSystem, ')');
  }

  /**
   * Spawn an enemy at specified position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  spawnEnemy(x, y) {
    console.log(`🎯 SPAWN: Method called! Attempting to spawn enemy at (${x}, ${y})`);
    console.log(`🎯 SPAWN: This scene:`, !!this);
    
    try {
      // Create new enemy
      console.log(`🎯 SPAWN: Creating Enemy...`);
      const enemy = new Enemy(this, x, y);
      this.enemies.push(enemy);
      console.log(`🎯 SPAWN: Enemy created successfully, total enemies: ${this.enemies.length}`);
      
      // If this is the first enemy, initialize AI system
      console.log(`🎯 SPAWN: Checking AI system - current: ${!!this.aiSystem}, player: ${!!this.player}, chatSystem: ${!!this.chatSystem}`);
      
      if (!this.aiSystem && this.player) {
        console.log(`🎯 SPAWN: Creating AI system...`);
        try {
          this.aiSystem = new AiSystem(this, enemy, this.player);
          console.log(`🎯 SPAWN: AI system created successfully`);
          
          if (this.chatSystem) {
            this.chatSystem.setAiSystem(this.aiSystem);
            console.log('🤖 AI system connected to chat system SUCCESSFULLY!');
          } else {
            console.error('🤖 No chat system found to connect!');
          }
        } catch (aiError) {
          console.error('🤖 Failed to create AI system:', aiError);
        }
      } else {
        console.log(`🎯 SPAWN: AI system already exists or no player found`);
      }
      
      console.log(`👹 Enemy spawned at (${x}, ${y}). Total enemies: ${this.enemies.length}`);
      
    } catch (error) {
      console.error('🎯 SPAWN: ERROR in spawnEnemy method:', error);
    }
  }

  /**
   * Create and initialize the player character
   */
  createPlayer() {
    // Create player at center of starting platform
    const startX = CONFIG.GAME.WIDTH / 2;
    const startY = CONFIG.GAME.HEIGHT - 150; // Above starting platform
    
    this.player = new Player(this, startX, startY);
    
    // Set player as camera target
    this.cameraTarget = this.player;
    
    // Setup physics collisions between player and platform GROUP
    // The platform group is now created by the PlatformGenerator
    if (this.platformGroup) {
      this.physics.add.collider(this.player, this.platformGroup);
      console.log('✅ Player collision set up with platform group');
    } else {
      console.warn('⚠️ Platform group not found - collision will be set up when generator creates it');
      
      // Set up collision after a short delay to ensure generator has run
      this.time.delayedCall(200, () => {
        if (this.platformGroup) {
          this.physics.add.collider(this.player, this.platformGroup);
          console.log('✅ Player collision set up with platform group (delayed)');
        }
      });
    }
    
    console.log('🦸 Player character created and ready for adventure!');
  }

  /**
   * Setup Phaser's Light2D pipeline for dynamic lighting
   */
  setupLightingPipeline() {
    console.log('💡 Initializing Light2D pipeline...');
    
    // Enable lights manager
    this.lights.enable();
    
    // Set ambient lighting - correct Phaser 3 API
    this.lights.setAmbientColor(CONFIG.LIGHTING.AMBIENT_COLOR);
    this.lights.ambientIntensity = CONFIG.LIGHTING.AMBIENT_INTENSITY;
    
    // Create light manager for tracking and optimization
    this.lightManager = {
      activeLights: [],
      culledLights: [],
      
      addLight: (light) => {
        this.lightManager.activeLights.push(light);
        return light;
      },
      
      removeLight: (light) => {
        const index = this.lightManager.activeLights.indexOf(light);
        if (index !== -1) {
          this.lightManager.activeLights.splice(index, 1);
        }
        this.lights.removeLight(light);
      },
      
      updateLightCulling: (cameraY) => {
        // Cull lights that are too far from camera for performance
        const cullDistance = CONFIG.PERFORMANCE.LIGHT_CULLING_DISTANCE;
        
        this.lightManager.activeLights.forEach(light => {
          const distance = Math.abs(light.y - cameraY);
          light.visible = distance < cullDistance;
        });
      }
    };
    
    console.log('✅ Light2D pipeline initialized');
  }

  /**
   * Setup post-processing shader pipeline
   */
  setupPostProcessingPipeline() {
    console.log('🎨 Setting up post-processing pipeline...');
    
    try {
      // Create shader programs
      this.createShaderPrograms();
      
      // Initialize shader uniforms
      this.initializeShaderUniforms();
      
      console.log('✅ Post-processing pipeline ready');
      
    } catch (error) {
      console.warn('⚠️ Post-processing setup failed, falling back to basic rendering:', error);
      this.postProcessingPipeline = null;
    }
  }

  /**
   * Create and compile shader programs
   */
  createShaderPrograms() {
    const renderer = this.sys.game.renderer;
    
    if (renderer.type !== Phaser.WEBGL) {
      throw new Error('WebGL required for shaders');
    }
    
    // Note: In Phase 1, we're setting up the infrastructure
    // The actual shader compilation will be implemented when Phaser's
    // shader API is fully set up. For now, we create the structure.
    
    this.shaderPrograms = {
      bloom: {
        source: bloomShader,
        uniforms: ['uTime', 'uResolution', 'uBloomStrength', 'uBloomRadius', 'uBloomThreshold']
      },
      vignette: {
        source: vignetteShader,
        uniforms: ['uTime', 'uResolution', 'uVignetteStrength', 'uVignetteSize']
      },
      distortion: {
        source: distortionShader,
        uniforms: ['uTime', 'uResolution', 'uDistortionStrength', 'uDistortionCenter', 'uDistortionRadius']
      }
    };
  }

  /**
   * Initialize shader uniform values
   */
  initializeShaderUniforms() {
    this.shaderUniforms = {
      bloom: {
        uTime: 0,
        uResolution: [CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT],
        uBloomStrength: CONFIG.POST_PROCESSING.BLOOM_STRENGTH,
        uBloomRadius: CONFIG.POST_PROCESSING.BLOOM_RADIUS,
        uBloomThreshold: CONFIG.POST_PROCESSING.BLOOM_THRESHOLD
      },
      vignette: {
        uTime: 0,
        uResolution: [CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT],
        uVignetteStrength: CONFIG.POST_PROCESSING.VIGNETTE_STRENGTH,
        uVignetteSize: CONFIG.POST_PROCESSING.VIGNETTE_SIZE
      },
      distortion: {
        uTime: 0,
        uResolution: [CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT],
        uDistortionStrength: 0,
        uDistortionCenter: [0.5, 0.5],
        uDistortionRadius: 0.3
      }
    };
  }

  // Note: Background creation is now handled by BackgroundSystem
  // The old createBackground() and createBackgroundArchitecture() methods
  // have been replaced with the new infinite, progressive background system

  /**
   * Create ambient particle system for atmosphere - DISABLED FOR PHASE 1
   */
  createAmbientParticles() {
    console.log('✨ Ambient particles disabled for Phase 1 stability...');
    
    // PHASE 1: COMPLETELY DISABLE PARTICLES TO PREVENT ANY MOVEMENT
    this.ambientParticles = null;
    
    // Particles will be re-enabled in Phase 2 when stability is confirmed
  }

  /**
   * Initialize core game systems
   */
  initializeCoreSystems() {
    console.log('⚡ Initializing core game systems...');
    
    // Initialize scoring system first
    this.scoringSystem = new ScoringSystem(this);
    
    // Initialize coin system
    this.coinSystem = new CoinSystem(this, this.scoringSystem);
    
    // Initialize void system
    this.voidSystem = new VoidSystem(this);
    
    // Initialize platform generator with coin system reference
    this.platformGenerator = new PlatformGenerator(this, this.voidSystem, this.coinSystem);
    
    // Initialize background system
    this.backgroundSystem = new BackgroundSystem(this);
    
    console.log('✅ Core systems initialized');
  }

  /**
   * Setup camera behavior and constraints
   */
  setupCamera() {
    console.log('📹 Configuring camera system...');
    
    // Set world bounds for camera
    this.cameras.main.setBounds(
      this.worldBounds.left,
      this.worldBounds.top,
      this.worldBounds.right - this.worldBounds.left,
      this.worldBounds.bottom - this.worldBounds.top
    );
    
    // Set initial camera position
    this.cameras.main.centerOn(this.cameraTarget.x, this.cameraTarget.y);
    
    // Camera will smoothly follow the target (player in Phase 2)
    this.cameraFollowTarget = null; // Will be set to player in Phase 2
  }

  /**
   * Setup world physics bounds
   */
  setupWorldBounds() {
    // Set physics world bounds
    this.physics.world.setBounds(
      this.worldBounds.left,
      this.worldBounds.top,
      this.worldBounds.right - this.worldBounds.left,
      this.worldBounds.bottom - this.worldBounds.top
    );
  }

  /**
   * Setup debug systems for development
   */
  setupDebugSystems() {
    // Enable debug mode with F1 key
    this.input.keyboard.on('keydown-F1', () => {
      this.debugMode = !this.debugMode;
      console.log(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
      
      if (this.debugMode && !this.debugText) {
        this.createDebugDisplay();
      } else if (!this.debugMode && this.debugText) {
        this.debugText.destroy();
        this.debugText = null;
      }
    });
  }

  /**
   * Create debug information display
   */
  createDebugDisplay() {
    this.debugText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fill: '#64ffda',
      backgroundColor: 'rgba(26, 26, 46, 0.8)',
      padding: { x: 5, y: 5 }
    });
    this.debugText.setDepth(1000);
    this.debugText.setScrollFactor(0); // Fixed to camera
  }

  /**
   * Create on-screen score display
   */
  createScoreDisplay() {
    if (this.scoringSystem) {
      this.scoringSystem.createScoreDisplay();
      
      // Set starting position for height tracking
      const startingY = this.cameras.main.height - 100;
      this.scoringSystem.setStartingPosition(startingY);
    }
  }

  /**
   * Main update loop - orchestrates all systems
   * @param {number} time - Total elapsed time
   * @param {number} delta - Time since last frame
   */
  update(time, delta) {
    const deltaSeconds = delta / 1000;
    
    // Update shader time uniforms
    this.updateShaderUniforms(time);
    
    // Update camera movement
    this.updateCamera(deltaSeconds);
    
    // Update core systems
    this.updateCoreSystems(deltaSeconds);
    
    // Update visual effects
    this.updateVisualEffects(deltaSeconds);
    
    // Update performance metrics
    this.updatePerformanceMetrics();
    
    // Update debug display
    if (this.debugMode && this.debugText) {
      this.updateDebugDisplay();
    }
  }

  /**
   * Update shader uniform values
   * @param {number} time - Current time
   */
  updateShaderUniforms(time) {
    // Update time uniforms for all shaders
    Object.keys(this.shaderUniforms).forEach(shaderName => {
      this.shaderUniforms[shaderName].uTime = time * 0.001; // Convert to seconds
    });
    
    // Update distortion strength from void system
    if (this.voidSystem) {
      this.shaderUniforms.distortion.uDistortionStrength = this.voidSystem.getDistortionStrength();
    }
  }

  /**
   * Update camera movement and following
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updateCamera(deltaTime) {
    if (!this.cameraTarget) return;
    
    // Smooth camera following with configurable lerp speed
    const lerpSpeed = CONFIG.CAMERA.FOLLOW_SPEED * deltaTime;
    
    // Calculate target camera position with offset (keep player slightly below center)
    const targetX = this.cameraTarget.x - CONFIG.GAME.WIDTH / 2;
    const targetY = this.cameraTarget.y - CONFIG.GAME.HEIGHT / 2 + CONFIG.CAMERA.OFFSET_Y;
    
    // Current camera position
    const currentX = this.cameras.main.scrollX;
    const currentY = this.cameras.main.scrollY;
    
    // Smooth interpolation to target
    const newX = Phaser.Math.Linear(currentX, targetX, lerpSpeed);
    const newY = Phaser.Math.Linear(currentY, targetY, lerpSpeed);
    
    // Apply camera bounds (prevent going too far down, allow infinite up)
    const clampedY = Math.max(newY, this.worldBounds.top);
    
    // Set camera position
    this.cameras.main.setScroll(newX, clampedY);
  }

  /**
   * Update all core game systems
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updateCoreSystems(deltaTime) {
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
      
      // Update centralized scoring system
      if (this.scoringSystem) {
        this.scoringSystem.updateHeightScore(this.player.y);
      }
      
      // Update coin system
      if (this.coinSystem) {
        this.coinSystem.update(this.player);
      }
    }
    
    // Void system updates still disabled for stability
    // TO RE-ENABLE VOID: Uncomment the lines below when movement feels good
    // if (this.voidSystem) {
    //   this.voidSystem.update(deltaTime, this.cameraTarget.y);
    // }
    
    // Platform generator updates - RE-ENABLE FOR PHASE 2
    if (this.platformGenerator) {
      this.platformGenerator.update(this.cameras.main.scrollY);
    }
    
    // Background system updates - infinite progressive backgrounds
    if (this.backgroundSystem) {
      this.backgroundSystem.update(this.cameras.main.scrollY);
    }
    
    // Update AI and enemy systems
    this.updateAiSystems(deltaTime);
    
    // Light culling disabled for now
    // if (this.lightManager) {
    //   this.lightManager.updateLightCulling(this.cameras.main.scrollY);
    // }
  }

  /**
   * Update AI and enemy systems
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updateAiSystems(deltaTime) {
    // Update all enemies
    this.enemies.forEach((enemy, index) => {
      if (enemy && enemy.enemyState && enemy.enemyState.isActive) {
        enemy.update(deltaTime);
      } else {
        // Remove inactive enemies
        this.enemies.splice(index, 1);
      }
    });
    
    // Update AI system
    if (this.aiSystem) {
      this.aiSystem.update(deltaTime);
    }
    
    // Update chat system
    if (this.chatSystem) {
      this.chatSystem.update();
    }
  }

  /**
   * Update height tracking and scoring system
   */
  updateHeightTracking() {
    if (!this.player || !this.scoringSystem) return;
    
    // Update height-based scoring through centralized system
    this.scoringSystem.updateHeightScore(this.player.y);
  }

  /**
   * Update visual effects and atmospheric elements
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updateVisualEffects(deltaTime) {
    // Update ambient particles
    if (this.ambientParticles) {
      this.ambientParticles.update();
    }
    
    // Update visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.update(deltaTime);
    }
    
    // Update background parallax
    this.updateBackgroundParallax();
  }

  /**
   * Update background parallax effect
   */
  updateBackgroundParallax() {
    const cameraY = this.cameras.main.scrollY;
    
    this.backgroundLayers.forEach((layer, index) => {
      if (layer && layer.setY) {
        // Different layers move at different speeds for depth effect
        const parallaxSpeed = 0.1 + (index * 0.05);
        layer.setY(cameraY * parallaxSpeed);
      }
    });
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    if (this.platformGenerator) {
      const stats = this.platformGenerator.getStats();
      this.performanceMetrics.platformCount = stats.totalPlatforms;
    }
    
    this.performanceMetrics.lightCount = this.lightManager ? this.lightManager.activeLights.length : 0;
    
    // Update particle count
    this.performanceMetrics.particleCount = this.ambientParticles ? 
      this.ambientParticles.getAliveParticleCount() : 0;
  }

  /**
   * Update debug information display
   */
  updateDebugDisplay() {
    const fps = Math.round(this.game.loop.actualFps);
    const voidY = this.voidSystem ? Math.round(this.voidSystem.getVoidY()) : 'N/A';
    const voidSpeed = this.voidSystem ? Math.round(this.voidSystem.getVoidSpeed()) : 'N/A';
    
    // Get player state for debugging
    let playerInfo = '';
    if (this.player) {
      const state = this.player.getPlayerState();
      playerInfo = `Player: (${state.position.x}, ${state.position.y}) Vel: (${state.velocity.x}, ${state.velocity.y}) ${state.grounded ? 'GROUNDED' : 'AIRBORNE'}`;
    }
    
    // Get scoring stats from centralized system
    const scoringStats = this.scoringSystem ? this.scoringSystem.getStats() : null;
    
    // Get background system stats
    const backgroundStats = this.backgroundSystem ? this.backgroundSystem.getStats() : null;
    
    const debugInfo = [
      `FPS: ${fps}`,
      `Camera: (${Math.round(this.cameras.main.scrollX)}, ${Math.round(this.cameras.main.scrollY)})`,
      playerInfo,
      ``,
      `📏 HEIGHT: ${scoringStats ? Math.round(scoringStats.currentHeight) : 0}px`,
      `🏆 MAX HEIGHT: ${scoringStats ? Math.round(scoringStats.maxHeight) : 0}px`,
      `🪙 COINS: ${scoringStats ? scoringStats.coinsCollected : 0}`,
      `⭐ SCORE: ${scoringStats ? scoringStats.totalScore : 0}`,
      ``,
      `Void Y: ${voidY}`,
      `Void Speed: ${voidSpeed}`,
      `Platforms: ${this.performanceMetrics.platformCount}`,
      `Lights: ${this.performanceMetrics.lightCount}`,
      `Particles: ${this.performanceMetrics.particleCount}`,
      `🎨 Background: ${backgroundStats ? backgroundStats.currentTheme : 'N/A'}`,
      `📦 BG Chunks: ${backgroundStats ? backgroundStats.chunksActive : 0}`,
      ``,
      `Controls:`,
      `WASD/Arrow Keys - Move`,
      `Space/W/Up - Jump`,
      `F1 - Toggle Debug`
    ];
    
    this.debugText.setText(debugInfo.join('\n'));
  }

  /**
   * Log system status on initialization
   */
  logSystemStatus() {
    console.log('📊 System Status:');
    console.log(`  💡 Lighting: ${this.lights.active ? 'Active' : 'Inactive'}`);
    console.log(`  🎨 Post-processing: ${this.postProcessingPipeline ? 'Active' : 'Fallback'}`);
    console.log(`  🌊 Void System: ${this.voidSystem ? 'Active' : 'Inactive'}`);
    console.log(`  🏗️ Platform Generator: ${this.platformGenerator ? 'Active' : 'Inactive'}`);
    console.log(`  ✨ Particles: ${this.ambientParticles ? 'Active' : 'Inactive'}`);
  }

  /**
   * Clean up scene resources
   */
  destroy() {
    console.log('🧹 Cleaning up GameScene resources...');
    
    // Destroy systems
    if (this.voidSystem) {
      this.voidSystem.destroy();
    }
    
    if (this.platformGenerator) {
      this.platformGenerator.destroy();
    }
    
    if (this.backgroundSystem) {
      this.backgroundSystem.destroy();
    }
    
    // Clean up visual elements
    this.backgroundLayers.forEach(layer => {
      if (layer && layer.destroy) {
        layer.destroy();
      }
    });
    
    if (this.ambientParticles) {
      this.ambientParticles.destroy();
    }
    
    // Destroy visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.destroy();
    }
    
    // Destroy AI and enemy systems
    if (this.aiSystem) {
      this.aiSystem.destroy();
    }
    if (this.chatSystem) {
      this.chatSystem.destroy();
    }
    this.enemies.forEach(enemy => {
      if (enemy) enemy.destroy();
    });
    this.enemies = [];
    
    console.log('✅ GameScene cleanup complete');
    
    super.destroy();
  }
} 