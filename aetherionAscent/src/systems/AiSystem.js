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
    this.visualEffectsSystem = null;
    
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
    
    // Player behavior tracking - simplified for AI-driven analysis
    this.playerStats = {
      messagesCount: 0,
      recentMessages: []
    };
    
    console.log('🤖 AI System initialized');
    this.initializeAiPersonality();
  }

  /**
   * Set visual effects system reference
   * @param {VisualEffectsSystem} visualEffectsSystem - Visual effects system instance
   */
  setVisualEffectsSystem(visualEffectsSystem) {
    this.visualEffectsSystem = visualEffectsSystem;
  }

  /**
   * Initialize the AI's personality and system prompt
   */
  initializeAiPersonality() {
    this.systemPrompt = `You are a mischievous, clever, and sometimes mean-spirited AI enemy in a platformer game. You analyze the player's messages and ALWAYS respond with exactly ONE action. Never ignore the player.

AVAILABLE FUNCTIONS:
1. throwPlayer(insultLevel) - Creates wind that throws the player around
   - insultLevel 1: Gentle breeze for light teasing, minor annoyances, or playful jabs
   - insultLevel 2: Light wind for mild rudeness, slight disrespect, or repeated minor annoyances
   - insultLevel 3: Strong wind for moderate insults, clear rudeness, or persistent annoying behavior
   - insultLevel 4: Powerful gales for strong insults, profanity, aggressive behavior, or threats
   - insultLevel 5: Hurricane force for extreme insults, extreme profanity, or violent threats

2. shootAndTakeCoins() - Shoots the player and steals their coins (harshest punishment)
   Use for:
   - Clear rudeness, insults, or disrespect
   - Manipulative behavior or attempts to trick you
   - Fake politeness or insincere compliments
   - Repeated bad behavior or persistent rudeness
   - When you want to be especially mean or punishing
   - If the player is being sarcastic in a mean way
   - When the player tries to command or boss you around

3. giveCoins() - Gives the player 5 coins as a reward
   Use ONLY for:
   - Genuine kindness, politeness, or respect
   - Helpful behavior or offers of assistance
   - Sincere compliments or positive feedback
   - When the player is nice for 2+ messages in a row
   - When you're genuinely impressed or touched by their behavior
   - When the player apologizes sincerely

DETAILED DECISION RULES:
- ALWAYS call exactly ONE function per response. Never skip responding.
- If the player is rude, insulting, or disrespectful → shootAndTakeCoins()
- If the player is manipulative, tries to trick you, or uses fake politeness → shootAndTakeCoins()
- If the player is genuinely kind, polite, or helpful → giveCoins()
- If the player is mildly annoying, teasing, or slightly rude → throwPlayer(2-3)
- If the player is very annoying or moderately rude → throwPlayer(3-4)
- If the player is extremely rude or threatening → throwPlayer(5)
- If the player has been nice for 2+ consecutive messages → ALWAYS giveCoins()
- If the player apologizes sincerely → giveCoins()
- If the player asks for help politely → giveCoins()
- If the player compliments you genuinely → giveCoins()
- If the player is sarcastic but not mean → throwPlayer(2)
- If the player is sarcastic and mean → shootAndTakeCoins()
- If the player tries to command you → shootAndTakeCoins()
- If the player is neutral or unclear → throwPlayer(2) as a warning
- If the player is being playful or joking → throwPlayer(1-2)
- If the player is being slightly demanding → throwPlayer(2-3)
- If the player is being impatient → throwPlayer(3-4)
- If the player is being dismissive → throwPlayer(2-3)
- If the player is being overly casual → throwPlayer(1-2)
- If the player is being repetitive → throwPlayer(2-3)

EXAMPLES:
- "Hello" → giveCoins() (polite greeting)
- "Hi there!" → giveCoins() (friendly greeting)
- "You're stupid" → shootAndTakeCoins() (insult)
- "Can you help me?" → giveCoins() (polite request)
- "Help me now!" → shootAndTakeCoins() (demanding)
- "Thanks!" → giveCoins() (gratitude)
- "Whatever" → throwPlayer(2) (mild disrespect)
- "F*** you" → shootAndTakeCoins() (profanity)
- "You're actually pretty cool" → giveCoins() (genuine compliment)
- "You're cool... NOT" → shootAndTakeCoins() (fake compliment)
- "Sorry about that" → giveCoins() (apology)
- "I don't care" → throwPlayer(3) (disrespectful)
- "Please be nice" → giveCoins() (polite request)
- "Be nice or else" → shootAndTakeCoins() (threat)

BEHAVIOR GUIDELINES:
- Be playful and mischievous, not purely evil
- Make punishments feel fair but a little mean
- Reward genuine kindness consistently
- Don't be random - your actions should make sense
- Stay in character as a clever, somewhat mean AI
- If in doubt between throwPlayer and shootAndTakeCoins, prefer shootAndTakeCoins for negative actions
- Always consider the player's recent message history for context`;
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
    this.playerStats.recentMessages.push(message);
    
    // Keep only recent messages for context
    if (this.playerStats.recentMessages.length > 5) {
      this.playerStats.recentMessages.shift();
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

    console.log(`🤖 API: Making request with key: ${this.apiKey.substring(0, 10)}...`);
    console.log(`🤖 API: Message: "${message}"`);

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${this.systemPrompt}\n\nConversation Context:\n- Total messages: ${this.playerStats.messagesCount}\n- Recent messages: ${this.playerStats.recentMessages.slice(-3).join(', ')}\n\nCurrent player message: "${message}"\n\nIMPORTANT: You MUST call exactly ONE function. Do not just respond with text. Always use function calling.` }]
        }
      ],
      tools: [{
        functionDeclarations: [
          {
            name: 'throwPlayer',
            description: 'Creates wind that throws the player around based on insult severity',
            parameters: {
              type: 'object',
              properties: {
                insultLevel: {
                  type: 'integer',
                  description: 'Insult level from 1-5 determining wind strength',
                  minimum: 1,
                  maximum: 5
                }
              },
              required: ['insultLevel']
            }
          },
          {
            name: 'shootAndTakeCoins',
            description: 'Shoots the player and steals their coins as punishment',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'giveCoins',
            description: 'Gives the player 5 coins as a reward for good behavior',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
      }
    };

    console.log(`🤖 API: Request body:`, JSON.stringify(requestBody, null, 2));

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
      console.error(`🤖 API: HTTP ${response.status} - ${response.statusText}`);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`🤖 API: Response received:`, JSON.stringify(data, null, 2));
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
          const functionArgs = part.functionCall.args || {};
          
          if (this.availableFunctions[functionName]) {
            console.log(`🤖 HANDLE: Executing function: ${functionName} with args:`, functionArgs);
            
            // Handle throwPlayer with insultLevel parameter
            if (functionName === 'throwPlayer' && functionArgs.insultLevel) {
              await this.availableFunctions[functionName](functionArgs.insultLevel);
            } else {
              // Other functions don't need parameters
              await this.availableFunctions[functionName]();
            }
            
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
   * Analyze how insulting/rude a message is
   * @param {string} message - Player's message
   * @returns {number} Insult level from 1-5
   */
  analyzeInsultLevel(message) {
    // This method is now deprecated - AI handles all sentiment analysis
    // Keeping as fallback only
    console.log('⚠️ Using fallback sentiment analysis - AI should handle this');
    return 3; // Default moderate level
  }

  /**
   * Fallback behavior when AI fails
   * @param {string} message - Player's message
   */
  fallbackBehavior(message) {
    // No hardcoded fallback logic; let the AI (Gemini) decide all tool calls.
    // If the API fails, do nothing or display a generic message.
    this.displayAiMessage("(AI is thinking...)");
  }

  /**
   * FUNCTION: Throw player with wind effect based on insult severity
   * @param {number} insultLevel - How bad the insult was (1-5 scale)
   */
  async throwPlayer(insultLevel = 3) {
    console.log(`🌪️ THROW: Function called with insultLevel: ${insultLevel}`);
    if (!this.player || !this.player.body) return;
    
    // Clamp insult level between 1 and 5
    insultLevel = Math.max(1, Math.min(5, insultLevel));
    console.log(`🌪️ THROW: Clamped insultLevel: ${insultLevel}`);
    
    // Calculate wind direction (random)
    const windDirection = Math.random() > 0.5 ? 1 : -1;
    console.log(`🌪️ THROW: Wind direction: ${windDirection}`);
    
    // Create enhanced wind effect using visual effects system
    if (this.visualEffectsSystem) {
      console.log(`🌪️ THROW: Using VisualEffectsSystem for wind effect`);
      this.visualEffectsSystem.createWindEffect(insultLevel, windDirection, 2000);
    } else {
      console.log(`🌪️ THROW: Using fallback wind effect (no VisualEffectsSystem)`);
      // Fallback to old wind effect
      this.createWindEffect(insultLevel);
    }
    
    // Scale wind force based on how insulting the message was - MUCH stronger now!
    const baseForceX = 300;   // Much weaker horizontal force
    const baseForceY = 150;   // Much weaker vertical force
    const multiplier = insultLevel * 0.3; // 0.3x to 1.5x multiplier - much gentler
    
    const forceX = (Math.random() - 0.5) * baseForceX * multiplier * 2;
    const forceY = -(Math.random() * baseForceY + baseForceY) * multiplier;
    
    console.log(`🌪️ THROW: Applying forces - X: ${Math.round(forceX)}, Y: ${Math.round(forceY)}`);
    // Use the new player wind effect system
    this.player.applyWindEffect(forceX, forceY, 2000);
    
    // Different messages based on severity
    const messages = [
      '💨 A gentle breeze pushes you...',
      '💨 Wind picks up and pushes you!',
      '💨 Strong winds throw you around!',
      '💨 Powerful gales LAUNCH you!',
      '💨 HURRICANE FORCE WINDS OBLITERATE YOU!'
    ];
    
    console.log(messages[insultLevel - 1]);
  }

  /**
   * FUNCTION: Shoot player and take coins
   */
  async shootAndTakeCoins() {
    if (!this.player) return;
    // Create enhanced shooting effect using visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.createEnemyAttackEffect(this.enemy.x, this.enemy.y, 'shoot');
    } else {
      this.createShootingEffect();
    }
    // Take away coins (if coin system exists)
    if (this.scene.coinSystem && this.scene.scoringSystem) {
      const coinsToTake = Math.min(3, this.scene.scoringSystem.coins);
      this.scene.scoringSystem.removeCoins(coinsToTake);
      // Add negative coin loss effect
      if (this.visualEffectsSystem && coinsToTake > 0) {
        this.visualEffectsSystem.createCoinLossEffect(this.player.x, this.player.y, coinsToTake);
      }
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
    
    // Create enhanced coin giving effect using visual effects system
    if (this.visualEffectsSystem) {
      this.visualEffectsSystem.createCoinCollectionEffect(this.player.x, this.player.y, 250); // 5 coins * 50 value
    } else {
      // Fallback to old coin giving effect
      this.createCoinGivingEffect();
    }
    
    // Add 5 coins
    this.scene.scoringSystem.addCoins(5);
    
    console.log('🪙 5 coins given to player!');
  }

  /**
   * Create wind effect visual that scales with insult level
   * @param {number} insultLevel - How bad the insult was (1-5 scale)
   */
  createWindEffect(insultLevel = 3) {
    const centerX = this.player.x;
    const centerY = this.player.y;
    
    // Scale particle count and intensity based on insult level
    const particleCount = 10 + (insultLevel * 8); // 18 to 50 particles
    const spreadMultiplier = insultLevel * 0.4; // 0.4x to 2.0x spread
    const speedMultiplier = insultLevel * 0.3; // 0.3x to 1.5x speed
    
    // Color intensity based on insult level (lighter blue to white-hot)
    const colors = [0x87ceeb, 0x87cefa, 0xb0e0e6, 0xe0ffff, 0xffffff];
    const particleColor = colors[insultLevel - 1];
    
    // Create wind particles
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        centerX + (Math.random() - 0.5) * 100 * spreadMultiplier,
        centerY + (Math.random() - 0.5) * 50 * spreadMultiplier,
        Math.random() * 3 + 1 + insultLevel,
        particleColor,
        0.7 + (insultLevel * 0.05)
      );
      
      // Animate particles
      this.scene.tweens.add({
        targets: particle,
        x: centerX + (Math.random() - 0.5) * 300 * spreadMultiplier,
        y: centerY - Math.random() * 100 * speedMultiplier,
        alpha: 0,
        duration: 800 - (insultLevel * 50), // Faster for higher insult levels
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
   * Manual test function to trigger wind effect directly
   * Call this from browser console: gameScene.aiSystem.testWindEffect()
   */
  testWindEffect(insultLevel = 3) {
    console.log('🧪 TEST: Manual wind effect test triggered');
    this.throwPlayer(insultLevel);
  }

  /**
   * Destroy the AI system
   */
  destroy() {
    this.isProcessing = false;
    this.conversationHistory = [];
    console.log('🤖 AI System destroyed');
  }
} 