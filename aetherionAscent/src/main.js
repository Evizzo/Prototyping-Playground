import Phaser from 'phaser';
import { CONFIG } from './config/gameConfig.js';
import { GameScene } from './scenes/GameScene.js';

/**
 * Aetherion Ascent - Main Entry Point
 * 
 * Initializes Phaser game engine with:
 * - WebGL renderer for advanced effects
 * - Light2D pipeline for dynamic lighting
 * - Post-processing pipeline setup
 * - Optimized physics configuration
 * 
 * @author Me
 * @version 1.0.0
 */

/**
 * Main Phaser game configuration
 * Configured for maximum visual quality and performance
 */
const gameConfig = {
  type: Phaser.WEBGL, // Required for Light2D and shaders
  width: CONFIG.GAME.WIDTH,
  height: CONFIG.GAME.HEIGHT,
  backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
  
  // Pixel-perfect rendering for crisp visuals
  pixelArt: false,
  antialias: true,
  
  // Physics configuration optimized for platformer
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: CONFIG.WORLD.GRAVITY },
      debug: true, // Debug enabled - shows collision wireframes
      checkCollision: {
        up: true,
        down: true,
        left: true,
        right: true
      }
    }
  },
  
  // Renderer settings for advanced effects
  render: {
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    roundPixels: false, // Keep false for smooth movement
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    desynchronized: true,
    failIfMajorPerformanceCaveat: false
  },
  
  // Audio settings
  audio: {
    disableWebAudio: false,
    context: false,
    noAudio: false
  },
  
  // Scene configuration
  scene: [GameScene],
  
  // Additional WebGL settings
  webgl: {
    powerPreference: 'high-performance'
  },
  
  // Auto-focus for immediate input responsiveness
  autoFocus: true,
  
  // Parent container
  parent: document.body,
  
  // Performance monitoring
  fps: {
    target: CONFIG.PERFORMANCE.TARGET_FPS,
    forceSetTimeOut: false
  }
};

/**
 * Initialize the game
 * Includes error handling and loading state management
 */
function initializeGame() {
  try {
    // Hide loading screen
    const loadingElement = document.getElementById('loading');
    
    // Create Phaser game instance
    const game = new Phaser.Game(gameConfig);
    
    // Global game reference for debugging
    window.game = game;
    
    // Handle game ready
    game.events.once('ready', () => {
      console.log('🎮 Aetherion Ascent initialized successfully');
      console.log('📊 WebGL Support:', game.renderer.type === Phaser.WEBGL);
      console.log('💡 Light2D Support:', game.renderer.pipelines.has('Light2D'));
      
      // Hide loading screen with smooth transition
      if (loadingElement) {
        loadingElement.style.transition = 'opacity 0.5s ease-out';
        loadingElement.style.opacity = '0';
        setTimeout(() => {
          loadingElement.remove();
        }, 500);
      }
    });
    
    // Handle potential errors
    game.events.on('destroy', () => {
      console.log('🎮 Game destroyed');
    });
    
    // Performance monitoring in development
    if (import.meta.env.DEV) {
      setupPerformanceMonitoring(game);
    }
    
    return game;
    
  } catch (error) {
    console.error('❌ Failed to initialize Aetherion Ascent:', error);
    showErrorMessage(error);
  }
}

/**
 * Setup performance monitoring for development
 * @param {Phaser.Game} game - The Phaser game instance
 */
function setupPerformanceMonitoring(game) {
  let frameCount = 0;
  let lastTime = performance.now();
  
  game.events.on('step', () => {
    frameCount++;
    
    if (frameCount % 60 === 0) { // Log every 60 frames
      const currentTime = performance.now();
      const fps = 60000 / (currentTime - lastTime);
      
      if (fps < CONFIG.PERFORMANCE.TARGET_FPS * 0.9) {
        console.warn(`⚡ Performance Warning: FPS ${fps.toFixed(1)} (target: ${CONFIG.PERFORMANCE.TARGET_FPS})`);
      }
      
      lastTime = currentTime;
    }
  });
}

/**
 * Show error message to user
 * @param {Error} error - The error that occurred
 */
function showErrorMessage(error) {
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a2e;
    border: 2px solid #ff6b6b;
    border-radius: 8px;
    padding: 20px;
    color: #ffffff;
    font-family: Arial, sans-serif;
    text-align: center;
    z-index: 9999;
    max-width: 400px;
  `;
  
  errorContainer.innerHTML = `
    <h3 style="color: #ff6b6b; margin-top: 0;">🚫 Failed to Start Game</h3>
    <p>Unable to initialize Aetherion Ascent.</p>
    <details style="margin-top: 15px; text-align: left;">
      <summary style="cursor: pointer; color: #64ffda;">Technical Details</summary>
      <pre style="font-size: 12px; margin-top: 10px; overflow: auto;">${error.message}</pre>
    </details>
    <p style="margin-bottom: 0; font-size: 12px; opacity: 0.8;">
      Please ensure your browser supports WebGL and try refreshing the page.
    </p>
  `;
  
  document.body.appendChild(errorContainer);
}

/**
 * WebGL support detection
 * Provides fallback for unsupported browsers
 */
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Main initialization
 * Checks system requirements before starting
 */
function main() {
  // Check WebGL support
  if (!checkWebGLSupport()) {
    showErrorMessage(new Error('WebGL not supported. Please use a modern browser.'));
    return;
  }
  
  // Initialize game when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
  } else {
    initializeGame();
  }
}

// Start the application
main(); 