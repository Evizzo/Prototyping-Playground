/**
 * 🧪 STRICT PLATFORM ALIGNMENT TESTING SCRIPT
 * 
 * This script STRICTLY validates that visible texture === interactive area
 * ZERO TOLERANCE for misalignment!
 */

// Test Results Storage
const testResults = {
  platformsExist: false,
  perfectAlignment: false,
  noOverlappingCollision: false,
  visualBoundsMatchPhysics: false,
  strictPixelPerfectTest: false
};

/**
 * STRICT testing - no tolerance for misalignment
 */
function runStrictPlatformTests() {
  console.log('🔬 STARTING STRICT PLATFORM ALIGNMENT VALIDATION...');
  console.log('⚠️ ZERO TOLERANCE FOR MISALIGNMENT!');
  
  const scene = window.game.scene.getScene('GameScene');
  if (!scene) {
    console.error('❌ CRITICAL: GameScene not found!');
    return;
  }
  
  // Test 1: Platforms exist
  testPlatformsExist(scene);
  
  // Test 2: STRICT alignment test
  testStrictAlignment(scene);
  
  // Test 3: Visual bounds match physics bounds
  testVisualBoundsMatchPhysics(scene);
  
  // Test 4: No overlapping collision areas
  testNoOverlappingCollision(scene);
  
  // Test 5: Pixel-perfect test
  testPixelPerfectAlignment(scene);
  
  // Report Results
  reportStrictResults();
}

function testPlatformsExist(scene) {
  console.log('🔧 STRICT Test 1: Platform Existence...');
  
  const platforms = scene.platformGroup?.children?.entries || [];
  
  if (platforms.length > 0) {
    testResults.platformsExist = true;
    console.log(`✅ Platforms exist: ${platforms.length} platforms found`);
  } else {
    console.error('❌ CRITICAL FAILURE: No platforms found!');
  }
}

function testStrictAlignment(scene) {
  console.log('📏 STRICT Test 2: Perfect Alignment (ZERO TOLERANCE)...');
  
  const platforms = scene.platformGroup?.children?.entries || [];
  let failures = [];
  
  platforms.forEach((platform, index) => {
    // Get visual properties
    const visualLeft = platform.x - (platform.displayWidth / 2);
    const visualRight = platform.x + (platform.displayWidth / 2);
    const visualTop = platform.y - (platform.displayHeight / 2);
    const visualBottom = platform.y + (platform.displayHeight / 2);
    
    // Get physics properties
    const physicsLeft = platform.body.x;
    const physicsRight = platform.body.x + platform.body.width;
    const physicsTop = platform.body.y;
    const physicsBottom = platform.body.y + platform.body.height;
    
    // STRICT comparison - must be EXACTLY equal
    const leftMatch = Math.abs(visualLeft - physicsLeft) < 0.1;
    const rightMatch = Math.abs(visualRight - physicsRight) < 0.1;
    const topMatch = Math.abs(visualTop - physicsTop) < 0.1;
    const bottomMatch = Math.abs(visualBottom - physicsBottom) < 0.1;
    
    if (!leftMatch || !rightMatch || !topMatch || !bottomMatch) {
      failures.push({
        index,
        visual: { left: visualLeft, right: visualRight, top: visualTop, bottom: visualBottom },
        physics: { left: physicsLeft, right: physicsRight, top: physicsTop, bottom: physicsBottom },
        mismatches: {
          left: !leftMatch ? Math.abs(visualLeft - physicsLeft) : 0,
          right: !rightMatch ? Math.abs(visualRight - physicsRight) : 0,
          top: !topMatch ? Math.abs(visualTop - physicsTop) : 0,
          bottom: !bottomMatch ? Math.abs(visualBottom - physicsBottom) : 0
        }
      });
    }
  });
  
  if (failures.length === 0) {
    testResults.perfectAlignment = true;
    console.log('✅ PERFECT ALIGNMENT: All platforms perfectly aligned!');
  } else {
    console.error(`❌ ALIGNMENT FAILURE: ${failures.length} platforms misaligned:`);
    failures.forEach(failure => {
      console.error(`  Platform ${failure.index}:`);
      console.error(`    Visual:  L:${failure.visual.left.toFixed(2)} R:${failure.visual.right.toFixed(2)} T:${failure.visual.top.toFixed(2)} B:${failure.visual.bottom.toFixed(2)}`);
      console.error(`    Physics: L:${failure.physics.left.toFixed(2)} R:${failure.physics.right.toFixed(2)} T:${failure.physics.top.toFixed(2)} B:${failure.physics.bottom.toFixed(2)}`);
      console.error(`    Errors:  L:${failure.mismatches.left.toFixed(3)} R:${failure.mismatches.right.toFixed(3)} T:${failure.mismatches.top.toFixed(3)} B:${failure.mismatches.bottom.toFixed(3)}`);
    });
  }
}

