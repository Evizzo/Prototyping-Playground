import { CONFIG } from '../config/gameConfig.js';

/**
 * BackgroundSystem - Infinite Progressive Background Generation
 * 
 * Creates an infinitely scrolling background that evolves as the player climbs:
 * - Multi-layered parallax background elements
 * - Progressive theme changes based on height
 * - Procedural generation similar to platforms
 * - Dynamic lighting effects and atmosphere
 * - Performance-optimized with chunk-based generation
 * 
 * Themes progression:
 * 1. Ancient Ruins (0-2000px) - Stone pillars, mystical runes
 * 2. Crystal Caverns (2000-4000px) - Glowing crystals, ethereal light
 * 3. Sky Temples (4000-6000px) - Floating architecture, cloud wisps  
 * 4. Celestial Realm (6000+px) - Stars, nebulae, cosmic energy
 * 
 * @author Me
 * @version 1.0.0
 */
export class BackgroundSystem {
  /**
   * Initialize the background system
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Background chunk management
    this.backgroundChunks = [];
    this.nextChunkY = 0;
    this.lastGeneratedY = this.scene.cameras.main.height;
    this.chunksGenerated = 0;
    
    // Theme progression tracking
    this.currentTheme = null;
    this.previousTheme = null;
    this.transitionProgress = 0;
    
    // Parallax layers - multiple depths for rich visuals
    this.parallaxLayers = {
      far: [],      // Distant elements (0.1x movement)
      mid: [],      // Medium distance (0.3x movement)
      near: [],     // Close elements (0.6x movement)
      particles: [] // Atmospheric particles (0.8x movement)
    };
    
    // Performance optimization
    this.maxVisibleChunks = CONFIG.BACKGROUND.MAX_VISIBLE_CHUNKS;
    this.chunkHeight = CONFIG.BACKGROUND.CHUNK_HEIGHT;
    this.generationDistance = CONFIG.BACKGROUND.GENERATION_DISTANCE;
    
    // Visual effects
    this.atmosphericLights = [];
    this.backgroundParticles = [];
    
    // Performance tracking
    this.stats = {
      chunksActive: 0,
      elementsActive: 0,
      currentHeight: 0,
      currentTheme: 'ancient_ruins'
    };
    
    console.log('🎨 Background system initialized');
    this.initializeBackgroundSystem();
  }

  /**
   * Initialize the background system and create initial chunks
   */
  initializeBackgroundSystem() {
    // Create seamless base cave background first - covers entire screen
    this.createBaseCaveBackground();
    
    // Set initial generation position
    this.nextChunkY = this.scene.cameras.main.height;
    
    // Generate fewer initial background chunks for better loading performance
    for (let i = 0; i < 3; i++) { // Reduced from 6 to 3
      this.generateBackgroundChunk();
    }
    
    // Generate some chunks above the starting position to prevent gaps
    this.nextChunkY = this.scene.cameras.main.height + this.chunkHeight;
    for (let i = 0; i < 1; i++) { // Reduced from 2 to 1
      this.generateBackgroundChunk();
    }
    
    console.log('✅ Optimized initial background chunks generated');
  }

  /**
   * Create a seamless base cave background that fills the entire screen
   * This ensures there's never any black background visible
   */
  createBaseCaveBackground() {
    const baseBg = this.scene.add.graphics();
    baseBg.setDepth(-99); // Behind everything else
    baseBg.setScrollFactor(0.1); // Very slow parallax so it always covers screen
    
    // Create a huge background that covers way more than the screen
    const bgWidth = CONFIG.GAME.WIDTH * 2; // Extra width for parallax
    const bgHeight = CONFIG.GAME.HEIGHT * 10; // Cover 10 screen heights
    const bgX = -CONFIG.GAME.WIDTH / 2; // Center it
    const bgY = -bgHeight / 2;
    
    // Base cave color - ensure full opacity
    baseBg.fillStyle(0x2a2a3a, 1.0);
    baseBg.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    // Add FEWER rocks for better performance
    for (let i = 0; i < 50; i++) { // Reduced from 200 to 50
      const rockX = bgX + Math.random() * bgWidth;
      const rockY = bgY + Math.random() * bgHeight;
      const rockSize = Math.random() * 15 + 8; // Slightly smaller
      
      baseBg.fillStyle(0x3a3a4a, 0.6);
      baseBg.fillCircle(rockX, rockY, rockSize);
    }
    
    // Add FEWER horizontal stone layers
    for (let i = 0; i < 20; i++) { // Reduced from 60 to 20
      const layerY = bgY + (bgHeight * (i / 20));
      baseBg.fillStyle(0x1a1a2a, 0.4);
      baseBg.fillRect(bgX, layerY, bgWidth, 2);
    }
    
    // Store as permanent background element
    this.baseCaveBackground = baseBg;
    
    console.log('✅ Optimized base cave background created');
  }

