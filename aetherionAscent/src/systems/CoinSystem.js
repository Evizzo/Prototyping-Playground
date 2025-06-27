import { CONFIG } from '../config/gameConfig.js';

/**
 * CoinSystem - Coin Generation and Collection Management
 * 
 * Handles all coin-related functionality:
 * - Procedural coin placement on platforms
 * - Coin animation and visual effects
 * - Collection detection and scoring
 * - Particle effects for collection feedback
 * 
 * @author Me
 * @version 1.0.0
 */
export class CoinSystem {
  /**
   * Initialize the coin system
   * @param {Phaser.Scene} scene - The game scene
   * @param {ScoringSystem} scoringSystem - Reference to scoring system
   */
  constructor(scene, scoringSystem) {
    this.scene = scene;
    this.scoringSystem = scoringSystem;
    
    // Coin management
    this.coins = [];
    this.coinGroup = null;
    
    // Animation and effects
    this.collectionEffects = [];
    
    // Performance tracking
    this.stats = {
      totalCoinsCreated: 0,
      coinsCollected: 0,
      activeCoins: 0
    };
    
    // Create coin physics group
    this.coinGroup = this.scene.physics.add.group();
    
    // Create coin texture
    this.createCoinTexture();
    
    console.log('🪙 Coin system initialized');
  }

  /**
   * Create procedural coin texture
   */
  createCoinTexture() {
    const size = CONFIG.COINS.SIZE;
    const texture = this.scene.add.graphics();
    
    // Create golden coin with glow
    texture.fillStyle(CONFIG.COINS.COLORS[0], 1.0);
    texture.fillCircle(size / 2, size / 2, size / 2 - 2);
    
    // Inner shine
    texture.fillStyle(0xffffff, 0.6);
    texture.fillCircle(size / 2 - 2, size / 2 - 2, 3);
    
    // Outer glow
    texture.fillStyle(CONFIG.COINS.COLORS[0], 0.3);
    texture.fillCircle(size / 2, size / 2, size / 2 + 2);
    
    texture.generateTexture('coin', size + 4, size + 4);
    texture.destroy();
    
    console.log('✅ Coin texture created');
  }

  /**
   * Create a coin on a platform
   * @param {number} x - X position
   * @param {number} y - Y position (platform top)
   * @param {object} platform - Reference to platform object
   * @returns {Phaser.Physics.Arcade.Sprite} The created coin
   */
  createCoin(x, y, platform) {
    // Position coin above platform center
    const coinX = x;
    const coinY = y - CONFIG.COINS.SIZE;
    
    // Create physics sprite
    const coin = this.scene.physics.add.sprite(coinX, coinY, 'coin');
    
    // Configure physics
    coin.setCollideWorldBounds(false);
    coin.body.setSize(CONFIG.COINS.COLLECTION_RADIUS, CONFIG.COINS.COLLECTION_RADIUS);
    coin.body.setGravityY(-CONFIG.WORLD.GRAVITY); // Disable gravity for floating effect
    
    // Visual setup
    coin.setDepth(50); // Above platforms
    coin.setScale(1.0);
    coin.setTint(this.getRandomCoinColor());
    
    // Store coin data
    coin.coinData = {
      platform: platform,
      originalY: coinY,
      bounceOffset: Math.random() * Math.PI * 2, // Random bounce phase
      collected: false,
      value: CONFIG.SCORING.COIN_VALUE,
      creationTime: this.scene.time.now
    };
    
    // Add to management
    this.coins.push(coin);
    this.coinGroup.add(coin);
    this.stats.totalCoinsCreated++;
    this.stats.activeCoins++;
    
    // Create coin light
    this.createCoinLight(coin);
    
    console.log(`🪙 Coin created at (${coinX}, ${coinY})`);
    
    return coin;
  }

  /**
   * Create light effect for coin
   * @param {Phaser.Physics.Arcade.Sprite} coin - The coin sprite
   */
  createCoinLight(coin) {
    if (this.scene.lights) {
      const light = this.scene.lights.addLight(
        coin.x,
        coin.y,
        CONFIG.COINS.GLOW_RADIUS,
        CONFIG.COINS.COLORS[0],
        CONFIG.COINS.LIGHT_INTENSITY
      );
      
      coin.coinData.light = light;
    }
  }

