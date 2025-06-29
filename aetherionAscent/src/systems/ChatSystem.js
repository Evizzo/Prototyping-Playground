/**
 * ChatSystem - Simple Chat Interface for AI Interaction
 * 
 * Provides a basic chat interface for players to communicate with the AI enemy.
 * Handles message display, input processing, and integration with AI system.
 * 
 * @author Me
 * @version 1.0.0
 */

export class ChatSystem {
  /**
   * Initialize the chat system
   * @param {Phaser.Scene} scene - The game scene
   * @param {AiSystem} aiSystem - Reference to AI system for message processing
   */
  constructor(scene, aiSystem = null) {
    this.scene = scene;
    this.aiSystem = aiSystem;
    this.player = null; // Will be set later for key capture control
    
    // Chat state
    this.isVisible = false;
    this.messages = [];
    this.maxMessages = 5;
    
    // UI elements
    this.chatContainer = null;
    this.chatInput = null;
    this.messageDisplay = null;
    this.toggleButton = null;
    
    // Styling
    this.chatStyles = {
      backgroundColor: 0x000000,
      backgroundAlpha: 0.8,
      textColor: '#ffffff',
      aiTextColor: '#ff6666',
      playerTextColor: '#66ff66',
      fontSize: '14px',
      fontFamily: 'monospace'
    };
    
    this.setupChatInterface();
    this.setupInputHandling();
    
    console.log('💬 Chat system initialized');
  }

  /**
   * Setup the chat interface UI
   */
  setupChatInterface() {
    // Create chat toggle button
    this.createToggleButton();
    
    // Create chat container (initially hidden)
    this.createChatContainer();
    
    // Create message display area
    this.createMessageDisplay();
    
    // Create text input
    this.createTextInput();
  }

  /**
   * Create chat toggle button
   */
  createToggleButton() {
    const buttonX = this.scene.cameras.main.width - 80;
    const buttonY = 50;
    
    // Button background
    this.toggleButton = this.scene.add.graphics();
    this.toggleButton.setScrollFactor(0);
    this.toggleButton.setDepth(200);
    
    this.toggleButton.fillStyle(0x333333, 0.9);
    this.toggleButton.fillRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
    
    this.toggleButton.lineStyle(2, 0x666666);
    this.toggleButton.strokeRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
    
    // Button text
    this.toggleButtonText = this.scene.add.text(buttonX, buttonY, 'CHAT', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center'
    });
    this.toggleButtonText.setOrigin(0.5, 0.5);
    this.toggleButtonText.setScrollFactor(0);
    this.toggleButtonText.setDepth(201);
    
    // Make button interactive
    this.toggleButton.setInteractive(
      new Phaser.Geom.Rectangle(buttonX - 35, buttonY - 15, 70, 30),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.toggleButton.on('pointerdown', () => {
      this.toggleChat();
    });
    
    this.toggleButton.on('pointerover', () => {
      this.toggleButton.clear();
      this.toggleButton.fillStyle(0x444444, 0.9);
      this.toggleButton.fillRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
      this.toggleButton.lineStyle(2, 0x888888);
      this.toggleButton.strokeRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
    });
    
    this.toggleButton.on('pointerout', () => {
      this.toggleButton.clear();
      this.toggleButton.fillStyle(0x333333, 0.9);
      this.toggleButton.fillRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
      this.toggleButton.lineStyle(2, 0x666666);
      this.toggleButton.strokeRoundedRect(buttonX - 35, buttonY - 15, 70, 30, 5);
    });
  }

  /**
   * Create chat container
   */
  createChatContainer() {
    const containerWidth = 400;
    const containerHeight = 200;
    const containerX = this.scene.cameras.main.width - containerWidth - 20;
    const containerY = 100;
    
    this.chatContainer = this.scene.add.graphics();
    this.chatContainer.setScrollFactor(0);
    this.chatContainer.setDepth(190);
    this.chatContainer.setVisible(false);
    
    // Background
    this.chatContainer.fillStyle(this.chatStyles.backgroundColor, this.chatStyles.backgroundAlpha);
    this.chatContainer.fillRoundedRect(containerX, containerY, containerWidth, containerHeight, 10);
    
    // Border
    this.chatContainer.lineStyle(2, 0x666666);
    this.chatContainer.strokeRoundedRect(containerX, containerY, containerWidth, containerHeight, 10);
    
    // Store container bounds for reference
    this.containerBounds = {
      x: containerX,
      y: containerY,
      width: containerWidth,
      height: containerHeight
    };
  }

  /**
   * Create message display area
   */
  createMessageDisplay() {
    this.messageTexts = [];
  }