  /**
   * Generate a background chunk based on current height and theme
   */
  generateBackgroundChunk() {
    const chunkStartY = this.nextChunkY;
    const chunkEndY = chunkStartY - this.chunkHeight;
    
    // Determine theme based on height
    const currentHeight = Math.abs(chunkStartY);
    const theme = this.determineThemeByHeight(currentHeight);
    
    // Create background chunk object with overlap to prevent gaps
    const chunk = {
      id: `bg_chunk_${this.chunksGenerated}`,
      startY: chunkStartY + 50, // Overlap with previous chunk
      endY: chunkEndY - 50,     // Overlap with next chunk
      height: currentHeight,
      theme: theme,
      elements: {
        far: [],
        mid: [],
        near: [],
        particles: []
      },
      lights: [],
      created: this.scene.time.now
    };
    
    // Generate background elements based on theme
    this.generateThemeElements(chunk);
    
    // Add chunk to management
    this.backgroundChunks.push(chunk);
    
    // Update generation tracking with overlap
    this.nextChunkY = chunkEndY + 25; // Small overlap for seamless generation
    this.chunksGenerated++;
    this.lastGeneratedY = chunkEndY;
    
    console.log(`🏞️ Background chunk generated: ${theme} theme at height ${Math.round(currentHeight)}`);
  }

  /**
   * Determine background theme based on height
   * @param {number} height - Current height in pixels
   * @returns {string} Theme identifier
   */
  determineThemeByHeight(height) {
    if (height < 2000) {
      return 'ancient_ruins';
    } else if (height < 4000) {
      return 'crystal_caverns'; 
    } else if (height < 6000) {
      return 'sky_temples';
    } else {
      return 'celestial_realm';
    }
  }

  /**
   * Generate theme-specific background elements
   * @param {object} chunk - Background chunk to populate
   */
  generateThemeElements(chunk) {
    switch (chunk.theme) {
      case 'ancient_ruins':
        this.generateAncientRuinsTheme(chunk);
        break;
      case 'crystal_caverns':
        this.generateCrystalCavernsTheme(chunk);
        break;
      case 'sky_temples':
        this.generateSkyTemplesTheme(chunk);
        break;
      case 'celestial_realm':
        this.generateCelestialRealmTheme(chunk);
        break;
    }
  }

  /**
   * Generate Ancient Ruins theme elements
   * @param {object} chunk - Background chunk
   */
  generateAncientRuinsTheme(chunk) {
    const centerY = chunk.startY - (this.chunkHeight / 2);
    
    // Create detailed cave walls as background base
    this.createDetailedCaveWalls(chunk, centerY, 'ancient_ruins');
    
    // Far layer - Distant mountains and structures
    for (let i = 0; i < 3; i++) {
      const x = (CONFIG.GAME.WIDTH / 4) * (i + 1);
      const mountain = this.createMountainSilhouette(x, centerY, 'far');
      chunk.elements.far.push(mountain);
    }
    
    // Mid layer - Ancient pillars and ruins
    for (let i = 0; i < 5; i++) {
      const x = (CONFIG.GAME.WIDTH / 6) * (i + 1);
      const pillar = this.createAncientPillar(x, centerY, 'mid');
      chunk.elements.mid.push(pillar);
    }
    
    // Near layer - Foreground ruins and vegetation
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const ruin = this.createForegroundRuin(x, centerY, 'near');
      chunk.elements.near.push(ruin);
    }
    
