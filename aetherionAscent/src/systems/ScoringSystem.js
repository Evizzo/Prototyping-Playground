import { CONFIG } from '../config/gameConfig.js';

/**
 * ScoringSystem - Centralized Scoring and Progress Tracking
 * 
 * Manages all scoring mechanics for Aetherion Ascent:
 * - Height-based scoring (Icy Tower style)
 * - Coin collection tracking
 * - Score multipliers and bonuses
 * - Display updates and formatting
 * 
 * All scoring logic is contained in this single system for easy maintenance
 * and balancing. No scoring calculations should exist outside this class.
 * 
 * @author Me
 * @version 1.0.0
 */
export class ScoringSystem {
  /**
   * Initialize the scoring system
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;
    
    // Core scoring data
    this.stats = {
      // Height tracking (Icy Tower style)
      currentHeight: 0,
      maxHeight: 0,
      startingY: 0,
      heightScore: 0,
      
      // Coin collection
      coinsCollected: 0,
      coinScore: 0,
      
      // Total score
      totalScore: 0,
      
      // Progression tracking
      platformsReached: 0,
      highestPlatform: 0
    };
    
    // Score display references
    this.displayElements = {
      heightText: null,
      scoreText: null,
      coinText: null
    };
    
    // Score configuration
    this.config = {
      heightScoreMultiplier: CONFIG.SCORING.HEIGHT_SCORE_MULTIPLIER,
      coinValue: CONFIG.SCORING.COIN_VALUE,
      heightDivisor: CONFIG.SCORING.HEIGHT_DIVISOR
    };
    
    console.log('💰 Scoring system initialized');
  }

  /**
   * Initialize scoring display elements
   */
  createScoreDisplay() {
    console.log('🎯 Creating score display...');
    
    // Height display
    this.displayElements.heightText = this.scene.add.text(20, 20, 'HEIGHT: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#64ffda',
      backgroundColor: 'rgba(26, 26, 46, 0.7)',
      padding: { x: 10, y: 5 }
    });
    this.displayElements.heightText.setDepth(1000);
    this.displayElements.heightText.setScrollFactor(0);
    
    // Coin display
    this.displayElements.coinText = this.scene.add.text(20, 60, 'COINS: 0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fill: '#ffd700',
      backgroundColor: 'rgba(26, 26, 46, 0.7)',
      padding: { x: 10, y: 5 }
    });
    this.displayElements.coinText.setDepth(1000);
    this.displayElements.coinText.setScrollFactor(0);
    
    // Total score display
    this.displayElements.scoreText = this.scene.add.text(20, 100, 'SCORE: 0', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fill: '#ffffff',
      backgroundColor: 'rgba(26, 26, 46, 0.7)',
      padding: { x: 10, y: 5 }
    });
    this.displayElements.scoreText.setDepth(1000);
    this.displayElements.scoreText.setScrollFactor(0);
    
    console.log('✅ Score display created');
  }

  /**
   * Set the starting position for height calculations
   * @param {number} startY - Starting Y position
   */
  setStartingPosition(startY) {
    this.stats.startingY = startY;
    console.log(`🏁 Starting position set: Y=${startY}`);
  }

  /**
   * Update height-based scoring
   * @param {number} currentY - Current player Y position
   */
  updateHeightScore(currentY) {
    // Calculate current height (negative Y means higher up)
    this.stats.currentHeight = Math.max(0, this.stats.startingY - currentY);
    
    // Track maximum height reached
    if (this.stats.currentHeight > this.stats.maxHeight) {
      this.stats.maxHeight = this.stats.currentHeight;
      
      // Calculate height score
      this.stats.heightScore = Math.floor(this.stats.maxHeight / this.config.heightDivisor) * this.config.heightScoreMultiplier;
      
      // Update total score
      this.calculateTotalScore();
    }
  }

  /**
   * Award points for coin collection
   * @param {number} coinValue - Optional custom coin value (defaults to config)
   */
  collectCoin(coinValue = this.config.coinValue) {
    this.stats.coinsCollected++;
    this.stats.coinScore += coinValue;
    
    // Update total score
    this.calculateTotalScore();
    
    console.log(`🪙 Coin collected! Total: ${this.stats.coinsCollected}, Coin Score: ${this.stats.coinScore}`);
    
    // Return the collected coin value for effects/feedback
    return coinValue;
  }

  /**
   * Calculate and update total score
   */
  calculateTotalScore() {
    this.stats.totalScore = this.stats.heightScore + this.stats.coinScore;
    this.updateScoreDisplay();
  }

  /**
   * Update all score display elements
   */
  updateScoreDisplay() {
    if (this.displayElements.heightText) {
      this.displayElements.heightText.setText(`HEIGHT: ${Math.round(this.stats.currentHeight)}`);
    }
    
    if (this.displayElements.coinText) {
      this.displayElements.coinText.setText(`COINS: ${this.stats.coinsCollected}`);
    }
    
    if (this.displayElements.scoreText) {
      this.displayElements.scoreText.setText(`SCORE: ${this.stats.totalScore}`);
    }
  }

  /**
   * Get current scoring statistics
   * @returns {object} Current scoring data
   */
  getStats() {
    return {
      ...this.stats,
      // Calculated values
      heightPercentage: this.stats.startingY > 0 ? (this.stats.currentHeight / this.stats.startingY) * 100 : 0,
      averageCoinsPerHeight: this.stats.currentHeight > 0 ? (this.stats.coinsCollected / this.stats.currentHeight) * 100 : 0
    };
  }

  /**
   * Get formatted score breakdown for debug display
   * @returns {string} Formatted score information
   */
  getScoreBreakdown() {
    return [
      `Height Score: ${this.stats.heightScore}`,
      `Coin Score: ${this.stats.coinScore}`,
      `Total Score: ${this.stats.totalScore}`,
      `Coins: ${this.stats.coinsCollected}`,
      `Max Height: ${Math.round(this.stats.maxHeight)}`
    ].join('\n');
  }

  /**
   * Reset all scoring data (for game restart)
   */
  reset() {
    this.stats = {
      currentHeight: 0,
      maxHeight: 0,
      startingY: 0,
      heightScore: 0,
      coinsCollected: 0,
      coinScore: 0,
      totalScore: 0,
      platformsReached: 0,
      highestPlatform: 0
    };
    
    this.updateScoreDisplay();
    console.log('🔄 Scoring system reset');
  }

  /**
   * Clean up score display elements
   */
  destroy() {
    Object.values(this.displayElements).forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    
    console.log('🗑️ Scoring system destroyed');
  }
} 