# �� Aetherion Ascent

**You vs AI Agent** - A platformer where you chat with an AI enemy that rewards kindness and punishes rudeness in real-time.

## 🎮 **What is this?**

Jump, climb, and collect coins while chatting with an AI agent that analyzes your messages and responds with actions:

- **Be nice** → Get coins and rewards
- **Be rude** → Get thrown around by wind or shot
- **Be manipulative** → Get punished harder

## 🤖 **AI Agent Behavior**

The AI enemy uses Google Gemini to analyze your messages and respond with:

### **Rewards (Be Nice)**
- "Hello" → 🎁 Coins
- "Can you help me?" → 🎁 Coins  
- "Thanks!" → 🎁 Coins
- Sincere compliments → 🎁 Coins

### **Punishments (Be Rude)**
- "You're stupid" → 💥 Shot & coins stolen
- "Whatever" → 🌪️ Wind throws you around
- "Help me now!" → 💥 Shot & coins stolen
- Profanity → 💥 Shot & coins stolen

## 🎯 **How to Play**

1. **Move**: Arrow keys or WASD
2. **Jump**: Spacebar
3. **Chat**: Press Enter to talk to the AI
4. **Climb**: Jump between platforms to go higher
5. **Collect**: Grab coins for points

## 🚀 **Quick Start**

```bash
npm install
echo "VITE_GOOGLE_API_KEY=your_api_key" > .env
npm run dev
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🎨 **Features**

- **Real-time AI chat** with sentiment analysis
- **Dynamic responses** based on your behavior
- **Visual effects** for all AI actions
- **Infinite platformer** gameplay
- **Wind physics** when AI throws you around

---

**The AI is watching. Choose your words wisely.** 🎮✨
