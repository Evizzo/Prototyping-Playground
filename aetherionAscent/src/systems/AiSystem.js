/**
 * AiSystem - Google Gemini 2.5 Flash AI Integration for Enemy Control
 * 
 * This system handles:
 * - Google Gemini API integration with function calling
 * - Player sentiment analysis for determining AI behavior
 * - Function execution for enemy abilities
 * - Chat interface management
 * 
 * @author Me
 * @version 1.0.0
 */

export class AiSystem {
  /**
   * Initialize the AI system
   * @param {Phaser.Scene} scene - The game scene
   * @param {Enemy} enemy - The enemy entity to control
   * @param {Player} player - The player entity for targeting
   */
  constructor(scene, enemy, player) {
    this.scene = scene;
    this.enemy = enemy;
    this.player = player;
    
    // API Configuration
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    // AI State
    this.isProcessing = false;
    this.lastPlayerMessage = '';
    this.conversationHistory = [];
    this.lastActionTime = 0;
    
    // Function calling setup
    this.availableFunctions = {
      throwPlayer: this.throwPlayer.bind(this),
      shootAndTakeCoins: this.shootAndTakeCoins.bind(this),
      giveCoins: this.giveCoins.bind(this)
    };
    
    // Player behavior tracking
    this.playerStats = {
      messagesCount: 0,
      politenessScore: 0,
      suspiciousBehavior: 0,
      recentMessages: []
    };
    
    console.log('🤖 AI System initialized');
    this.initializeAiPersonality();
  }

  /**
   * Initialize the AI's personality and system prompt
   */
  initializeAiPersonality() {
    this.systemPrompt = `You are a mildly evil but not demonic entity controlling an enemy in a platformer game. You can interact with the player through three functions:

1. throwPlayer() - Creates a wind effect that throws the player randomly
2. shootAndTakeCoins() - Shoots at the player and takes some of their coins  
3. giveCoins() - Gives the player 5 coins as a reward

BEHAVIOR RULES:
- If the player is genuinely nice (not fake), occasionally give them coins
- If the player is suspiciously overly nice, fake, rude, or says something inappropriate, use throwPlayer or shootAndTakeCoins
- Be somewhat evil but playful, not cruel
- Respond briefly and stay in character
- Don't be easily fooled by obvious fake politeness
- Look for genuine kindness vs manipulation

You should call ONE function per response based on the player's message. Respond with a brief evil but playful comment along with your function call.`;
  }

  /**
   * Process player message and determine AI response
   * @param {string} message - Player's message
   */
  async processPlayerMessage(message) {
    console.log(`🤖 PROCESS: Starting to process message: "${message}"`);
    console.log(`🤖 PROCESS: Current state - isProcessing: ${this.isProcessing}`);
    
    if (this.isProcessing) {
      console.log(`🤖 PROCESS: BLOCKED - currently processing another message`);
      return;
    }

    console.log(`🤖 PROCESS: Setting processing state to true`);
    this.isProcessing = true;
    
    try {
      // Update player stats
      this.updatePlayerStats(message);
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message
      });
      