  /**
   * Get random coin color
   * @returns {number} Hex color value
   */
  getRandomCoinColor() {
    const colors = CONFIG.COINS.COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Update coin animations and check for collection
   * @param {object} player - Player object for collision detection
   */
  update(player) {
    // Update coin animations
    this.updateCoinAnimations();
    
    // Check for coin collection
    if (player) {
      this.checkCoinCollection(player);
    }
    
    // Update active coin count
    this.stats.activeCoins = this.coins.length;
  }

  /**
   * Update coin bounce animations
   */
  updateCoinAnimations() {
    const time = this.scene.time.now;
    
    this.coins.forEach(coin => {
      if (!coin.coinData.collected) {
        // Floating bounce animation
        const bouncePhase = (time * CONFIG.COINS.BOUNCE_SPEED * 0.001) + coin.coinData.bounceOffset;
        const bounceY = Math.sin(bouncePhase) * CONFIG.COINS.BOUNCE_HEIGHT;
        
        coin.y = coin.coinData.originalY + bounceY;
        
        // Update light position if it exists
        if (coin.coinData.light) {
          coin.coinData.light.x = coin.x;
          coin.coinData.light.y = coin.y;
        }
        
        // Gentle rotation
        coin.rotation += 0.02;
      }
    });
  }

  /**
   * Check for coin collection by player
   * @param {object} player - Player object
   */
  checkCoinCollection(player) {
    this.coins.forEach((coin, index) => {
      if (!coin.coinData.collected) {
        const distance = Phaser.Math.Distance.Between(
          player.x, player.y,
          coin.x, coin.y
        );
        
        if (distance < CONFIG.COINS.COLLECTION_RADIUS) {
          this.collectCoin(coin, index);
        }
      }
    });
  }

  /**
   * Handle coin collection
   * @param {Phaser.Physics.Arcade.Sprite} coin - The collected coin
   * @param {number} index - Coin index in array
   */
  collectCoin(coin, index) {
    coin.coinData.collected = true;
    
    // Award points through scoring system
    const coinValue = this.scoringSystem.collectCoin(coin.coinData.value);
    
    // Create collection effect
    this.createCollectionEffect(coin.x, coin.y);
    
    // Remove coin light
    if (coin.coinData.light) {
      this.scene.lights.removeLight(coin.coinData.light);
    }
    
    // Remove from management
    this.coins.splice(index, 1);
    this.coinGroup.remove(coin);
    coin.destroy();
    
    this.stats.coinsCollected++;
    this.stats.activeCoins--;
    
    console.log(`✨ Coin collected! Value: ${coinValue}`);
  }

  /**
   * Create particle effect when coin is collected
   * @param {number} x - Collection X position
   * @param {number} y - Collection Y position
   */
  createCollectionEffect(x, y) {
    // Create burst of golden particles
    for (let i = 0; i < CONFIG.COINS.PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 / CONFIG.COINS.PARTICLE_COUNT) * i;
      const speed = 50 + Math.random() * 30;
      
      const particle = this.scene.add.sprite(x, y, 'particle');
      particle.setTint(CONFIG.COINS.COLORS[0]);
      particle.setScale(0.5 + Math.random() * 0.5);
      particle.setDepth(100);
      
      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: CONFIG.COINS.PARTICLE_LIFETIME,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Destroy coins that have fallen below the void
   * @param {number} destructionThreshold - Y position below which to destroy coins
   */
  destroyCoinsBelow(destructionThreshold) {
    this.coins = this.coins.filter(coin => {
      if (coin.y > destructionThreshold) {
        // Remove light
        if (coin.coinData.light) {
          this.scene.lights.removeLight(coin.coinData.light);
        }
        
        // Remove from group and destroy
        this.coinGroup.remove(coin);
        coin.destroy();
        this.stats.activeCoins--;
        
        return false;
      }
      return true;
    });
  }

  /**
   * Get coin system statistics
   * @returns {object} Coin statistics
   */
  getStats() {
    return {
      ...this.stats,
      collectionRate: this.stats.totalCoinsCreated > 0 ? 
        (this.stats.coinsCollected / this.stats.totalCoinsCreated) * 100 : 0
    };
  }

  /**
   * Clean up all coins and effects
   */
  destroy() {
    // Destroy all coins
    this.coins.forEach(coin => {
      if (coin.coinData.light) {
        this.scene.lights.removeLight(coin.coinData.light);
      }
      coin.destroy();
    });
    
    // Clear arrays
    this.coins = [];
    this.collectionEffects = [];
    
    // Destroy group
    if (this.coinGroup) {
      this.coinGroup.destroy();
    }
    
    console.log('🗑️ Coin system destroyed');
  }
} 