function testVisualBoundsMatchPhysics(scene) {
  console.log('📐 STRICT Test 3: Visual Bounds = Physics Bounds...');
  
  const platforms = scene.platformGroup?.children?.entries || [];
  let boundsMismatches = 0;
  
  platforms.forEach((platform, index) => {
    const visualBounds = platform.getBounds();
    const physicsBounds = {
      x: platform.body.x,
      y: platform.body.y,
      width: platform.body.width,
      height: platform.body.height
    };
    
    const boundsMatch = 
      Math.abs(visualBounds.x - physicsBounds.x) < 0.1 &&
      Math.abs(visualBounds.y - physicsBounds.y) < 0.1 &&
      Math.abs(visualBounds.width - physicsBounds.width) < 0.1 &&
      Math.abs(visualBounds.height - physicsBounds.height) < 0.1;
    
    if (!boundsMatch) {
      boundsMismatches++;
      console.error(`❌ Platform ${index} bounds mismatch:`);
      console.error(`  Visual bounds:  x:${visualBounds.x.toFixed(2)} y:${visualBounds.y.toFixed(2)} w:${visualBounds.width.toFixed(2)} h:${visualBounds.height.toFixed(2)}`);
      console.error(`  Physics bounds: x:${physicsBounds.x.toFixed(2)} y:${physicsBounds.y.toFixed(2)} w:${physicsBounds.width.toFixed(2)} h:${physicsBounds.height.toFixed(2)}`);
    }
  });
  
  if (boundsMismatches === 0) {
    testResults.visualBoundsMatchPhysics = true;
    console.log('✅ BOUNDS MATCH: All visual bounds match physics bounds!');
  } else {
    console.error(`❌ BOUNDS FAILURE: ${boundsMismatches} platforms have mismatched bounds`);
  }
}

function testNoOverlappingCollision(scene) {
  console.log('🚫 STRICT Test 4: No Overlapping Collision Areas...');
  
  const platforms = scene.platformGroup?.children?.entries || [];
  let overlaps = 0;
  
  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      const platform1 = platforms[i];
      const platform2 = platforms[j];
      
      // Check if physics bodies overlap
      const overlap = Phaser.Geom.Rectangle.Overlaps(
        new Phaser.Geom.Rectangle(platform1.body.x, platform1.body.y, platform1.body.width, platform1.body.height),
        new Phaser.Geom.Rectangle(platform2.body.x, platform2.body.y, platform2.body.width, platform2.body.height)
      );
      
      if (overlap) {
        overlaps++;
        console.error(`❌ Platform ${i} and ${j} have overlapping collision areas!`);
      }
    }
  }
  
  if (overlaps === 0) {
    testResults.noOverlappingCollision = true;
    console.log('✅ NO OVERLAPS: No overlapping collision areas found!');
  } else {
    console.error(`❌ OVERLAP FAILURE: ${overlaps} overlapping collision areas found`);
  }
}

function testPixelPerfectAlignment(scene) {
  console.log('🎯 STRICT Test 5: Pixel-Perfect Alignment...');
  
  const platforms = scene.platformGroup?.children?.entries || [];
  let pixelErrors = 0;
  
  platforms.forEach((platform, index) => {
    // Test exact pixel alignment
    const visualWidth = Math.round(platform.displayWidth);
    const physicsWidth = Math.round(platform.body.width);
    const visualHeight = Math.round(platform.displayHeight);
    const physicsHeight = Math.round(platform.body.height);
    
    if (visualWidth !== physicsWidth || visualHeight !== physicsHeight) {
      pixelErrors++;
      console.error(`❌ Platform ${index} pixel misalignment:`);
      console.error(`  Visual: ${visualWidth}x${visualHeight}, Physics: ${physicsWidth}x${physicsHeight}`);
      console.error(`  Difference: width=${visualWidth - physicsWidth}, height=${visualHeight - physicsHeight}`);
    }
  });
  
  if (pixelErrors === 0) {
    testResults.strictPixelPerfectTest = true;
    console.log('✅ PIXEL PERFECT: All platforms have perfect pixel alignment!');
  } else {
    console.error(`❌ PIXEL FAILURE: ${pixelErrors} platforms have pixel misalignment`);
  }
}

function reportStrictResults() {
  console.log('\n🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁');
  console.log('🏁                                                      🏁');
  console.log('🏁               STRICT TEST RESULTS                    🏁');
  console.log('🏁                                                      🏁');
  console.log('🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁');
  
  const passedTests = Object.values(testResults).filter(result => result).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const emoji = passed ? '🎉' : '💥';
    console.log(`${emoji} ${test}: ${status}`);
  });
  
  console.log(`\n🎯🎯🎯 FINAL SCORE: ${passedTests}/${totalTests} tests passed 🎯🎯🎯`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
    console.log('🎉                                                      🎉');
    console.log('🎉         PERFECT! ALL STRICT TESTS PASSED!           🎉');
    console.log('🎉         ✅ Visible texture === Interactive area      🎉');
    console.log('🎉         🚀 PLATFORM ALIGNMENT IS PERFECT!           🎉');
    console.log('🎉                                                      🎉');
    console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
  } else {
    console.log('\n💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥');
    console.log('💥                                                      💥');
    console.log('💥              STRICT TESTS FAILED!                   💥');
    console.log('💥         ❌ Visible texture ≠ Interactive area       💥');
    console.log('💥         🔧 Platform alignment requires fixing!       💥');
    console.log('💥                                                      💥');
    console.log('💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥');
  }
  
  return passedTests === totalTests;
}

// Make available globally and auto-run
if (typeof window !== 'undefined') {
  window.runStrictPlatformTests = runStrictPlatformTests;
  window.testResults = testResults;
  
  // Auto-run after 2 seconds
  setTimeout(() => {
    if (window.game && window.game.scene.getScene('GameScene')) {
      runStrictPlatformTests();
    }
  }, 2000);
} 