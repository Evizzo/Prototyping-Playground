### 🚀 **Getting Started**

#### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Modern browser** with WebGL support

#### Installation
```bash
# Clone or download the project
cd aetherion-ascent

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Development Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

### 🎮 **Controls (Phase 1)**
- **F1**: Toggle debug information display
- **Mouse/Touch**: Interactive camera observation

### 🔧 **Configuration**

All game parameters are centralized in `src/config/gameConfig.js`:

- **World Physics**: Gravity, void speed, platform spacing
- **Lighting**: Colors, intensities, flicker rates
- **Post-Processing**: Bloom strength, vignette size, distortion
- **Performance**: Particle limits, culling distances
- **Visual Theme**: Colors, particle effects, gradients

### 🛠️ **Technical Stack**

- **Engine**: Phaser 3.80.1
- **Renderer**: WebGL with Light2D pipeline
- **Build Tool**: Vite 5.0
- **Language**: ES6+ JavaScript with modules
- **Shaders**: GLSL for post-processing effects
- **Physics**: Arcade Physics (optimized for platformers)
