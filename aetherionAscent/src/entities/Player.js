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
   */
  constructor(scene, x, y) {
    // Create player sprite (we'll use a simple colored rectangle for now)
    super(scene, x, y, 'player');
    
    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Store scene reference
    this.scene = scene;
    
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
    
    // Input handling
    this.keys = {
      left: [scene.input.keyboard.addKey('A'), scene.input.keyboard.addKey('LEFT')],
      right: [scene.input.keyboard.addKey('D'), scene.input.keyboard.addKey('RIGHT')],
      jump: [scene.input.keyboard.addKey('SPACE'), scene.input.keyboard.addKey('W'), scene.input.keyboard.addKey('UP')]
    };
    
    // Visual and lighting setup
    this.setupPlayerVisuals();
    this.setupPlayerLight();
    this.setupPlayerPhysics();
    
    // Performance tracking
    this.lastGroundedTime = 0;
    this.coyoteTime = 200; // ms of grace period for jumping after leaving ground - increased for easier gameplay
    
    console.log('🦸 Player character created and ready for action!');
  }

  /**
   * Setup player visual appearance
   */
  setupPlayerVisuals() {
    // Set player size and visual properties
    this.setDisplaySize(24, 32);
    this.setTint(CONFIG.LIGHTING.PLAYER_LIGHT_COLOR);
    
    // Set render depth to appear above most objects
    this.setDepth(50);
    
    // Add subtle glow effect (we'll enhance this later)
    this.setAlpha(0.9);
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
    // Update player state
    this.updateGroundedState();
    this.updateWallInteraction();
    
    // Handle input
    this.handleMovementInput(deltaTime);
    this.handleJumpInput();
    
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
    // Check input states
    const leftPressed = this.keys.left.some(key => key.isDown);
    const rightPressed = this.keys.right.some(key => key.isDown);
    
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
    const jumpPressed = this.keys.jump.some(key => Phaser.Input.Keyboard.JustDown(key));
    
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
    
    // Visual/audio feedback would go here
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
    
    console.log(`🧗 Wall jump! Direction: ${jumpDirection > 0 ? 'Right' : 'Left'}`);
  }

  /**
   * Handle landing effects
   */
  onLanding() {
    // Landing visual effects could go here
    // For now, just log the landing
    const impactSpeed = Math.abs(this.body.velocity.y);
    if (impactSpeed > 200) {
      console.log(`💥 Heavy landing! Impact speed: ${Math.round(impactSpeed)}`);
      // Could trigger screen shake or particle effects here
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
    // Tilt player slightly based on horizontal movement for dynamic feel
    const speedRatio = this.body.velocity.x / this.playerState.maxHorizontalSpeed;
    this.rotation = speedRatio * 0.1; // Subtle tilt
    
    // Adjust alpha based on wall sliding
    if (this.playerState.isTouchingWall && !this.playerState.isGrounded) {
      this.setAlpha(0.7); // Slightly transparent when wall sliding
    } else {
      this.setAlpha(0.9); // Normal transparency
    }
  }

  /**
   * Update facing direction for future animation system
   */
  updateFacingDirection() {
    if (this.body.velocity.x > 10) {
      this.playerState.facingDirection = 1;
      this.setFlipX(false);
    } else if (this.body.velocity.x < -10) {
      this.playerState.facingDirection = -1;
      this.setFlipX(true);
    }
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
    
    // Clean up input handlers
    this.keys.left.forEach(key => key.destroy());
    this.keys.right.forEach(key => key.destroy());
    this.keys.jump.forEach(key => key.destroy());
    
    console.log('🧹 Player cleaned up');
    
    super.destroy();
  }
} 