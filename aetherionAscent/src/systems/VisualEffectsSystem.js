import { CONFIG } from '../config/gameConfig.js';

/**
 * VisualEffectsSystem - Enhanced Graphics and Animation Management
 * 
 * This system provides comprehensive visual feedback for all game events:
 * - Wind effects with particles and screen distortion
 * - Coin collection with sparkles and score popups
 * - Player movement trails and impact effects
 * - Enemy attack animations and screen shake
 * - Ambient effects and environmental feedback
 * 
 * @author Me
 * @version 1.0.0
 */
export class VisualEffectsSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Effect management
    this.activeEffects = [];
    this.screenEffects = new Map();
    
    // Wind effect system
    this.windParticles = [];
    this.windIntensity = 0;
    this.windDirection = 1; // 1 = right, -1 = left
    
    // Screen shake system
    this.screenShake = {
      intensity: 0,
      duration: 0,
      startTime: 0
    };
    
    // Score popup system
    this.scorePopups = [];
    
    // Initialize systems
    this.initializeParticleSystems();
    this.createEffectTextures();
    
    console.log('✨ Visual Effects System initialized');
  }

  /**
   * Initialize particle systems for various effects
   */
  initializeParticleSystems() {
    // Create particle managers for different effect types
    this.windParticleManager = this.scene.add.particles();
    this.coinSparkleManager = this.scene.add.particles();
    this.impactParticleManager = this.scene.add.particles();
    this.ambientDustManager = this.scene.add.particles();
  }

  /**
   * Create enhanced textures for effects
   */
  createEffectTextures() {
    // Create wind particle texture
    const windGfx = this.scene.add.graphics();
    windGfx.fillStyle(0x87ceeb, 0.8); // Sky blue
    windGfx.fillCircle(4, 4, 4);
    windGfx.fillStyle(0xffffff, 0.4);
    windGfx.fillCircle(4, 4, 6);
    windGfx.generateTexture('windParticle', 8, 8);
    windGfx.destroy();

    // Create sparkle texture
    const sparkleGfx = this.scene.add.graphics();
    sparkleGfx.fillStyle(0xffd700, 1.0); // Gold
    sparkleGfx.fillCircle(3, 3, 3);
    sparkleGfx.fillStyle(0xffffff, 0.8);
    sparkleGfx.fillCircle(3, 3, 1);
    sparkleGfx.generateTexture('sparkle', 6, 6);
    sparkleGfx.destroy();

    // Create impact texture
    const impactGfx = this.scene.add.graphics();
    impactGfx.fillStyle(0xffffff, 0.9);
    impactGfx.fillCircle(2, 2, 2);
    impactGfx.generateTexture('impact', 4, 4);
    impactGfx.destroy();
  }

  /**
   * Create a dramatic wind effect
   * @param {number} intensity - Wind strength (1-5)
   * @param {number} direction - Wind direction (1 = right, -1 = left)
   * @param {number} duration - Effect duration in ms
   */
  createWindEffect(intensity = 3, direction = 1, duration = 2000) {
    console.log(`💨 Creating wind effect: intensity=${intensity}, direction=${direction}`);
    
    this.windIntensity = intensity;
    this.windDirection = direction;
    
    // Calculate wind parameters based on intensity
    const windSpeed = intensity * 100;
    const particleCount = intensity * 20;
    const screenShake = intensity * 2;
    
    // Create wind particles
    this.createWindParticles(particleCount, windSpeed, direction);
    
    // Add screen shake
    this.addScreenShake(screenShake, duration * 0.3);
    
    // Add screen distortion effect
    this.addScreenDistortion(intensity, duration);
    
    // Create wind sound effect (visual representation)
    this.createWindSoundEffect(intensity);
    
    // Clear wind effect after duration
    this.scene.time.delayedCall(duration, () => {
      this.clearWindEffect();
    });
  }

  /**
   * Create wind particles
   */
  createWindParticles(count, speed, direction) {
    // Create wind particles using modern Phaser API
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.sprite(
        direction === 1 ? -50 : CONFIG.GAME.WIDTH + 50,
        Math.random() * CONFIG.GAME.HEIGHT,
        'windParticle'
      );
      
      particle.setDepth(80);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (speed * direction) + (Math.random() - 0.5) * 100,
        y: particle.y + (Math.random() - 0.5) * 40,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 3000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Add screen shake effect
   */
  addScreenShake(intensity, duration) {
    // Use Phaser's built-in camera shake to avoid disrupting camera follow logic
    if (this.scene.cameras && this.scene.cameras.main) {
      const magnitude = Math.min(1, intensity * 0.005); // convert arbitrary intensity to 0-1 range
      this.scene.cameras.main.shake(duration, magnitude);
    }
  }

  /**
   * Add screen distortion effect
   */
  addScreenDistortion(intensity, duration) {
    const distortionEffect = {
      intensity: intensity * 0.02,
      duration: duration,
      startTime: this.scene.time.now,
      type: 'wind'
    };
    
    this.screenEffects.set('windDistortion', distortionEffect);
  }

  /**
   * Create visual wind sound effect
   */
  createWindSoundEffect(intensity) {
    // Create wind lines across the screen
    for (let i = 0; i < intensity * 3; i++) {
      const line = this.scene.add.graphics();
      line.lineStyle(2, 0x87ceeb, 0.3);
      line.beginPath();
      line.moveTo(-100, Math.random() * CONFIG.GAME.HEIGHT);
      line.lineTo(CONFIG.GAME.WIDTH + 100, Math.random() * CONFIG.GAME.HEIGHT);
      line.strokePath();
      
      // Animate line
      this.scene.tweens.add({
        targets: line,
        x: this.windDirection * 200,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => line.destroy()
      });
    }
  }

  /**
   * Clear wind effect
   */
  clearWindEffect() {
    this.windIntensity = 0;
    
    // Clear screen distortion
    this.screenEffects.delete('windDistortion');
  }

  /**
   * Create enhanced coin collection effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} value - Coin value
   */
  createCoinCollectionEffect(x, y, value) {
    console.log(`🪙 Creating coin collection effect at (${x}, ${y}) with value ${value}`);
    // More sparkle, bigger burst, longer popup
    this.createSparkleBurst(x, y, 28); // was 15
    this.createScorePopup(x, y, value, true); // true = positive
    this.createCoinTrail(x, y, 12, 1.0, 1200); // more, bigger, longer
    this.addScreenShake(2, 300); // slightly stronger
  }

  /**
   * Create negative coin loss effect (enemy steals coins)
   * @param {number} x - X position (player)
   * @param {number} y - Y position (player)
   * @param {number} amount - Coins lost
   */
  createCoinLossEffect(x, y, amount) {
    // Red/gray coins fly out
    for (let i = 0; i < amount * 4; i++) {
      const angle = (Math.PI * 2 / (amount * 4)) * i + Math.random() * 0.2;
      const speed = 60 + Math.random() * 60;
      const coin = this.scene.add.circle(x, y, 7, 0xff4444);
      coin.setDepth(110);
      coin.setAlpha(0.8);
      this.scene.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.5,
        duration: 900,
        ease: 'Power2',
        onComplete: () => coin.destroy()
      });
    }
    // Negative popup
    this.createScorePopup(x, y, -amount, false);
    // Quick red flash overlay
    const flash = this.scene.add.rectangle(x, y, this.scene.cameras.main.width, this.scene.cameras.main.height, 0xff0000, 0.18);
    flash.setScrollFactor(0);
    flash.setDepth(999);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 220,
      onComplete: () => flash.destroy()
    });
    this.addScreenShake(3, 350);
  }

  /**
   * Create sparkle burst effect
   */
  createSparkleBurst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = 70 + Math.random() * 120;
      const sparkle = this.scene.add.sprite(x, y, 'sparkle');
      sparkle.setDepth(100);
      sparkle.setBlendMode(Phaser.BlendModes.ADD);
      sparkle.setScale(1.1 + Math.random() * 0.5);
      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 1400,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  /**
   * Create score popup (positive/negative)
   */
  createScorePopup(x, y, value, positive = true) {
    const isNegative = value < 0 || positive === false;
    const popup = this.scene.add.text(x, y, `${isNegative ? '' : '+'}${value}`, {
      fontSize: isNegative ? '32px' : '32px',
      fontFamily: 'Arial Black',
      color: isNegative ? '#ff4444' : '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 6,
        fill: true
      }
    });
    popup.setOrigin(0.5);
    popup.setDepth(120);
    this.scene.tweens.add({
      targets: popup,
      y: y - (isNegative ? 30 : 60),
      alpha: 0,
      scaleX: isNegative ? 1.2 : 1.7,
      scaleY: isNegative ? 1.2 : 1.7,
      duration: isNegative ? 900 : 1400,
      ease: 'Power2',
      onComplete: () => popup.destroy()
    });
  }

  /**
   * Create coin trail effect (customizable)
   */
  createCoinTrail(x, y, count = 6, scale = 0.5, duration = 800) {
    for (let i = 0; i < count; i++) {
      const trail = this.scene.add.sprite(x, y, 'sparkle');
      trail.setDepth(90);
      trail.setBlendMode(Phaser.BlendModes.ADD);
      trail.setScale(scale + Math.random() * 0.3);
      this.scene.tweens.add({
        targets: trail,
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: duration,
        delay: i * 40,
        ease: 'Power2',
        onComplete: () => trail.destroy()
      });
    }
  }

  /**
   * Create player impact effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Impact type ('land', 'jump', 'wall')
   */
  createPlayerImpactEffect(x, y, type = 'land') {
    console.log(`💥 Creating player impact effect: ${type} at (${x}, ${y})`);
    
    let particleCount, color, scale;
    
    switch (type) {
      case 'land':
        particleCount = 8;
        color = 0x64ffda; // Cyan
        scale = 1.0;
        break;
      case 'jump':
        particleCount = 12;
        color = 0x7c4dff; // Purple
        scale = 1.2;
        break;
      case 'wall':
        particleCount = 6;
        color = 0xff6d00; // Orange
        scale = 0.8;
        break;
      default:
        particleCount = 10;
        color = 0xffffff;
        scale = 1.0;
    }
    
    // Create impact particles using modern Phaser API
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 30 + Math.random() * 50;
      
      const particle = this.scene.add.sprite(x, y, 'impact');
      particle.setDepth(85);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      particle.setTint(color);
      particle.setScale(scale);
      
      // Animate particle
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // Add small screen shake for impact
    this.addScreenShake(1, 150);
  }

  /**
   * Create enemy attack effect (more dramatic)
   */
  createEnemyAttackEffect(x, y, attackType = 'shoot') {
    console.log(`👹 Creating enemy attack effect: ${attackType} at (${x}, ${y})`);
    if (attackType === 'shoot') {
      this.createProjectileTrail(x, y, true); // true = dramatic
      this.createMuzzleFlash(x, y, true); // true = dramatic
    }
    this.addScreenShake(3, 400);
  }

  /**
   * Create projectile trail (dramatic option)
   */
  createProjectileTrail(x, y, dramatic = false) {
    const count = dramatic ? 7 : 3;
    for (let i = 0; i < count; i++) {
      const trail = this.scene.add.sprite(x, y, 'impact');
      trail.setDepth(95);
      trail.setBlendMode(Phaser.BlendModes.ADD);
      trail.setTint(0xff0000);
      trail.setScale(dramatic ? 0.7 : 0.3);
      trail.setAlpha(dramatic ? 0.9 : 0.7);
      this.scene.tweens.add({
        targets: trail,
        x: x + (Math.random() - 0.5) * (dramatic ? 180 : 100),
        y: y + (Math.random() - 0.5) * (dramatic ? 180 : 100),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: dramatic ? 700 : 400,
        delay: i * 30,
        ease: 'Power2',
        onComplete: () => trail.destroy()
      });
    }
  }

  /**
   * Create muzzle flash (dramatic option)
   */
  createMuzzleFlash(x, y, dramatic = false) {
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffff00, 0.95);
    flash.fillCircle(x, y, dramatic ? 18 : 8);
    flash.fillStyle(0xffffff, 0.7);
    flash.fillCircle(x, y, dramatic ? 10 : 4);
    flash.setDepth(100);
    this.scene.tweens.add({
      targets: flash,
      scaleX: dramatic ? 3 : 2,
      scaleY: dramatic ? 3 : 2,
      alpha: 0,
      duration: dramatic ? 220 : 150,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Update all visual effects
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.updateScreenShake();
    this.updateScreenEffects();
    this.updateScorePopups();
    this.cleanupEffects();
  }

  /**
   * Update screen shake effect
   */
  updateScreenShake() {
    // Camera shake is now handled internally by Phaser; no manual scroll adjustments needed.
  }

  /**
   * Update screen effects
   */
  updateScreenEffects() {
    this.screenEffects.forEach((effect, key) => {
      const elapsed = this.scene.time.now - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress >= 1) {
        this.screenEffects.delete(key);
      } else {
        // Apply effect based on type
        if (effect.type === 'windDistortion') {
          // Apply wind distortion to shader uniforms if available
          if (this.scene.shaderUniforms && this.scene.shaderUniforms.distortionStrength) {
            this.scene.shaderUniforms.distortionStrength = effect.intensity * (1 - progress);
          }
        }
      }
    });
  }

  /**
   * Update score popups
   */
  updateScorePopups() {
    this.scorePopups.forEach((popup, index) => {
      if (!popup.active) {
        this.scorePopups.splice(index, 1);
      }
    });
  }

  /**
   * Cleanup expired effects
   */
  cleanupEffects() {
    // Particles are automatically cleaned up when their tweens complete
    // No manual cleanup needed with the new approach
  }

  /**
   * Get current wind intensity
   */
  getWindIntensity() {
    return this.windIntensity;
  }

  /**
   * Get current wind direction
   */
  getWindDirection() {
    return this.windDirection;
  }

  /**
   * Destroy all effects and cleanup
   */
  destroy() {
    // Clear all effects
    this.activeEffects = [];
    this.screenEffects.clear();
    this.scorePopups = [];
    
    // Stop any ongoing camera shake without resetting scroll
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.stopShake();
    }
    
    console.log('✨ Visual Effects System destroyed');
  }
} 