  /**
   * Create text input element
   */
  createTextInput() {
    // Create HTML input element for better text input handling
    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Talk to the enemy...';
    this.chatInput.maxLength = 100;
    this.chatInput.style.position = 'absolute';
    this.chatInput.style.width = `${this.containerBounds.width - 20}px`;
    this.chatInput.style.height = '20px';
    this.chatInput.style.backgroundColor = '#222222';
    this.chatInput.style.color = '#ffffff';
    this.chatInput.style.border = '1px solid #666666';
    this.chatInput.style.borderRadius = '3px';
    this.chatInput.style.padding = '2px 5px';
    this.chatInput.style.fontSize = '12px';
    this.chatInput.style.fontFamily = 'monospace';
    this.chatInput.style.display = 'none';
    this.chatInput.style.zIndex = '1000';
    this.chatInput.style.outline = 'none'; // Remove default focus outline
    
    // Position will be updated dynamically in showChat()
    document.body.appendChild(this.chatInput);
  }

  /**
   * Setup input handling
   */
  setupInputHandling() {
    // Handle Enter key to send message
    this.chatInput.addEventListener('keydown', (event) => {
      // Prevent event from bubbling to Phaser
      event.stopPropagation();
      
      if (event.key === 'Enter') {
        event.preventDefault();
        this.sendMessage();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.hideChat();
      }
    });
    
    // Prevent all keyup events from bubbling to Phaser while chat is open
    this.chatInput.addEventListener('keyup', (event) => {
      event.stopPropagation();
    });
    
    // Prevent keypress events from bubbling to Phaser while chat is open
    this.chatInput.addEventListener('keypress', (event) => {
      event.stopPropagation();
    });
    
    // Handle focus events
    this.chatInput.addEventListener('focus', () => {
      console.log('💬 Chat input focused');
    });
    
    this.chatInput.addEventListener('blur', () => {
      console.log('💬 Chat input blurred');
    });
    
    // Handle chat toggle with 'T' key using native JavaScript (works even when Phaser keyboard is disabled)
    this.nativeKeyListener = (event) => {
      if (event.key.toLowerCase() === 't' && !this.isVisible) {
        // Only open chat if it's not already visible
        event.preventDefault();
        this.toggleChat();
      }
    };
    
    // Add native event listener to document
    document.addEventListener('keydown', this.nativeKeyListener);
  }

  /**
   * Toggle chat visibility
   */
  toggleChat() {
    if (this.isVisible) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }

  /**
   * Show chat interface
   */
  showChat() {
    this.isVisible = true;
    this.chatContainer.setVisible(true);
    
    // Position the HTML input relative to the game canvas
    this.updateInputPosition();
    
    this.chatInput.style.display = 'block';
    
    // Force focus with a small delay to ensure proper positioning
    setTimeout(() => {
      this.chatInput.focus();
      this.chatInput.select(); // Select all text to make it easier to type
    }, 10);
    
    this.updateMessageDisplay();
    
    // COMPLETELY disable Phaser's keyboard capture so ALL keys work in HTML input
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = false;
      console.log('🎮 Phaser keyboard capture COMPLETELY DISABLED for chat input');
    }
    
    // Also disable player key capture as backup
    if (this.player && this.player.setKeyCapture) {
      this.player.setKeyCapture(false);
      console.log('🎮 Player key capture DISABLED for chat input');
    }
    
