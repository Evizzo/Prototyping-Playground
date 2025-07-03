import { CONFIG } from '../config/gameConfig.js';

/**
 * Player - The Hero of Aetherion Ascent
 * 
 * Implements momentum-based movement inspired by Icy Tower:
 * - Horizontal running speed directly impacts jump height and distance
 * - Wall sliding and wall jumping mechanics
 * - Dynamic light source that follows the player
 * - Responsive physics with satisfying movement feel
 * 
 * Controls:
 * - WASD or Arrow Keys for movement
 * - Space or W/Up for jumping
 * - Momentum builds with continued movement
 * 
 * @author Me
 * @version 1.0.0
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * Initialize the player character
   * @param {Phaser.Scene} scene - The game scene
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {ChatSystem} chatSystem - Reference to chat system for input blocking
   */
  constructor(scene, x, y, chatSystem = null) {
    // Create player sprite (we'll use a simple colored rectangle for now)
    super(scene, x, y, 'player');
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store scene reference
    this.scene = scene;
    
    // Store chat system reference for input blocking
    this.chatSystem = chatSystem;
    this.visualEffectsSystem = null;
    
    // Player state - optimized for strategic platforming
    this.playerState = {
      isGrounded: false,
      isTouchingWall: false,
      wallSide: 0, // -1 = left wall, 1 = right wall, 0 = no wall
      facingDirection: 1, // -1 = left, 1 = right
      horizontalSpeed: 0,
      maxHorizontalSpeed: 250,
      acceleration: 800,
      deceleration: 600,
      jumpForce: 520,        // Higher jump for strategic gap navigation
      wallJumpForce: 460,    // Higher wall jump force
      wallSlideSpeed: 100
    };
    
    // Wind effect system
    this.windEffect = {
      isActive: false,
      startTime: 0,
      duration: 0,
      forceX: 0,
      forceY: 0
    };
    
    // Input handling
    this.keys = {
      left: [scene.input.keyboard.addKey('A'), scene.input.keyboard.addKey('LEFT')],
      right: [scene.input.keyboard.addKey('D'), scene.input.keyboard.addKey('RIGHT')],
      jump: [scene.input.keyboard.addKey('SPACE'), scene.input.keyboard.addKey('W'), scene.input.keyboard.addKey('UP')]
    };
    
    // Cool visual elements
    this.visualElements = {
      hat: null,
      cape: null,
      speedTrail: [],
      maxTrailLength: 8,
      hatBobOffset: 0,
      capeSwayOffset: 0
    };
    
    // Visual and lighting setup
    this.setupPlayerVisuals();
    this.setupCoolAccessories();
    this.setupPlayerLight();
    this.setupPlayerPhysics();
    
    // Performance tracking
    this.lastGroundedTime = 0;
    this.coyoteTime = 200; // ms of grace period for jumping after leaving ground - increased for easier gameplay
    
    console.log('🦸 Player character created and ready for action!');
  }

  /**
   * Set chat system reference for input blocking
   * @param {ChatSystem} chatSystem - Chat system instance
   */
  setChatSystem(chatSystem) {
    this.chatSystem = chatSystem;
  }

  /**
   * Set visual effects system reference
   * @param {VisualEffectsSystem} visualEffectsSystem - Visual effects system instance
   */
  setVisualEffectsSystem(visualEffectsSystem) {
    this.visualEffectsSystem = visualEffectsSystem;
  }

  /**
   * Apply wind effect that overrides normal movement
   * @param {number} forceX - Horizontal force
   * @param {number} forceY - Vertical force
   * @param {number} duration - Duration in milliseconds
   */
  applyWindEffect(forceX, forceY, duration = 2000) {
    console.log(`🌪️ PLAYER: Wind effect applied - X: ${Math.round(forceX)}, Y: ${Math.round(forceY)}, Duration: ${duration}ms`);
    
    this.windEffect.isActive = true;
    this.windEffect.startTime = this.scene.time.now;
    this.windEffect.duration = duration;
    this.windEffect.forceX = forceX;
    this.windEffect.forceY = forceY;
    
    // Apply initial force
    this.body.setVelocity(forceX, forceY);
    
    // Clear any existing movement input
    this.playerState.horizontalSpeed = 0;
  }

  /**
   * Update wind effect
   * @param {number} deltaTime - Time since last frame
   */
  updateWindEffect(deltaTime) {
    if (!this.windEffect.isActive) return;
    
    const elapsed = this.scene.time.now - this.windEffect.startTime;
    const progress = elapsed / this.windEffect.duration;
    
    if (progress >= 1) {
      // Wind effect finished
      this.windEffect.isActive = false;
      console.log('🌪️ PLAYER: Wind effect finished');
    } else {
      // Apply wind force with gradual decay
      const decayFactor = 1 - (progress * 0.5); // Gradual decay over time
      const currentForceX = this.windEffect.forceX * decayFactor;
      const currentForceY = this.windEffect.forceY * decayFactor;
      
      // Apply wind force (this will override normal movement)
      this.body.setVelocity(currentForceX, currentForceY);
    }
  }

  /**
   * Enable or disable key capture based on chat state
   * @param {boolean} enabled - Whether keys should be captured by player
   */
  setKeyCapture(enabled) {
    if (enabled) {
      // Re-enable key capture - recreate the keys only if Phaser keyboard is enabled
      if (this.scene.input.keyboard && this.scene.input.keyboard.enabled) {
        this.keys = {
          left: [this.scene.input.keyboard.addKey('A'), this.scene.input.keyboard.addKey('LEFT')],
          right: [this.scene.input.keyboard.addKey('D'), this.scene.input.keyboard.addKey('RIGHT')],
          jump: [this.scene.input.keyboard.addKey('SPACE'), this.scene.input.keyboard.addKey('W'), this.scene.input.keyboard.addKey('UP')]
        };
        console.log('🎮 Player keys RECREATED for movement');
      } else {
        // Keep keys empty if Phaser keyboard is disabled
        this.keys = {
          left: [],
          right: [],
          jump: []
        };
        console.log('🎮 Player keys NOT recreated - Phaser keyboard disabled');
      }
    } else {
      // Disable key capture - remove keys from Phaser safely
      try {
        Object.values(this.keys).flat().forEach(key => {
          if (key && this.scene.input.keyboard) {
            this.scene.input.keyboard.removeKey(key);
          }
        });
      } catch (error) {
        console.log('🎮 Error removing keys (this is OK):', error.message);
      }
      
      // Clear the keys object
      this.keys = {
        left: [],
        right: [],
        jump: []
      };
      console.log('🎮 Player keys REMOVED for chat input');
    }
  }

  /**
   * Setup player visual appearance
   */
  setupPlayerVisuals() {
    // Hide the original simple sprite - we'll create detailed body parts
    this.setVisible(false);
    
    // Create realistic human-like body parts
    this.bodyParts = {
      head: null,
      torso: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null
    };
    
    this.createRealisticPlayerBody();
    
    // Set render depth to appear above most objects
    this.setDepth(50);
  }

  /**
   * Create a realistic human-like character with detailed body parts
   */
  createRealisticPlayerBody() {
    const baseX = this.x;
    const baseY = this.y;
    
    // Create head (circular with face details)
    this.bodyParts.head = this.scene.add.graphics();
    this.bodyParts.head.setPosition(baseX, baseY - 12);
    this.bodyParts.head.setDepth(52);
    
    // Head shape - skin tone
    this.bodyParts.head.fillStyle(0xffdbac, 1.0); // Skin color
    this.bodyParts.head.fillCircle(0, 0, 8);
    
    // Eyes
    this.bodyParts.head.fillStyle(0x000000, 1.0);
    this.bodyParts.head.fillCircle(-3, -2, 1.5); // Left eye
    this.bodyParts.head.fillCircle(3, -2, 1.5);  // Right eye
    
    // Eye shine
    this.bodyParts.head.fillStyle(0xffffff, 1.0);
    this.bodyParts.head.fillCircle(-2.5, -2.5, 0.5);
    this.bodyParts.head.fillCircle(3.5, -2.5, 0.5);
    
    // Mouth
    this.bodyParts.head.lineStyle(1, 0x000000);
    this.bodyParts.head.beginPath();
    this.bodyParts.head.arc(0, 2, 2, 0, Math.PI);
    this.bodyParts.head.strokePath();
    
    // Create torso (rectangular with armor-like details)
    this.bodyParts.torso = this.scene.add.graphics();
    this.bodyParts.torso.setPosition(baseX, baseY + 2);
    this.bodyParts.torso.setDepth(50);
    
    // Main torso - adventurer clothing
    this.bodyParts.torso.fillStyle(0x8b4513, 1.0); // Brown leather armor
    this.bodyParts.torso.fillRoundedRect(-6, -8, 12, 16, 2);
    
    // Chest plate details
    this.bodyParts.torso.fillStyle(0x654321, 1.0); // Darker brown
    this.bodyParts.torso.fillRoundedRect(-4, -6, 8, 6, 1);
    
    // Belt
    this.bodyParts.torso.fillStyle(0x2f1b14, 1.0); // Dark brown belt
    this.bodyParts.torso.fillRect(-6, 4, 12, 2);
    
    // Belt buckle
    this.bodyParts.torso.fillStyle(0xffd700, 1.0); // Gold buckle
    this.bodyParts.torso.fillRect(-1, 4, 2, 2);
    
    // Create arms (animated based on movement)
    this.bodyParts.leftArm = this.scene.add.graphics();
    this.bodyParts.leftArm.setPosition(baseX - 8, baseY - 4);
    this.bodyParts.leftArm.setDepth(49);
    
    // Left arm
    this.bodyParts.leftArm.fillStyle(0xffdbac, 1.0); // Skin
    this.bodyParts.leftArm.fillCircle(0, 0, 3); // Shoulder
    this.bodyParts.leftArm.fillRect(-1, 0, 2, 8); // Upper arm
    this.bodyParts.leftArm.fillCircle(0, 8, 2.5); // Elbow
    this.bodyParts.leftArm.fillRect(-1, 8, 2, 6); // Forearm
    
    // Right arm
    this.bodyParts.rightArm = this.scene.add.graphics();
    this.bodyParts.rightArm.setPosition(baseX + 8, baseY - 4);
    this.bodyParts.rightArm.setDepth(49);
    
    this.bodyParts.rightArm.fillStyle(0xffdbac, 1.0); // Skin
    this.bodyParts.rightArm.fillCircle(0, 0, 3); // Shoulder
    this.bodyParts.rightArm.fillRect(-1, 0, 2, 8); // Upper arm
    this.bodyParts.rightArm.fillCircle(0, 8, 2.5); // Elbow
    this.bodyParts.rightArm.fillRect(-1, 8, 2, 6); // Forearm
    
    // Create legs (animated for walking)
    this.bodyParts.leftLeg = this.scene.add.graphics();
    this.bodyParts.leftLeg.setPosition(baseX - 3, baseY + 8);
    this.bodyParts.leftLeg.setDepth(49);
    
    // Left leg
    this.bodyParts.leftLeg.fillStyle(0x4a4a4a, 1.0); // Dark pants
    this.bodyParts.leftLeg.fillRect(-2, 0, 4, 10); // Thigh
    this.bodyParts.leftLeg.fillStyle(0x654321, 1.0); // Brown boots
    this.bodyParts.leftLeg.fillRect(-2, 8, 4, 4); // Lower leg/boot
    
    // Right leg
    this.bodyParts.rightLeg = this.scene.add.graphics();
    this.bodyParts.rightLeg.setPosition(baseX + 3, baseY + 8);
    this.bodyParts.rightLeg.setDepth(49);
    
    this.bodyParts.rightLeg.fillStyle(0x4a4a4a, 1.0); // Dark pants
    this.bodyParts.rightLeg.fillRect(-2, 0, 4, 10); // Thigh
    this.bodyParts.rightLeg.fillStyle(0x654321, 1.0); // Brown boots
    this.bodyParts.rightLeg.fillRect(-2, 8, 4, 4); // Lower leg/boot
    
    // Add subtle outline to all body parts
    this.addBodyPartOutlines();
    
    // Animation state for body parts
    this.animationState = {
      walkCycle: 0,
      armSwing: 0,
      headBob: 0
    };
    
    console.log('🧙‍♂️ Realistic adventurer body created!');
  }

  /**
   * Add subtle outlines to all body parts for better definition
   */
  addBodyPartOutlines() {
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.lineStyle(1, 0x000000, 0.3);
      }
    });
  }

  /**
   * Setup cool accessories like hat and cape
   */
  setupCoolAccessories() {
    // Create a realistic wizard/adventure hat with proper shape
    this.visualElements.hat = this.scene.add.graphics();
    this.visualElements.hat.setPosition(this.x, this.y - 20);
    this.visualElements.hat.setDepth(53);
    
    // Hat base (circular brim)
    this.visualElements.hat.fillStyle(0x2c1810, 1.0); // Dark brown leather
    this.visualElements.hat.fillEllipse(0, 6, 20, 6); // Flat brim
    
    // Hat crown (main part)
    this.visualElements.hat.fillStyle(0x4a2c17, 1.0); // Medium brown
    this.visualElements.hat.fillRoundedRect(-8, -8, 16, 14, 2); // Main hat body
    
    // Hat band (decorative stripe)
    this.visualElements.hat.fillStyle(0x8b4513, 1.0); // Lighter brown band
    this.visualElements.hat.fillRect(-8, 2, 16, 3);
    
    // Hat buckle/ornament
    this.visualElements.hat.fillStyle(0xffd700, 1.0); // Gold buckle
    this.visualElements.hat.fillRect(-2, 2, 4, 3);
    this.visualElements.hat.fillStyle(0x000000, 1.0); // Black center
    this.visualElements.hat.fillRect(-1, 3, 2, 1);
    
    // Hat tip/point (adventure hat style)
    this.visualElements.hat.fillStyle(0x4a2c17, 1.0);
    this.visualElements.hat.fillTriangle(-4, -8, 4, -8, 0, -18); // Pointed tip
    
    // Hat shadow under brim
    this.visualElements.hat.fillStyle(0x000000, 0.2);
    this.visualElements.hat.fillEllipse(0, 7, 18, 4);
    
    // Remove cape - no longer needed
    this.visualElements.cape = null;
    
    console.log('🎩 Realistic adventurer hat equipped! Cape removed for better mobility! ✨');
  }

  /**
   * Setup dynamic lighting for the player
   */
  setupPlayerLight() {
    // Create player light source
    this.playerLight = this.scene.lights.addLight(
      this.x,
      this.y,
      CONFIG.LIGHTING.PLAYER_LIGHT_RADIUS,
      CONFIG.LIGHTING.PLAYER_LIGHT_COLOR,
      CONFIG.LIGHTING.PLAYER_LIGHT_INTENSITY
    );
    
    // Store reference in scene for easy access
    this.scene.playerLight = this.playerLight;
  }

  /**
   * Setup player physics properties
   */
  setupPlayerPhysics() {
    // Physics body configuration
    this.body.setSize(20, 28); // Slightly smaller than visual for better feel
    this.body.setOffset(2, 2);
    
    // Collision settings
    this.body.setCollideWorldBounds(true);
    this.body.setDragX(400); // Natural deceleration when no input
    this.body.setMaxVelocityX(this.playerState.maxHorizontalSpeed);
    
    // Bounce settings
    this.body.setBounce(0.1, 0); // Slight horizontal bounce, no vertical bounce
  }

  /**
   * Main update loop for player logic
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  update(deltaTime) {
    // Update wind effect first (this overrides normal movement)
    this.updateWindEffect(deltaTime);
    
    // Update player state
    this.updateGroundedState();
    this.updateWallInteraction();
    
    // Only handle normal input if wind effect is not active
    if (!this.windEffect.isActive) {
      // Handle input
      this.handleMovementInput(deltaTime);
      this.handleJumpInput();
    }
    
    // Update visuals
    this.updatePlayerLight();
    this.updateVisualEffects();
    
    // Update facing direction based on movement
    this.updateFacingDirection();
  }

  /**
   * Check if player is grounded (on platform or ground)
   */
  updateGroundedState() {
    const wasGrounded = this.playerState.isGrounded;
    this.playerState.isGrounded = this.body.touching.down || this.body.blocked.down;
    
    // Track when we were last grounded for coyote time
    if (this.playerState.isGrounded) {
      this.lastGroundedTime = this.scene.time.now;
    }
    
    // Visual feedback for landing
    if (!wasGrounded && this.playerState.isGrounded) {
      this.onLanding();
    }
  }

  /**
   * Check for wall interaction (wall sliding)
   */
  updateWallInteraction() {
    this.playerState.isTouchingWall = this.body.touching.left || this.body.touching.right;
    
    if (this.playerState.isTouchingWall) {
      this.playerState.wallSide = this.body.touching.left ? -1 : 1;
      
      // Implement wall sliding
      if (!this.playerState.isGrounded && this.body.velocity.y > this.playerState.wallSlideSpeed) {
        this.body.setVelocityY(this.playerState.wallSlideSpeed);
      }
    } else {
      this.playerState.wallSide = 0;
    }
  }

  /**
   * Handle horizontal movement input (WASD/Arrow keys)
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  handleMovementInput(deltaTime) {
    // Don't process movement if chat is open
    if (this.chatSystem && this.chatSystem.isVisible) {
      return;
    }
    
    // Check input states (handle empty arrays when chat is open)
    const leftPressed = this.keys.left.some(key => key && key.isDown);
    const rightPressed = this.keys.right.some(key => key && key.isDown);
    
    // Calculate desired horizontal movement
    let inputDirection = 0;
    if (leftPressed && !rightPressed) inputDirection = -1;
    if (rightPressed && !leftPressed) inputDirection = 1;
    
    // Apply movement with momentum building
    if (inputDirection !== 0) {
      // Build up speed gradually
      this.playerState.horizontalSpeed += this.playerState.acceleration * deltaTime * inputDirection;
      this.playerState.horizontalSpeed = Phaser.Math.Clamp(
        this.playerState.horizontalSpeed,
        -this.playerState.maxHorizontalSpeed,
        this.playerState.maxHorizontalSpeed
      );
      
      // Apply velocity
      this.body.setVelocityX(this.playerState.horizontalSpeed);
    } else {
      // Decelerate when no input
      if (this.playerState.isGrounded) {
        this.playerState.horizontalSpeed *= Math.pow(0.85, deltaTime * 60); // Smooth deceleration
        if (Math.abs(this.playerState.horizontalSpeed) < 5) {
          this.playerState.horizontalSpeed = 0;
        }
        this.body.setVelocityX(this.playerState.horizontalSpeed);
      }
    }
  }

  /**
   * Handle jump input (Space, W, Up Arrow)
   */
  handleJumpInput() {
    // Don't process jump if chat is open
    if (this.chatSystem && this.chatSystem.isVisible) {
      return;
    }
    
    const jumpPressed = this.keys.jump.some(key => key && Phaser.Input.Keyboard.JustDown(key));
    
    if (jumpPressed) {
      // Regular jump (ground or coyote time)
      if (this.playerState.isGrounded || this.canCoyoteJump()) {
        this.performJump();
      }
      // Wall jump
      else if (this.playerState.isTouchingWall && !this.playerState.isGrounded) {
        this.performWallJump();
      }
    }
  }

  /**
   * Check if player can perform coyote jump (grace period after leaving ground)
   * @returns {boolean} Whether coyote jump is available
   */
  canCoyoteJump() {
    return (this.scene.time.now - this.lastGroundedTime) < this.coyoteTime;
  }

  /**
   * Perform regular jump with momentum-based height
   */
  performJump() {
    // Base jump force
    let jumpForce = this.playerState.jumpForce;
    
    // Momentum bonus: faster horizontal speed = higher jumps (Icy Tower style)
    const speedRatio = Math.abs(this.playerState.horizontalSpeed) / this.playerState.maxHorizontalSpeed;
    const momentumBonus = speedRatio * 150; // Extra jump force based on speed
    
    jumpForce += momentumBonus;
    
    // Apply jump
    this.body.setVelocityY(-jumpForce);
    
    // Create enhanced jump effect using visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.createPlayerImpactEffect(this.x, this.y, 'jump');
    }
    
    console.log(`🦘 Jump! Force: ${Math.round(jumpForce)} (Speed bonus: ${Math.round(momentumBonus)})`);
  }

  /**
   * Perform wall jump with directional boost
   */
  performWallJump() {
    // Jump away from wall
    const jumpDirection = -this.playerState.wallSide;
    
    // Apply wall jump forces
    this.body.setVelocityY(-this.playerState.wallJumpForce);
    this.body.setVelocityX(jumpDirection * (this.playerState.maxHorizontalSpeed * 0.8));
    
    // Update internal speed tracking
    this.playerState.horizontalSpeed = jumpDirection * (this.playerState.maxHorizontalSpeed * 0.8);
    
    // Create enhanced wall jump effect using visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.createPlayerImpactEffect(this.x, this.y, 'wall');
    }
    
    console.log(`🧗 Wall jump! Direction: ${jumpDirection > 0 ? 'Right' : 'Left'}`);
  }

  /**
   * Handle landing effects
   */
  onLanding() {
    const impactSpeed = Math.abs(this.body.velocity.y);
    
    // Create enhanced landing effect using visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.createPlayerImpactEffect(this.x, this.y, 'land');
    }
    
    if (impactSpeed > 200) {
      console.log(`💥 Heavy landing! Impact speed: ${Math.round(impactSpeed)}`);
    }
  }

  /**
   * Update player light position and effects
   */
  updatePlayerLight() {
    if (this.playerLight) {
      // Update light position to follow player
      this.playerLight.x = this.x;
      this.playerLight.y = this.y;
      
      // Dynamic light intensity based on movement
      const speedRatio = Math.abs(this.body.velocity.x) / this.playerState.maxHorizontalSpeed;
      const intensityBonus = speedRatio * 0.3;
      this.playerLight.intensity = CONFIG.LIGHTING.PLAYER_LIGHT_INTENSITY + intensityBonus;
    }
  }

  /**
   * Update visual effects based on player state
   */
  updateVisualEffects() {
    // Update realistic body part animations
    this.updateBodyPartPositions();
    this.updateBodyPartAnimations();
    
    // Update cool accessories
    this.updateHatAnimation();
    this.updateSpeedTrail();
  }

  /**
   * Update all body part positions to follow the player
   */
  updateBodyPartPositions() {
    const baseX = this.x;
    const baseY = this.y;
    
    // Update base positions for all body parts
    if (this.bodyParts.head) {
      this.bodyParts.head.setPosition(baseX, baseY - 12);
    }
    if (this.bodyParts.torso) {
      this.bodyParts.torso.setPosition(baseX, baseY + 2);
    }
    if (this.bodyParts.leftArm) {
      this.bodyParts.leftArm.setPosition(baseX - 8, baseY - 4);
    }
    if (this.bodyParts.rightArm) {
      this.bodyParts.rightArm.setPosition(baseX + 8, baseY - 4);
    }
    if (this.bodyParts.leftLeg) {
      this.bodyParts.leftLeg.setPosition(baseX - 3, baseY + 8);
    }
    if (this.bodyParts.rightLeg) {
      this.bodyParts.rightLeg.setPosition(baseX + 3, baseY + 8);
    }
  }

  /**
   * Animate body parts based on movement and state
   */
  updateBodyPartAnimations() {
    const speed = Math.abs(this.body.velocity.x);
    const isMoving = speed > 20;
    
    // Update animation cycles
    if (isMoving) {
      this.animationState.walkCycle += 0.3;
      this.animationState.armSwing += 0.25;
    } else {
      this.animationState.walkCycle += 0.05; // Slow idle animation
      this.animationState.armSwing += 0.02;
    }
    this.animationState.headBob += 0.1;
    
    // Animate head (subtle bobbing)
    this.animateHead(isMoving);
    
    // Animate torso (slight tilt based on movement)
    this.animateTorso();
    
    // Animate arms (swinging with movement)
    this.animateArms(isMoving);
    
    // Animate legs (walking cycle)
    this.animateLegs(isMoving);
    
    // Handle facing direction for all body parts
    this.updateBodyPartFacing();
  }

  /**
   * Animate the head with realistic movements
   */
  animateHead(isMoving) {
    if (!this.bodyParts.head) return;
    
    // Subtle head bobbing
    const bobAmount = isMoving ? Math.sin(this.animationState.headBob) * 1 : Math.sin(this.animationState.headBob) * 0.3;
    this.bodyParts.head.y += bobAmount;
    
    // Head tilt based on movement direction
    const speedRatio = this.body.velocity.x / this.playerState.maxHorizontalSpeed;
    this.bodyParts.head.rotation = speedRatio * 0.05;
    
    // Extra head movement when jumping/falling
    if (!this.playerState.isGrounded) {
      const verticalInfluence = this.body.velocity.y / 400;
      this.bodyParts.head.rotation += verticalInfluence * 0.1;
    }
  }

  /**
   * Animate the torso with subtle movements
   */
  animateTorso() {
    if (!this.bodyParts.torso) return;
    
    // Torso leans slightly with movement
    const speedRatio = this.body.velocity.x / this.playerState.maxHorizontalSpeed;
    this.bodyParts.torso.rotation = speedRatio * 0.03;
    
    // Breathing animation (subtle expansion/contraction)
    const breathe = Math.sin(this.animationState.headBob * 0.5) * 0.5;
    this.bodyParts.torso.scaleY = 1 + breathe * 0.02;
  }

  /**
   * Animate arms with realistic swinging motion
   */
  animateArms(isMoving) {
    if (!this.bodyParts.leftArm || !this.bodyParts.rightArm) return;
    
    const swingAmount = isMoving ? 0.3 : 0.1;
    
    // Arms swing opposite to each other
    const leftArmSwing = Math.sin(this.animationState.armSwing) * swingAmount;
    const rightArmSwing = Math.sin(this.animationState.armSwing + Math.PI) * swingAmount;
    
    this.bodyParts.leftArm.rotation = leftArmSwing;
    this.bodyParts.rightArm.rotation = rightArmSwing;
    
    // Arms move more dramatically when jumping
    if (!this.playerState.isGrounded) {
      this.bodyParts.leftArm.rotation += 0.2;
      this.bodyParts.rightArm.rotation -= 0.2;
    }
  }

  /**
   * Animate legs with walking cycle
   */
  animateLegs(isMoving) {
    if (!this.bodyParts.leftLeg || !this.bodyParts.rightLeg) return;
    
    const walkAmount = isMoving ? 0.2 : 0.05;
    
    // Legs alternate like walking
    const leftLegMove = Math.sin(this.animationState.walkCycle) * walkAmount;
    const rightLegMove = Math.sin(this.animationState.walkCycle + Math.PI) * walkAmount;
    
    this.bodyParts.leftLeg.rotation = leftLegMove;
    this.bodyParts.rightLeg.rotation = rightLegMove;
    
    // Legs position slightly forward/back during walk cycle
    if (isMoving) {
      this.bodyParts.leftLeg.x += Math.sin(this.animationState.walkCycle) * 2;
      this.bodyParts.rightLeg.x += Math.sin(this.animationState.walkCycle + Math.PI) * 2;
    }
  }

  /**
   * Update facing direction for all body parts
   */
  updateBodyPartFacing() {
    const facingLeft = this.playerState.facingDirection === -1;
    
    // Flip all body parts based on facing direction
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.setScale(facingLeft ? -1 : 1, 1);
      }
    });
  }

  /**
   * Animate the awesome hat with bobbing and tilting
   */
  updateHatAnimation() {
    if (!this.visualElements.hat) return;
    
    // Update hat position to follow player
    this.visualElements.hat.setPosition(this.x, this.y - 20);
    
    // Bob the hat slightly when moving
    this.visualElements.hatBobOffset += 0.15;
    const bobAmount = Math.abs(this.body.velocity.x) > 20 ? Math.sin(this.visualElements.hatBobOffset) * 2 : 0;
    this.visualElements.hat.y += bobAmount;
    
    // Tilt hat based on movement and facing direction
    const speedRatio = this.body.velocity.x / this.playerState.maxHorizontalSpeed;
    this.visualElements.hat.rotation = speedRatio * 0.15;
    
    // Flip hat with player using scale instead of setFlipX (since it's graphics)
    const facingLeft = this.playerState.facingDirection === -1;
    this.visualElements.hat.setScale(facingLeft ? -1 : 1, 1);
    
    // Hat bounces more dramatically when jumping/falling
    if (!this.playerState.isGrounded) {
      const verticalInfluence = this.body.velocity.y / 500;
      this.visualElements.hat.y += verticalInfluence * 3;
      
      // Hat tilts more when airborne for dramatic effect
      this.visualElements.hat.rotation += verticalInfluence * 0.1;
    }
  }

  /**
   * Create and update speed trail effect
   */
  updateSpeedTrail() {
    const speed = Math.abs(this.body.velocity.x);
    
    // Only create trail when moving fast enough
    if (speed > 100) {
      // Add new trail point
      this.visualElements.speedTrail.push({
        x: this.x,
        y: this.y,
        alpha: 0.6,
        time: this.scene.time.now
      });
      
      // Limit trail length
      if (this.visualElements.speedTrail.length > this.visualElements.maxTrailLength) {
        this.visualElements.speedTrail.shift();
      }
    }
    
    // Update existing trail points
    this.visualElements.speedTrail.forEach((point, index) => {
      // Fade out over time
      const age = this.scene.time.now - point.time;
      point.alpha = Math.max(0, 0.6 - (age / 300));
      
      // Remove old points
      if (point.alpha <= 0) {
        this.visualElements.speedTrail.splice(index, 1);
      }
    });
  }

  /**
   * Update facing direction for future animation system
   */
  updateFacingDirection() {
    // Update facing direction based on velocity
    if (this.body.velocity.x > 10) {
      this.playerState.facingDirection = 1;
    } else if (this.body.velocity.x < -10) {
      this.playerState.facingDirection = -1;
    }
  }

  /**
   * Test wind effect directly
   * Call from browser console: gameScene.player.testWindEffect()
   */
  testWindEffect(forceX = 1000, forceY = -500) {
    console.log('🧪 PLAYER TEST: Manual wind effect test');
    this.applyWindEffect(forceX, forceY, 2000);
  }

  /**
   * Get current player state for debugging
   * @returns {object} Current player state
   */
  getPlayerState() {
    return {
      position: { x: Math.round(this.x), y: Math.round(this.y) },
      velocity: { x: Math.round(this.body.velocity.x), y: Math.round(this.body.velocity.y) },
      grounded: this.playerState.isGrounded,
      touchingWall: this.playerState.isTouchingWall,
      wallSide: this.playerState.wallSide,
      horizontalSpeed: Math.round(this.playerState.horizontalSpeed),
      facingDirection: this.playerState.facingDirection
    };
  }

  /**
   * Clean up player resources
   */
  destroy() {
    // Remove player light
    if (this.playerLight && this.scene.lights) {
      this.scene.lights.removeLight(this.playerLight);
    }
    
    // Clean up cool visual elements
    if (this.visualElements.hat) {
      this.visualElements.hat.destroy();
    }
    
    // Clean up all body parts
    Object.values(this.bodyParts).forEach(part => {
      if (part) {
        part.destroy();
      }
    });
    
    // Clean up speed trail
    this.visualElements.speedTrail = [];
    
    // Clean up input handlers
    this.keys.left.forEach(key => key.destroy());
    this.keys.right.forEach(key => key.destroy());
    this.keys.jump.forEach(key => key.destroy());
    
    console.log('🧹 Realistic player and cool hat cleaned up');
    
    super.destroy();
  }
} 