    // Atmospheric effects
    this.generateThemeParticles(chunk, centerY, 'ancient_ruins');
  }

  /**
   * Generate Crystal Caverns theme elements
   * @param {object} chunk - Background chunk
   */
  generateCrystalCavernsTheme(chunk) {
    const centerY = chunk.startY - (this.chunkHeight / 2);
    
    // Create detailed cave walls with crystal formations
    this.createDetailedCaveWalls(chunk, centerY, 'crystal_caverns');
    
    // Far layer - Cave walls with crystal veins
    const caveWall = this.createCaveWall(centerY, 'far');
    chunk.elements.far.push(caveWall);
    
    // Mid layer - Large crystal formations
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const crystal = this.createCrystalFormation(x, centerY, 'mid');
      chunk.elements.mid.push(crystal);
      
      // Add crystal lighting
      const light = this.createCrystalLight(x, centerY);
      if (light) chunk.lights.push(light);
    }
    
    // Near layer - Smaller crystals and glowing details
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const smallCrystal = this.createSmallCrystal(x, centerY, 'near');
      chunk.elements.near.push(smallCrystal);
    }
    
    // Atmospheric effects
    this.generateThemeParticles(chunk, centerY, 'crystal_caverns');
  }

  /**
   * Generate Sky Temples theme elements
   * @param {object} chunk - Background chunk
   */
  generateSkyTemplesTheme(chunk) {
    const centerY = chunk.startY - (this.chunkHeight / 2);
    
    // Far layer - Floating temple silhouettes
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const temple = this.createFloatingTemple(x, centerY, 'far');
      chunk.elements.far.push(temple);
    }
    
    // Mid layer - Cloud formations and floating architecture
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const cloud = this.createCloudFormation(x, centerY, 'mid');
      chunk.elements.mid.push(cloud);
    }
    
    // Near layer - Mystical artifacts and wind effects
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const artifact = this.createMysticalArtifact(x, centerY, 'near');
      chunk.elements.near.push(artifact);
    }
    
    // Atmospheric effects
    this.generateThemeParticles(chunk, centerY, 'sky_temples');
  }

  /**
   * Generate Celestial Realm theme elements
   * @param {object} chunk - Background chunk
   */
  generateCelestialRealmTheme(chunk) {
    const centerY = chunk.startY - (this.chunkHeight / 2);
    
    // Far layer - Star fields and nebulae
    const starField = this.createStarField(centerY, 'far');
    chunk.elements.far.push(starField);
    
    // Mid layer - Cosmic energy streams and constellations
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const energyStream = this.createEnergyStream(x, centerY, 'mid');
      chunk.elements.mid.push(energyStream);
    }
    
    // Near layer - Celestial orbs and cosmic phenomena
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const orb = this.createCelestialOrb(x, centerY, 'near');
      chunk.elements.near.push(orb);
      
      // Add orb lighting
      const light = this.createOrbLight(x, centerY);
      if (light) chunk.lights.push(light);
    }
    
    // Atmospheric effects
    this.generateThemeParticles(chunk, centerY, 'celestial_realm');
  }

  // Element creation methods for each theme...
  
  /**
   * Create mountain silhouette element
   */
  createMountainSilhouette(x, y, layer) {
    const mountain = this.scene.add.graphics();
    mountain.setDepth(this.getLayerDepth(layer));
    
    // Create mountain shape
    mountain.fillStyle(0x1a1a2e, 0.6);
    mountain.beginPath();
    mountain.moveTo(x - 150, y + 200);
    mountain.lineTo(x - 50, y - 100);
    mountain.lineTo(x + 50, y - 80);
    mountain.lineTo(x + 150, y + 200);
    mountain.closePath();
    mountain.fillPath();
    
    this.addParallaxLayer(mountain, layer);
    return mountain;
  }

  /**
   * Create ancient pillar element
   */
  createAncientPillar(x, y, layer) {
    const pillar = this.scene.add.graphics();
    pillar.setDepth(this.getLayerDepth(layer));
    
    const width = 20 + Math.random() * 15;
    const height = 200 + Math.random() * 200;
    
    // Main pillar body
    pillar.fillStyle(0x2a2a4a, 0.7);
    pillar.fillRect(x - width/2, y - height/2, width, height);
    
    // Mystical runes
    pillar.fillStyle(0x64ffda, 0.3);
    for (let i = 0; i < 3; i++) {
      const runeY = y - height/2 + (i * height/4) + 50;
      pillar.fillCircle(x, runeY, 4);
    }
    
    this.addParallaxLayer(pillar, layer);
    return pillar;
  }

  /**
   * Create crystal formation element
   */
  createCrystalFormation(x, y, layer) {
    const crystal = this.scene.add.graphics();
    crystal.setDepth(this.getLayerDepth(layer));
    
    const size = 40 + Math.random() * 60;
    const color = Phaser.Utils.Array.GetRandom([0x7c4dff, 0x64ffda, 0x00e676]);
    
    // Crystal body
    crystal.fillStyle(color, 0.8);
    crystal.fillTriangle(
      x - size/2, y + size/2,
      x + size/2, y + size/2,
      x, y - size/2
    );
    
    // Inner glow
    crystal.fillStyle(0xffffff, 0.4);
    crystal.fillTriangle(
      x - size/4, y + size/4,
      x + size/4, y + size/4,
      x, y - size/4
    );
    
    this.addParallaxLayer(crystal, layer);
    return crystal;
  }

  /**
   * Add element to appropriate parallax layer
   */
  addParallaxLayer(element, layerName) {
    if (!this.parallaxLayers[layerName]) {
      this.parallaxLayers[layerName] = [];
    }
    this.parallaxLayers[layerName].push(element);
  }

  /**
   * Get depth value for layer
   */
  getLayerDepth(layer) {
    switch (layer) {
      case 'far': return -95;
      case 'mid': return -90;
      case 'near': return -85;
      case 'particles': return -80;
      default: return -90;
    }
  }

  /**
   * Create theme-specific particle effects
   */
  generateThemeParticles(chunk, centerY, theme) {
    // Skip particles entirely if too many chunks active for performance
    if (this.backgroundChunks.length > 4) {
      return;
    }

    const particleConfig = CONFIG.BACKGROUND.PARTICLES[theme + '_dust'] || 
                          CONFIG.BACKGROUND.PARTICLES.ancient_dust;
    
    // Create fewer particles for better performance
    const particleCount = Math.min(3, Math.floor(particleConfig.frequency / 30)); // Much fewer particles
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.sprite(
        Math.random() * CONFIG.GAME.WIDTH,
        centerY + (Math.random() - 0.5) * this.chunkHeight,
        'particle'
      );
      
      particle.setDepth(-95);
      particle.setScale(Phaser.Math.FloatBetween(0.1, 0.3)); // Smaller particles
      particle.setTint(Phaser.Utils.Array.GetRandom(particleConfig.colors));
      particle.setAlpha(0.4);
      
      // Simple upward motion
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 100,
        alpha: 0,
        duration: 4000, // Shorter duration
        onComplete: () => particle.destroy()
      });
      
      chunk.elements.particles.push(particle);
      this.addParallaxLayer(particle, 'particles');
    }
  }

  /**
   * Create crystal lighting effect
   */
  createCrystalLight(x, y) {
    if (!this.scene.lights) return null;
    
    const color = Phaser.Utils.Array.GetRandom([0x7c4dff, 0x64ffda, 0x00e676]);
    const light = this.scene.lights.addLight(
      x, y, 
      CONFIG.BACKGROUND.LIGHTING.atmospheric_radius, 
      color, 
      CONFIG.BACKGROUND.LIGHTING.crystal_intensity
    );
    
    this.atmosphericLights.push(light);
    return light;
  }

  /**
   * Create celestial orb lighting
   */
  createOrbLight(x, y) {
    if (!this.scene.lights) return null;
    
    const color = Phaser.Utils.Array.GetRandom([0x9c27b0, 0xe91e63, 0xff6d00]);
    const light = this.scene.lights.addLight(
      x, y, 
      CONFIG.BACKGROUND.LIGHTING.orb_radius, 
      color, 
      CONFIG.BACKGROUND.LIGHTING.orb_intensity
    );
    
    this.atmosphericLights.push(light);
    return light;
  }

  /**
   * Update background system - called from GameScene
   */
  update(cameraY) {
    // Reduce update frequency for performance - only update every 10 frames
    if (this.scene.time.now % 167 > 16) { // ~6 times per second instead of 60
      return;
    }

    // Check for new chunk generation
    if (cameraY < this.lastGeneratedY + this.generationDistance) {
      this.generateBackgroundChunk();
    }
    
    // Clean up distant chunks aggressively
    this.cleanupDistantChunks();
    
    // Skip parallax updates for performance - they're handled automatically
    // this.updateParallaxLayers(cameraY);
    
    // Skip lighting updates for performance
    // this.updateLighting();
  }

  /**
   * Check if new background chunks need to be generated
   */
  checkBackgroundGeneration(cameraY) {
    if (cameraY < this.lastGeneratedY + this.generationDistance) {
      this.generateBackgroundChunk();
    }
  }

  /**
   * Update parallax scrolling for all layers
   */
  updateParallaxLayers(cameraY) {
    const parallaxSpeeds = CONFIG.BACKGROUND.PARALLAX_SPEEDS;
    
    Object.keys(this.parallaxLayers).forEach(layerName => {
      const speed = parallaxSpeeds[layerName] || 0.5;
      this.parallaxLayers[layerName].forEach(element => {
        if (element && element.y !== undefined) {
          // Simple parallax movement
          const offset = cameraY * speed * 0.01;
          element.y = element.y + offset * 0.1;
        }
      });
    });
  }

  /**
   * Clean up chunks that are too far below camera
   */
  cleanupDistantChunks() {
    const maxDistance = 1500; // Reduced distance for more aggressive cleanup
    const cameraY = this.scene.cameras.main.scrollY;
    
    this.backgroundChunks = this.backgroundChunks.filter(chunk => {
      const distance = Math.abs(chunk.startY - cameraY);
      
      if (distance > maxDistance) {
        // Destroy all chunk elements
        Object.values(chunk.elements).forEach(elementArray => {
          elementArray.forEach(element => {
            if (element && element.destroy) {
              element.destroy();
            }
          });
        });
        
        // Remove lights
        chunk.lights.forEach(light => {
          if (light && this.scene.lights) {
            this.scene.lights.removeLight(light);
          }
        });
        
        return false;
      }
      
      return true;
    });
  }

  /**
   * Update theme transitions and effects
   */
  updateThemeTransitions(cameraY) {
    const currentHeight = Math.abs(cameraY);
    const newTheme = this.determineThemeByHeight(currentHeight);
    
    if (newTheme !== this.currentTheme) {
      this.previousTheme = this.currentTheme;
      this.currentTheme = newTheme;
      this.transitionProgress = 0;
      
      console.log(`🎨 Theme transition: ${this.previousTheme} -> ${this.currentTheme}`);
    }
  }

  /**
   * Update background system statistics
   */
  updateStats(cameraY) {
    this.stats.chunksActive = this.backgroundChunks.length;
    this.stats.elementsActive = Object.values(this.parallaxLayers)
      .reduce((total, layer) => total + layer.length, 0);
    this.stats.currentHeight = Math.abs(cameraY);
    this.stats.currentTheme = this.currentTheme || 'ancient_ruins';
  }

  /**
   * Get background system statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clean up background system
   */
  destroy() {
    // Destroy all chunks
    this.backgroundChunks.forEach(chunk => this.destroyChunk(chunk));
    
    // Clean up lights
    this.atmosphericLights.forEach(light => {
      if (light && this.scene.lights) {
        this.scene.lights.removeLight(light);
      }
    });
    
    // Clear arrays
    this.backgroundChunks = [];
    this.parallaxLayers = { far: [], mid: [], near: [], particles: [] };
    this.atmosphericLights = [];
    
    console.log('🗑️ Background system destroyed');
  }

  // Additional simplified element creation methods...
  
  createForegroundRuin(x, y, layer) {
    const ruin = this.scene.add.graphics();
    ruin.setDepth(this.getLayerDepth(layer));
    ruin.fillStyle(0x2a2a4a, 0.5);
    ruin.fillRect(x - 15, y - 30, 30, 60);
    this.addParallaxLayer(ruin, layer);
    return ruin;
  }

  createCaveWall(y, layer) {
    const wall = this.scene.add.graphics();
    wall.setDepth(this.getLayerDepth(layer));
    wall.fillStyle(0x1a1a2e, 0.8);
    wall.fillRect(0, y - this.chunkHeight/2, CONFIG.GAME.WIDTH, this.chunkHeight);
    this.addParallaxLayer(wall, layer);
    return wall;
  }

  createSmallCrystal(x, y, layer) {
    const crystal = this.scene.add.graphics();
    crystal.setDepth(this.getLayerDepth(layer));
    crystal.fillStyle(0x7c4dff, 0.6);
    crystal.fillCircle(x, y, 5 + Math.random() * 10);
    this.addParallaxLayer(crystal, layer);
    return crystal;
  }

  createFloatingTemple(x, y, layer) {
    const temple = this.scene.add.graphics();
    temple.setDepth(this.getLayerDepth(layer));
    temple.fillStyle(0x3a3a6a, 0.4);
    temple.fillRect(x - 40, y - 20, 80, 40);
    this.addParallaxLayer(temple, layer);
    return temple;
  }

  createCloudFormation(x, y, layer) {
    const cloud = this.scene.add.graphics();
    cloud.setDepth(this.getLayerDepth(layer));
    cloud.fillStyle(0xe3f2fd, 0.3);
    cloud.fillEllipse(x, y, 60 + Math.random() * 40, 30 + Math.random() * 20);
    this.addParallaxLayer(cloud, layer);
    return cloud;
  }

  createMysticalArtifact(x, y, layer) {
    const artifact = this.scene.add.graphics();
    artifact.setDepth(this.getLayerDepth(layer));
    artifact.fillStyle(0x64ffda, 0.7);
    artifact.fillCircle(x, y, 8);
    this.addParallaxLayer(artifact, layer);
    return artifact;
  }

  createStarField(y, layer) {
    const starField = this.scene.add.graphics();
    starField.setDepth(this.getLayerDepth(layer));
    
    // Random stars
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * CONFIG.GAME.WIDTH;
      const starY = y - this.chunkHeight/2 + Math.random() * this.chunkHeight;
      starField.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      starField.fillCircle(x, starY, 1 + Math.random() * 2);
    }
    
    this.addParallaxLayer(starField, layer);
    return starField;
  }

  createEnergyStream(x, y, layer) {
    const stream = this.scene.add.graphics();
    stream.setDepth(this.getLayerDepth(layer));
    stream.fillStyle(0x9c27b0, 0.6);
    stream.fillRect(x - 2, y - 100, 4, 200);
    this.addParallaxLayer(stream, layer);
    return stream;
  }

  createCelestialOrb(x, y, layer) {
    const orb = this.scene.add.graphics();
    orb.setDepth(this.getLayerDepth(layer));
    
    const size = 20 + Math.random() * 30;
    const color = Phaser.Utils.Array.GetRandom([0x9c27b0, 0xe91e63, 0xff6d00]);
    
    orb.fillStyle(color, 0.8);
    orb.fillCircle(x, y, size);
    orb.fillStyle(0xffffff, 0.4);
    orb.fillCircle(x, y, size * 0.6);
    
    this.addParallaxLayer(orb, layer);
    return orb;
  }

  /**
   * Create detailed cave walls that serve as the rocky background
   * OPTIMIZED VERSION for better performance
   * @param {object} chunk - Background chunk
   * @param {number} centerY - Center Y position of chunk
   * @param {string} theme - Current theme
   */
  createDetailedCaveWalls(chunk, centerY, theme) {
    // Create the main cave wall background
    const caveWall = this.scene.add.graphics();
    caveWall.setDepth(-98); // Behind everything else
    
    const wallHeight = this.chunkHeight + 100; // Reduced overlap for performance
    const wallY = centerY - wallHeight / 2;
    
    // Base cave wall color based on theme
    let baseColor, rockColor, accentColor;
    switch (theme) {
      case 'ancient_ruins':
        baseColor = 0x3a3a4a;
        rockColor = 0x4a4a5a;
        accentColor = 0x2d5a2d; // Moss color
        break;
      case 'crystal_caverns':
        baseColor = 0x4a4a6a;
        rockColor = 0x5a5a7a;
        accentColor = 0x7c4dff; // Crystal color
        break;
      case 'sky_temples':
        baseColor = 0x3a3a5a;
        rockColor = 0x4a4a6a;
        accentColor = 0x64ffda; // Sky color
        break;
      case 'celestial_realm':
        baseColor = 0x2a2a4a;
        rockColor = 0x3a3a5a;
        accentColor = 0x9c27b0; // Cosmic color
        break;
      default:
        baseColor = 0x3a3a4a;
        rockColor = 0x4a4a5a;
        accentColor = 0x2d5a2d;
    }
    
    // Main cave wall background - covers full width 
    caveWall.fillStyle(baseColor, 1.0); // Full opacity to prevent any black showing through
    caveWall.fillRect(0, wallY, CONFIG.GAME.WIDTH, wallHeight);
    
    // Add horizontal stone layers - REDUCED for performance
    for (let i = 0; i < 8; i++) { // Reduced from 20 to 8
      const layerY = wallY + (wallHeight * (i / 8));
      const layerThickness = Math.random() * 6 + 2;
      
      // Darker stone layer
      caveWall.fillStyle(baseColor - 0x101010, 0.7);
      caveWall.fillRect(0, layerY, CONFIG.GAME.WIDTH, layerThickness);
    }
    
    // Add rock formations - GREATLY REDUCED for performance
    for (let i = 0; i < 15; i++) { // Reduced from 50 to 15
      const rockX = Math.random() * CONFIG.GAME.WIDTH;
      const rockY = wallY + Math.random() * wallHeight;
      const rockWidth = Math.random() * 25 + 12;
      const rockHeight = Math.random() * 20 + 8;
      
      caveWall.fillStyle(rockColor, 0.8);
      caveWall.fillEllipse(rockX, rockY, rockWidth, rockHeight);
    }
    
    // Theme-specific details - REDUCED for performance
    if (theme === 'ancient_ruins') {
      // Add fewer moss patches
      for (let i = 0; i < 8; i++) { // Reduced from 25 to 8
        const mossX = Math.random() * CONFIG.GAME.WIDTH;
        const mossY = wallY + Math.random() * wallHeight;
        const mossSize = Math.random() * 12 + 6;
        
        caveWall.fillStyle(accentColor, 0.6);
        caveWall.fillEllipse(mossX, mossY, mossSize, mossSize * 0.6);
      }
      
    } else if (theme === 'crystal_caverns') {
      // Add fewer crystal formations
      for (let i = 0; i < 6; i++) { // Reduced from 20 to 6
        const crystalX = Math.random() * CONFIG.GAME.WIDTH;
        const crystalY = wallY + Math.random() * wallHeight;
        const crystalSize = Math.random() * 15 + 8;
        const crystalColor = Phaser.Utils.Array.GetRandom([0x7c4dff, 0x64ffda, 0x00e676]);
        
        // Crystal formation
        caveWall.fillStyle(crystalColor, 0.8);
        caveWall.fillTriangle(
          crystalX - crystalSize/2, crystalY + crystalSize/2,
          crystalX + crystalSize/2, crystalY + crystalSize/2,
          crystalX, crystalY - crystalSize/2
        );
      }
    }
    
    // Add to background elements
    chunk.elements.far.push(caveWall);
    this.addParallaxLayer(caveWall, 'far');
  }

  /**
   * Create theme-specific lighting (OPTIMIZED)
   * @param {object} chunk - Background chunk
   * @param {number} centerY - Center Y position
   * @param {string} theme - Current theme
   */
  createThemeLighting(chunk, centerY, theme) {
    // Skip lighting if too many chunks for performance
    if (this.backgroundChunks.length > 3) {
      return; // No lights for performance
    }

    if (!this.scene.lights) return;
    
    // Reduce number of lights significantly for better performance
    let lightCount = 1; // Only 1 light per chunk instead of many
    let lightColor = 0x64ffda;
    
    switch (theme) {
      case 'ancient_ruins':
        lightColor = 0x8d6e63;
        break;
      case 'crystal_caverns':
        lightColor = 0x7c4dff;
        break;
      case 'sky_temples':
        lightColor = 0x64ffda;
        break;
      case 'celestial_realm':
        lightColor = 0x9c27b0;
        break;
    }
    
    // Create single central light for chunk
    const light = this.scene.lights.addLight(
      CONFIG.GAME.WIDTH / 2,
      centerY,
      200, // Smaller radius for performance
      lightColor,
      0.4  // Lower intensity for performance
    );
    
    chunk.lights.push(light);
  }
} 