      // Keep conversation history manageable
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }
      
      // Call Gemini API
      console.log(`🤖 PROCESS: About to call Gemini API...`);
      const response = await this.callGeminiApi(message);
      console.log(`🤖 PROCESS: API response received:`, !!response);
      
      if (response) {
        console.log(`🤖 PROCESS: Valid response received, handling...`);
        await this.handleAiResponse(response);
        console.log(`🤖 PROCESS: Response handling completed`);
      } else {
        console.log(`🤖 PROCESS: No response received, using fallback...`);
        this.fallbackBehavior(message);
      }
      
    } catch (error) {
      console.error('🤖 AI Error:', error);
      // Fallback behavior
      console.log(`🤖 PROCESS: Error occurred, using fallback for: "${message}"`);
      this.fallbackBehavior(message);
    } finally {
      console.log(`🤖 PROCESS: Setting processing state to false`);
      this.isProcessing = false;
    }
  }

  /**
   * Update player behavior statistics
   * @param {string} message - Player's message
   */
  updatePlayerStats(message) {
    this.playerStats.messagesCount++;
    this.playerStats.recentMessages.push(message.toLowerCase());
    
    // Keep only recent messages
    if (this.playerStats.recentMessages.length > 5) {
      this.playerStats.recentMessages.shift();
    }
    
    // Simple sentiment analysis
    const politeWords = ['please', 'thank', 'sorry', 'excuse', 'kind', 'nice', 'good', 'great', 'awesome', 'cool'];
    const rudeWords = ['stupid', 'dumb', 'idiot', 'hate', 'suck', 'bad', 'terrible', 'awful', 'worst'];
    const suspiciousWords = ['pretty please', 'super nice', 'amazing wonderful', 'best ever'];
    
    const lowerMessage = message.toLowerCase();
    
    // Check for politeness
    politeWords.forEach(word => {
      if (lowerMessage.includes(word)) {
        this.playerStats.politenessScore += 1;
      }
    });
    
    // Check for rudeness
    rudeWords.forEach(word => {
      if (lowerMessage.includes(word)) {
        this.playerStats.politenessScore -= 2;
      }
    });
    
    // Check for suspicious over-politeness
    suspiciousWords.forEach(phrase => {
      if (lowerMessage.includes(phrase)) {
        this.playerStats.suspiciousBehavior += 2;
      }
    });
    
    // Excessive exclamation marks or caps
    if (message.includes('!!!') || message === message.toUpperCase()) {
      this.playerStats.suspiciousBehavior += 1;
    }
  }

  /**
   * Call Google Gemini API with function calling
   * @param {string} message - Player's message
   */
  async callGeminiApi(message) {
    if (!this.apiKey || this.apiKey === 'your_google_api_key_here') {
      console.warn('🤖 No valid Google API key found');
      return null;
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${this.systemPrompt}\n\nPlayer stats: politeness=${this.playerStats.politenessScore}, suspicious=${this.playerStats.suspiciousBehavior}, messages=${this.playerStats.messagesCount}\n\nPlayer message: "${message}"` }]
        }
      ],
      tools: [{
        functionDeclarations: [
          {
            name: 'throwPlayer',
            description: 'Throw the player randomly with a wind effect',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'shootAndTakeCoins',
            description: 'Shoot at the player and take some of their coins',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'giveCoins',
            description: 'Give the player 5 coins as a reward',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150
      }
    };

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Details:', errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Handle AI response and execute functions
   * @param {Object} response - Gemini API response
   */
  async handleAiResponse(response) {
    console.log(`🤖 HANDLE: Processing AI response:`, response);
    
    const candidate = response.candidates?.[0];
    if (!candidate) {
      console.log(`🤖 HANDLE: No candidate found in response`);
      return;
    }

    let aiMessage = '';
    let functionCalled = false;

    // Handle function calls
    if (candidate.content?.parts) {
      console.log(`🤖 HANDLE: Found ${candidate.content.parts.length} parts in response`);
      for (const part of candidate.content.parts) {
        if (part.text) {
          console.log(`🤖 HANDLE: Found text part: "${part.text}"`);
          aiMessage += part.text;
        }
        
        if (part.functionCall) {
          console.log(`🤖 HANDLE: Found function call:`, part.functionCall);
          const functionName = part.functionCall.name;
          if (this.availableFunctions[functionName]) {
            console.log(`🤖 HANDLE: Executing function: ${functionName}`);
            await this.availableFunctions[functionName]();
            functionCalled = true;
            console.log(`🤖 AI called function: ${functionName}`);
          } else {
            console.log(`🤖 HANDLE: Unknown function: ${functionName}`);
          }
        }
      }
    } else {
      console.log(`🤖 HANDLE: No parts found in candidate content`);
    }

    // Add AI response to history
    if (aiMessage) {
      console.log(`🤖 HANDLE: Adding AI message to history and display: "${aiMessage}"`);
      this.conversationHistory.push({
        role: 'assistant',
        content: aiMessage
      });
      
      // Display AI message to player
      this.displayAiMessage(aiMessage);
    } else {
      console.log(`🤖 HANDLE: No AI message to display`);
    }

    // If no function was called, use fallback behavior
    if (!functionCalled) {
      console.log(`🤖 HANDLE: No function called, using fallback behavior`);
      this.fallbackBehavior(this.conversationHistory[this.conversationHistory.length - 2]?.content || '');
    } else {
      console.log(`🤖 HANDLE: Function was called, skipping fallback`);
    }
  }

  /**
   * Fallback behavior when AI fails
   * @param {string} message - Player's message
   */
  fallbackBehavior(message) {
    const lowerMessage = message.toLowerCase();
    
    // Simple rule-based fallback
    if (this.playerStats.politenessScore > 3 && this.playerStats.suspiciousBehavior < 2) {
      this.giveCoins();
      this.displayAiMessage("Your genuine kindness is... noted. Here, take these coins.");
    } else if (this.playerStats.suspiciousBehavior > 2 || this.playerStats.politenessScore < -1) {
      const action = Math.random() > 0.5 ? this.throwPlayer.bind(this) : this.shootAndTakeCoins.bind(this);
      action();
      this.displayAiMessage("Your insincerity displeases me...");
    } else {
      // Neutral response
      if (Math.random() > 0.7) {
        this.giveCoins();
        this.displayAiMessage("Perhaps you deserve a small reward...");
      } else {
        this.displayAiMessage("Hmm... I'll spare you for now, mortal.");
      }
    }
  }

  /**
   * FUNCTION: Throw player with wind effect
   */
  async throwPlayer() {
    if (!this.player || !this.player.body) return;
    
    // Create wind effect visual
    this.createWindEffect();
    
    // Apply random force to player
    const forceX = (Math.random() - 0.5) * 600; // Random horizontal force
    const forceY = -Math.random() * 200 - 100;   // Upward force
    
    this.player.body.setVelocity(forceX, forceY);
    
    // Screen shake effect
    this.scene.cameras.main.shake(300, 0.02);
    
    console.log('💨 Player thrown by wind!');
  }

  /**
   * FUNCTION: Shoot player and take coins
   */
  async shootAndTakeCoins() {
    if (!this.player) return;
    
    // Create shooting effect
    this.createShootingEffect();
    
    // Take away coins (if coin system exists)
    if (this.scene.coinSystem && this.scene.scoringSystem) {
      const coinsToTake = Math.min(3, this.scene.scoringSystem.coins);
      this.scene.scoringSystem.removeCoins(coinsToTake);
    }
    
    // Small knockback
    if (this.player.body) {
      const knockbackX = this.player.x > this.enemy.x ? 150 : -150;
      this.player.body.setVelocityX(this.player.body.velocity.x + knockbackX);
    }
    
    console.log('💥 Player shot and coins taken!');
  }

  /**
   * FUNCTION: Give coins to player
   */
  async giveCoins() {
    if (!this.scene.scoringSystem) return;
    
    // Create coin giving effect
    this.createCoinGivingEffect();
    
    // Add 5 coins
    this.scene.scoringSystem.addCoins(5);
    
    console.log('🪙 5 coins given to player!');
  }

  /**
   * Create wind effect visual
   */
  createWindEffect() {
    const centerX = this.player.x;
    const centerY = this.player.y;
    
    // Create wind particles
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(
        centerX + (Math.random() - 0.5) * 100,
        centerY + (Math.random() - 0.5) * 50,
        Math.random() * 3 + 1,
        0x87ceeb,
        0.7
      );
      
      // Animate particles
      this.scene.tweens.add({
        targets: particle,
        x: centerX + (Math.random() - 0.5) * 300,
        y: centerY - Math.random() * 100,
        alpha: 0,
        duration: 800,
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * Create shooting effect visual
   */
  createShootingEffect() {
    if (!this.enemy || !this.player) return;
    
    // Create projectile
    const projectile = this.scene.add.circle(this.enemy.x, this.enemy.y - 10, 4, 0xff4444);
    
    // Animate projectile to player
    this.scene.tweens.add({
      targets: projectile,
      x: this.player.x,
      y: this.player.y,
      duration: 300,
      onComplete: () => {
        // Impact effect
        this.createImpactEffect(this.player.x, this.player.y);
        projectile.destroy();
      }
    });
  }

  /**
   * Create coin giving effect visual  
   */
  createCoinGivingEffect() {
    if (!this.enemy) return;
    
    // Create floating coins
    for (let i = 0; i < 5; i++) {
      const coin = this.scene.add.circle(
        this.enemy.x + (Math.random() - 0.5) * 30,
        this.enemy.y - 20,
        6,
        0xffd700
      );
      
      // Animate coins to player
      this.scene.tweens.add({
        targets: coin,
        x: this.player.x + (Math.random() - 0.5) * 40,
        y: this.player.y - 30,
        duration: 600,
        delay: i * 100,
        ease: 'Back.easeOut',
        onComplete: () => coin.destroy()
      });
    }
  }

  /**
   * Create impact effect
   */
  createImpactEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.circle(x, y, 2, 0xff8844);
      
      this.scene.tweens.add({
        targets: spark,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        alpha: 0,
        duration: 400,
        onComplete: () => spark.destroy()
      });
    }
  }

  /**
   * Display AI message to player
   */
  displayAiMessage(message) {
    if (this.scene.chatSystem) {
      this.scene.chatSystem.addAiMessage(message);
    }
  }

  /**
   * Update AI system
   */
  update(deltaTime) {
    // AI system ready for updates
    // (Cooldown system removed - AI responds immediately)
  }

  /**
   * Clean up AI system
   */
  destroy() {
    this.conversationHistory = [];
    this.playerStats = null;
    console.log('🤖 AI System destroyed');
  }
} 