    // Add instruction message if first time
    if (this.messages.length === 0) {
      this.addSystemMessage('You can now talk to the evil enemy. Be careful how you speak...');
    }
  }

  /**
   * Update HTML input position relative to game canvas
   */
  updateInputPosition() {
    // Get the game canvas element
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate the absolute position of the input relative to the page
    const inputX = canvasRect.left + this.containerBounds.x + 10;
    const inputY = canvasRect.top + this.containerBounds.y + this.containerBounds.height - 30;
    
    // Account for page scroll
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.chatInput.style.left = `${inputX + scrollX}px`;
    this.chatInput.style.top = `${inputY + scrollY}px`;
    
    console.log(`💬 Input positioned at: ${inputX + scrollX}, ${inputY + scrollY}`);
  }

  /**
   * Hide chat interface
   */
  hideChat() {
    this.isVisible = false;
    this.chatContainer.setVisible(false);
    this.chatInput.style.display = 'none';
    this.chatInput.blur();
    this.clearMessageDisplay();
    
    // Re-enable Phaser's keyboard capture when chat closes
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = true;
      console.log('🎮 Phaser keyboard capture COMPLETELY RE-ENABLED - chat closed');
    }
    
    // Re-enable player key capture when chat closes
    if (this.player && this.player.setKeyCapture) {
      this.player.setKeyCapture(true);
      console.log('🎮 Player key capture ENABLED - chat closed');
    }
  }

  /**
   * Send player message
   */
  sendMessage() {
    const message = this.chatInput.value.trim();
    console.log(`💬 SEND: Player sending message: "${message}"`);
    if (!message) {
      console.log(`💬 SEND: Empty message, skipping`);
      return;
    }
    
    // Add player message to display
    this.addPlayerMessage(message);
    
    // Send to AI system if available
    if (this.aiSystem) {
      console.log(`💬 SEND: AI system found, sending message`);
      this.aiSystem.processPlayerMessage(message);
    } else {
      console.error(`💬 SEND: No AI system found!`);
    }
    
    // Clear input
    this.chatInput.value = '';
    
    // Update display
    this.updateMessageDisplay();
  }

  /**
   * Add player message to chat
   * @param {string} message - Player's message
   */
  addPlayerMessage(message) {
    this.messages.push({
      type: 'player',
      text: `You: ${message}`,
      timestamp: Date.now()
    });
    
    this.trimMessages();
  }

  /**
   * Add AI message to chat
   * @param {string} message - AI's message
   */
  addAiMessage(message) {
    console.log(`💬 CHAT: Adding AI message: "${message}"`);
    this.messages.push({
      type: 'ai',
      text: `Enemy: ${message}`,
      timestamp: Date.now()
    });
    
    this.trimMessages();
    console.log(`💬 CHAT: Chat visible: ${this.isVisible}, total messages: ${this.messages.length}`);
    
    if (this.isVisible) {
      console.log(`💬 CHAT: Updating message display`);
      this.updateMessageDisplay();
    } else {
      console.log(`💬 CHAT: Chat not visible, message queued`);
    }
  }

  /**
   * Add system message to chat
   * @param {string} message - System message
   */
  addSystemMessage(message) {
    this.messages.push({
      type: 'system',
      text: message,
      timestamp: Date.now()
    });
    
    this.trimMessages();
    
    if (this.isVisible) {
      this.updateMessageDisplay();
    }
  }

  /**
   * Trim messages to max limit
   */
  trimMessages() {
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Update message display
   */
  updateMessageDisplay() {
    if (!this.isVisible) return;
    
    // Clear existing message texts
    this.clearMessageDisplay();
    
    // Create new message texts
    this.messages.forEach((message, index) => {
      const y = this.containerBounds.y + 15 + (index * 25);
      const color = this.getMessageColor(message.type);
      
      const messageText = this.scene.add.text(
        this.containerBounds.x + 10,
        y,
        message.text,
        {
          fontSize: this.chatStyles.fontSize,
          fontFamily: this.chatStyles.fontFamily,
          color: color,
          wordWrap: { width: this.containerBounds.width - 20 }
        }
      );
      
      messageText.setScrollFactor(0);
      messageText.setDepth(195);
      
      this.messageTexts.push(messageText);
    });
  }

  /**
   * Get color for message type
   * @param {string} type - Message type
   */
  getMessageColor(type) {
    switch (type) {
      case 'player':
        return this.chatStyles.playerTextColor;
      case 'ai':
        return this.chatStyles.aiTextColor;
      case 'system':
        return '#ffff66';
      default:
        return this.chatStyles.textColor;
    }
  }

  /**
   * Clear message display
   */
  clearMessageDisplay() {
    this.messageTexts.forEach(text => {
      if (text) {
        text.destroy();
      }
    });
    this.messageTexts = [];
  }

  /**
   * Update chat system
   */
  update() {
    // Update input position if chat is visible (handles window resize/scroll)
    if (this.isVisible) {
      this.updateInputPosition();
    }
  }

  /**
   * Set reference to AI system
   * @param {AiSystem} aiSystem - AI system instance
   */
  setAiSystem(aiSystem) {
    console.log(`💬 CHAT: setAiSystem called with:`, !!aiSystem);
    this.aiSystem = aiSystem;
    console.log(`💬 CHAT: AI system set, current system:`, !!this.aiSystem);
  }

  /**
   * Set reference to player for key capture control
   * @param {Player} player - Player instance
   */
  setPlayer(player) {
    this.player = player;
  }

  /**
   * Clean up chat system
   */
  destroy() {
    // Remove native keyboard event listener
    if (this.nativeKeyListener) {
      document.removeEventListener('keydown', this.nativeKeyListener);
    }
    
    // Re-enable Phaser keyboard if it was disabled
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.enabled = true;
    }
    
    // Remove HTML input element
    if (this.chatInput && this.chatInput.parentNode) {
      this.chatInput.parentNode.removeChild(this.chatInput);
    }
    
    // Clear message display
    this.clearMessageDisplay();
    
    // Destroy UI elements
    if (this.toggleButton) {
      this.toggleButton.destroy();
    }
    
    if (this.toggleButtonText) {
      this.toggleButtonText.destroy();
    }
    
    if (this.chatContainer) {
      this.chatContainer.destroy();
    }
    
    this.messages = [];
    
    console.log('💬 Chat system destroyed');
  }
} 