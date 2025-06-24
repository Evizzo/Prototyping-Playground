import { defineConfig } from 'vite';

export default defineConfig({
  // Optimize for game development
  server: {
    port: 3000,
    hot: true
  },
  
  // Asset handling for textures, shaders, and audio
  assetsInclude: ['**/*.frag', '**/*.vert', '**/*.glsl'],
  
  build: {
    // Optimize for WebGL games
    target: 'es2020',
    rollupOptions: {
      output: {
        // Chunk splitting for better loading performance
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  
  // Enable source maps for debugging
  css: {
    devSourcemap: true
  }
}); 