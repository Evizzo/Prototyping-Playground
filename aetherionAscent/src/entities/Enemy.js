/**
 * Enemy - The Evil Adversary of Aetherion Ascent
 * 
 * A menacing but not demonic enemy controlled by AI:
 * - Dark, detailed appearance similar to player but evil
 * - Floating/hovering movement
 * - Dark aura and visual effects
 * - Spawns periodically to challenge the player
 * 
 * @author Me
 * @version 1.0.0
 */

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * Initialize the enemy
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy');
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store scene reference
    this.scene = scene;
    
    // Enemy state
    this.enemyState = {
      isActive: true,
      facingDirection: 1, // -1 = left, 1 = right
      hoverOffset: 0,
      attackCooldown: 0,
      spawnAnimation: true
    };
    
    // Floating movement
    this.floatState = {
      baseY: y,
      currentOffset: 0,
      speed: 2.0,
      amplitude: 15
    };
    
    // Visual elements
    this.bodyParts = {
      head: null,
      torso: null,
      leftArm: null,
      rightArm: null,
      legs: null,
      aura: null
    };
    
    this.visualElements = {
      darkAura: null,
      glowEffect: null,
      shadowTrail: [],
      maxTrailLength: 6
    };
    
    // Setup enemy appearance and behavior
    this.setupEnemyVisuals();
    this.setupEnemyPhysics();
    this.setupEnemyEffects();
    this.playSpawnAnimation();
    
    console.log('👹 Evil enemy spawned!');
  }

  /**
   * Setup enemy visual appearance - evil but detailed
   */
  setupEnemyVisuals() {
    // Hide the original sprite - we'll create detailed body parts
    this.setVisible(false);
    
    this.createEvilEnemyBody();
    
    // Set render depth to appear above platforms but below player
    this.setDepth(45);
  }

  /**
   * Create detailed evil enemy body
   */
  createEvilEnemyBody() {
    const baseX = this.x;
    const baseY = this.y;
    
    this.createEnemyHead(baseX, baseY);
    this.createEnemyTorso(baseX, baseY);
    this.createEnemyArms(baseX, baseY);
    this.createEnemyLegs(baseX, baseY);
    
    // Add subtle outline to all body parts
    this.addEnemyOutlines();
    
    // Animation state
    this.animationState = {
      floatCycle: 0,
      armSway: 0,
      auralPulse: 0
    };
    
    console.log('👹 Evil enemy body created!');
  }

  createEnemyHead(baseX, baseY) {
    // Create head (angular and menacing)
    this.bodyParts.head = this.scene.add.graphics();
    this.bodyParts.head.setPosition(baseX, baseY - 15);
    this.bodyParts.head.setDepth(47);
    
    // Head shape - pale, angular
    this.bodyParts.head.fillStyle(0xd0d0d0, 1.0); // Pale skin
    this.bodyParts.head.fillRect(-8, -8, 16, 16); // Angular head
    
    // Eyes - glowing red
    this.bodyParts.head.fillStyle(0xff0000, 1.0);
    this.bodyParts.head.fillCircle(-4, -3, 2); // Left eye
    this.bodyParts.head.fillCircle(4, -3, 2);  // Right eye
    
    // Eye glow
    this.bodyParts.head.fillStyle(0xff4444, 0.6);
    this.bodyParts.head.fillCircle(-4, -3, 4);
    this.bodyParts.head.fillCircle(4, -3, 4);
    
    // Evil grin
    this.bodyParts.head.lineStyle(2, 0x660000);
    this.bodyParts.head.beginPath();
    this.bodyParts.head.arc(0, 3, 6, 0.2, Math.PI - 0.2);
    this.bodyParts.head.strokePath();
    
    // Sharp teeth
    this.bodyParts.head.fillStyle(0xffffff, 1.0);
    for (let i = -4; i <= 4; i += 2) {
      this.bodyParts.head.fillTriangle(i - 1, 3, i + 1, 3, i, 6);
    }
  }

  createEnemyTorso(baseX, baseY) {
    // Create torso (dark armor/robes)
    this.bodyParts.torso = this.scene.add.graphics();
    this.bodyParts.torso.setPosition(baseX, baseY + 2);
    this.bodyParts.torso.setDepth(45);
    
    // Main torso - dark armor with spikes
    this.bodyParts.torso.fillStyle(0x2a2a2a, 1.0); // Dark gray armor
    this.bodyParts.torso.fillRect(-8, -10, 16, 20);
    
    // Armor details
    this.bodyParts.torso.fillStyle(0x1a1a1a, 1.0); // Darker details
    this.bodyParts.torso.fillRect(-6, -8, 12, 8);
    
    // Spikes on shoulders
    this.bodyParts.torso.fillStyle(0x444444, 1.0);
    this.bodyParts.torso.fillTriangle(-8, -10, -5, -10, -6.5, -15); // Left spike
    this.bodyParts.torso.fillTriangle(5, -10, 8, -10, 6.5, -15);    // Right spike
    
    // Evil emblem
    this.bodyParts.torso.fillStyle(0x660000, 1.0);
    this.bodyParts.torso.fillRect(-3, -4, 6, 4);
  }

  createEnemyArms(baseX, baseY) {
    // Create left arm
    this.bodyParts.leftArm = this.scene.add.graphics();
    this.bodyParts.leftArm.setPosition(baseX - 10, baseY - 5);
    this.bodyParts.leftArm.setDepth(44);
    
    // Left arm - longer and more menacing
    this.bodyParts.leftArm.fillStyle(0xd0d0d0, 1.0); // Pale skin
    this.bodyParts.leftArm.fillCircle(0, 0, 4); // Shoulder
    this.bodyParts.leftArm.fillRect(-2, 0, 4, 12); // Upper arm
    this.bodyParts.leftArm.fillCircle(0, 12, 3); // Elbow
    this.bodyParts.leftArm.fillRect(-1.5, 12, 3, 10); // Forearm
    
    // Clawed hand
    this.bodyParts.leftArm.fillStyle(0x888888, 1.0);
    this.bodyParts.leftArm.fillCircle(0, 22, 3); // Hand
    // Claws
    for (let i = -1; i <= 1; i++) {
      this.bodyParts.leftArm.fillTriangle(i * 2 - 1, 22, i * 2 + 1, 22, i * 2, 26);
    }
    
    // Create right arm
    this.bodyParts.rightArm = this.scene.add.graphics();
    this.bodyParts.rightArm.setPosition(baseX + 10, baseY - 5);
    this.bodyParts.rightArm.setDepth(44);
    
    this.bodyParts.rightArm.fillStyle(0xd0d0d0, 1.0); // Pale skin
    this.bodyParts.rightArm.fillCircle(0, 0, 4); // Shoulder
    this.bodyParts.rightArm.fillRect(-2, 0, 4, 12); // Upper arm
    this.bodyParts.rightArm.fillCircle(0, 12, 3); // Elbow
    this.bodyParts.rightArm.fillRect(-1.5, 12, 3, 10); // Forearm
    
    // Clawed hand
    this.bodyParts.rightArm.fillStyle(0x888888, 1.0);
    this.bodyParts.rightArm.fillCircle(0, 22, 3); // Hand
    // Claws
    for (let i = -1; i <= 1; i++) {
      this.bodyParts.rightArm.fillTriangle(i * 2 - 1, 22, i * 2 + 1, 22, i * 2, 26);
    }
  }

  createEnemyLegs(baseX, baseY) {
    // Create lower body (floating/ethereal)
    this.bodyParts.legs = this.scene.add.graphics();
    this.bodyParts.legs.setPosition(baseX, baseY + 12);
    this.bodyParts.legs.setDepth(44);
    
    // Tattered robe/cloak instead of legs
    this.bodyParts.legs.fillStyle(0x1a1a1a, 0.8); // Semi-transparent dark
    this.bodyParts.legs.fillRect(-6, 0, 12, 15);
    
    // Tattered edges
    for (let i = 0; i < 12; i++) {
      const x = -6 + i;
      const height = 15 + Math.sin(i) * 3;
      this.bodyParts.legs.fillRect(x, 0, 1, height);
    }
  }

  /**
   * Add dark outlines to body parts
   */
  addEnemyOutlines() {
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.lineStyle(1, 0x000000, 0.8);
        part.strokePath();
      }
    });
  }

  /**
   * Setup enemy physics
   */
  setupEnemyPhysics() {
    // Physics body configuration - smaller than visual for floating effect
    this.body.setSize(24, 32);
    this.body.setOffset(0, 0);
    
    // Floating physics - no gravity
    this.body.setGravityY(-800); // Counter world gravity
    this.body.setDragX(100); // Slight air resistance
    this.body.setMaxVelocityX(100); // Slow movement
    
    // No collision with world bounds (can float)
    this.body.setCollideWorldBounds(false);
  }

  /**
   * Setup enemy visual effects
   */
  setupEnemyEffects() {
    // Create dark aura
    this.visualElements.darkAura = this.scene.add.graphics();
    this.visualElements.darkAura.setPosition(this.x, this.y);
    this.visualElements.darkAura.setDepth(40);
    
    // Dark aura circle
    this.visualElements.darkAura.fillStyle(0x330033, 0.3);
    this.visualElements.darkAura.fillCircle(0, 0, 40);
    
    // Inner dark glow
    this.visualElements.darkAura.fillStyle(0x660066, 0.2);
    this.visualElements.darkAura.fillCircle(0, 0, 25);
    
    // Create floating particles around enemy
    this.createDarkParticles();
  }

  /**
   * Create dark particles around enemy
   */
  createDarkParticles() {
    // Create particle emitter if particle texture exists
    if (this.scene.textures.exists('particle')) {
      this.darkParticles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: [0x330033, 0x660066, 0x440044],
        scale: { start: 0.3, end: 0.1 },
        alpha: { start: 0.8, end: 0 },
        speed: { min: 10, max: 30 },
        lifespan: 2000,
        frequency: 100,
        quantity: 1
      });
      this.darkParticles.setDepth(42);
    }
  }

  /**
   * Play spawn animation
   */
  playSpawnAnimation() {
    // Start invisible and scale up
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.setAlpha(0);
        part.setScale(0.1);
      }
    });
    
    if (this.visualElements.darkAura) {
      this.visualElements.darkAura.setAlpha(0);
    }
    
    // Animate in
    this.scene.tweens.add({
      targets: Object.values(this.bodyParts).filter(p => p),
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    this.scene.tweens.add({
      targets: this.visualElements.darkAura,
      alpha: 1,
      duration: 1000,
      ease: 'Power2.easeOut'
    });
    
    // Screen flash effect
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x330033,
      0.5
    );
    flash.setScrollFactor(0);
    flash.setDepth(100);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy()
    });
    
    // Wait then disable spawn animation
    this.scene.time.delayedCall(1000, () => {
      this.enemyState.spawnAnimation = false;
    });
  }

  /**
   * Main update loop
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime) {
    if (!this.enemyState.isActive) return;
    
    // Update floating animation
    this.updateFloatingMovement();
    
    // Update body part positions and animations
    this.updateBodyPartPositions();
    this.updateBodyPartAnimations();
    
    // Update visual effects
    this.updateVisualEffects();
    
    // Update facing direction towards player
    this.updateFacingDirection();
  }

  /**
   * Update floating movement
   */
  updateFloatingMovement() {
    // Smooth floating motion
    this.floatState.currentOffset += this.floatState.speed * 0.016; // Assuming 60fps
    const floatOffset = Math.sin(this.floatState.currentOffset) * this.floatState.amplitude;
    
    // Apply floating to position
    this.y = this.floatState.baseY + floatOffset;
    
    // Gentle horizontal drift
    const driftOffset = Math.cos(this.floatState.currentOffset * 0.3) * 10;
    this.x = this.x + driftOffset * 0.01; // Very subtle drift
  }

  /**
   * Update all body part positions
   */
  updateBodyPartPositions() {
    const baseX = this.x;
    const baseY = this.y;
    
    if (this.bodyParts.head) {
      this.bodyParts.head.setPosition(baseX, baseY - 15);
    }
    if (this.bodyParts.torso) {
      this.bodyParts.torso.setPosition(baseX, baseY + 2);
    }
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.setPosition(baseX - 10, baseY - 5);
    }
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.setPosition(baseX + 10, baseY - 5);
    }
    if (this.bodyParts.legs) {
      this.bodyParts.legs.setPosition(baseX, baseY + 12);
    }
    
    // Update effects
    if (this.visualElements.darkAura) {
      this.visualElements.darkAura.setPosition(baseX, baseY);
    }
    if (this.darkParticles) {
      this.darkParticles.setPosition(baseX, baseY);
    }
  }

  /**
   * Update body part animations
   */
  updateBodyPartAnimations() {
    // Update animation cycles
    this.animationState.floatCycle += 0.05;
    this.animationState.armSway += 0.08;
    this.animationState.auralPulse += 0.1;
    
    // Animate head (subtle bobbing and tilting)
    this.animateEnemyHead();
    
    // Animate arms (menacing sway)
    this.animateEnemyArms();
    
    // Animate aura (pulsing effect)
    this.animateEnemyAura();
    
    // Handle facing direction
    this.updateBodyPartFacing();
  }

  /**
   * Animate enemy head
   */
  animateEnemyHead() {
    if (!this.bodyParts.head) return;
    
    // Subtle head movement
    const headBob = Math.sin(this.animationState.floatCycle) * 2;
    this.bodyParts.head.y += headBob;
    
    // Evil head tilt
    this.bodyParts.head.rotation = Math.sin(this.animationState.floatCycle * 0.5) * 0.1;
  }

  /**
   * Animate enemy arms
   */
  animateEnemyArms() {
    if (!this.bodyParts.leftArm || !this.bodyParts.rightArm) return;
    
    // Menacing arm sway
    const armSway = Math.sin(this.animationState.armSway) * 0.2;
    
    this.bodyParts.leftArm.rotation = armSway;
    this.bodyParts.rightArm.rotation = -armSway;
    
    // Arms occasionally gesture threateningly
    if (Math.random() < 0.001) { // Rare gesture
      this.performThreateningGesture();
    }
  }

  /**
   * Animate enemy aura
   */
  animateEnemyAura() {
    if (!this.visualElements.darkAura) return;
    
    // Pulsing aura effect
    const pulseFactor = 1 + Math.sin(this.animationState.auralPulse) * 0.2;
    this.visualElements.darkAura.setScale(pulseFactor);
    
    // Slowly rotating aura
    this.visualElements.darkAura.rotation += 0.005;
  }

  /**
   * Perform threatening gesture
   */
  performThreateningGesture() {
    if (!this.bodyParts.leftArm || !this.bodyParts.rightArm) return;
    
    // Quick threatening gesture
    this.scene.tweens.add({
      targets: [this.bodyParts.leftArm, this.bodyParts.rightArm],
      rotation: 0.5,
      duration: 200,
      yoyo: true,
      ease: 'Power2.easeInOut'
    });
  }

  /**
   * Update facing direction towards player
   */
  updateFacingDirection() {
    if (this.scene.player) {
      const playerDirection = this.scene.player.x > this.x ? 1 : -1;
      if (playerDirection !== this.enemyState.facingDirection) {
        this.enemyState.facingDirection = playerDirection;
      }
    }
  }

  /**
   * Update facing for all body parts
   */
  updateBodyPartFacing() {
    const facingLeft = this.enemyState.facingDirection === -1;
    
    // Flip all body parts based on facing direction
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.setScale(facingLeft ? -1 : 1, 1);
      }
    });
  }

  /**
   * Update visual effects
   */
  updateVisualEffects() {
    // Update shadow trail
    this.updateShadowTrail();
    
    // Random evil particle bursts
    if (Math.random() < 0.002) {
      this.createEvilParticleBurst();
    }
  }

  /**
   * Update shadow trail effect
   */
  updateShadowTrail() {
    // Add current position to trail
    this.visualElements.shadowTrail.push({
      x: this.x,
      y: this.y,
      alpha: 0.6
    });
    
    // Remove old trail points
    if (this.visualElements.shadowTrail.length > this.visualElements.maxTrailLength) {
      this.visualElements.shadowTrail.shift();
    }
    
    // Fade trail points
    this.visualElements.shadowTrail.forEach(point => {
      point.alpha *= 0.9;
    });
  }

  /**
   * Create evil particle burst
   */
  createEvilParticleBurst() {
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 30,
        this.y + (Math.random() - 0.5) * 30,
        Math.random() * 3 + 1,
        0x660066,
        0.8
      );
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 50,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Despawn the enemy with animation
   */
  despawn() {
    this.enemyState.isActive = false;
    
    // Fade out animation
    this.scene.tweens.add({
      targets: Object.values(this.bodyParts).filter(p => p),
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 600,
      ease: 'Power2.easeIn'
    });
    
    this.scene.tweens.add({
      targets: this.visualElements.darkAura,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeIn'
    });
    
    // Destroy after animation
    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }

  /**
   * Get distance to player
   */
  getDistanceToPlayer() {
    if (!this.scene.player) return Infinity;
    return Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
  }

  /**
   * Clean up enemy resources
   */
  destroy() {
    // Clean up body parts
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.destroy();
      }
    });
    
    // Clean up visual effects
    if (this.visualElements.darkAura) {
      this.visualElements.darkAura.destroy();
    }
    
    if (this.darkParticles) {
      this.darkParticles.destroy();
    }
    
    console.log('👹 Evil enemy destroyed');
    
    super.destroy();
  }
} 