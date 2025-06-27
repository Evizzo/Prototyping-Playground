/**
 * Manual Platform Alignment Test
 * Run this after the game loads to test alignment
 */

console.log('🔧 MANUAL PLATFORM ALIGNMENT TEST');

// Wait for game to be ready
setTimeout(() => {
  if (window.game && window.game.scene.getScene('GameScene')) {
    const scene = window.game.scene.getScene('GameScene');
    const platforms = scene.platformGroup?.children?.entries || [];
    
    console.log(`📊 Found ${platforms.length} platforms to test`);
    
    let failures = [];
    
    platforms.forEach((platform, index) => {
      // Get visual bounds
      const visualLeft = platform.x - (platform.displayWidth / 2);
      const visualRight = platform.x + (platform.displayWidth / 2);
      const visualTop = platform.y - (platform.displayHeight / 2);
      const visualBottom = platform.y + (platform.displayHeight / 2);
      
      // Get physics bounds
      const physicsLeft = platform.body.x;
      const physicsRight = platform.body.x + platform.body.width;
      const physicsTop = platform.body.y;
      const physicsBottom = platform.body.y + platform.body.height;
      
      // Check alignment (tolerance of 0.5 pixels)
      const leftDiff = Math.abs(visualLeft - physicsLeft);
      const rightDiff = Math.abs(visualRight - physicsRight);
      const topDiff = Math.abs(visualTop - physicsTop);
      const bottomDiff = Math.abs(visualBottom - physicsBottom);
      
      const isAligned = leftDiff < 0.5 && rightDiff < 0.5 && topDiff < 0.5 && bottomDiff < 0.5;
      
      if (!isAligned) {
        failures.push({
          index,
          diffs: { left: leftDiff, right: rightDiff, top: topDiff, bottom: bottomDiff },
          visual: { left: visualLeft, right: visualRight, top: visualTop, bottom: visualBottom },
          physics: { left: physicsLeft, right: physicsRight, top: physicsTop, bottom: physicsBottom }
        });
      }
      
      console.log(`Platform ${index}: ${isAligned ? '✅' : '❌'} L:${leftDiff.toFixed(2)} R:${rightDiff.toFixed(2)} T:${topDiff.toFixed(2)} B:${bottomDiff.toFixed(2)}`);
    });
    
    if (failures.length === 0) {
      console.log('\n🎉🎉🎉 ALL PLATFORMS PERFECTLY ALIGNED! 🎉🎉🎉');
      console.log('✅ Visible texture === Interactive area');
    } else {
      console.log(`\n❌❌❌ ${failures.length} PLATFORMS MISALIGNED! ❌❌❌`);
      failures.forEach(failure => {
        console.log(`Platform ${failure.index}:`);
        console.log(`  Errors: L:${failure.diffs.left.toFixed(3)} R:${failure.diffs.right.toFixed(3)} T:${failure.diffs.top.toFixed(3)} B:${failure.diffs.bottom.toFixed(3)}`);
      });
    }
    
  } else {
    console.log('❌ Game not ready yet');
  }
}, 3000); 