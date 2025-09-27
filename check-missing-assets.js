// Check for missing assets that might cause 404 errors
import fs from 'fs';
import path from 'path';

console.log('🔍 CHECKING FOR MISSING ASSETS');
console.log('==============================');

const publicDir = './public';
const distDir = './dist';

// Common assets that might be missing
const commonAssets = [
  'favicon.ico',
  'robots.txt',
  'manifest.json',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest'
];

console.log('\n📊 CHECKING PUBLIC DIRECTORY:');
console.log('-----------------------------');

if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  console.log('✅ Public directory exists');
  console.log('📁 Files in public:', publicFiles);
  
  // Check for missing common assets
  const missingAssets = commonAssets.filter(asset => !publicFiles.includes(asset));
  
  if (missingAssets.length > 0) {
    console.log('\n⚠️  MISSING ASSETS:');
    missingAssets.forEach(asset => {
      console.log(`❌ Missing: ${asset}`);
    });
  } else {
    console.log('\n✅ All common assets present');
  }
} else {
  console.log('❌ Public directory not found');
}

console.log('\n📊 CHECKING DIST DIRECTORY:');
console.log('---------------------------');

if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir);
  console.log('✅ Dist directory exists');
  console.log('📁 Files in dist:', distFiles);
  
  // Check for assets directory
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    console.log('📁 Files in dist/assets:', assetFiles);
  } else {
    console.log('⚠️  Assets directory not found in dist');
  }
} else {
  console.log('❌ Dist directory not found - run build first');
}

console.log('\n📊 CHECKING FOR COMMON 404 CAUSES:');
console.log('----------------------------------');

// Check for common files that might be referenced but missing
const commonReferences = [
  'manifest.json',
  'sw.js',
  'workbox-sw.js',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png'
];

console.log('🔍 Checking for commonly referenced files:');
commonReferences.forEach(file => {
  const publicPath = path.join(publicDir, file);
  const distPath = path.join(distDir, file);
  
  const existsInPublic = fs.existsSync(publicPath);
  const existsInDist = fs.existsSync(distPath);
  
  if (existsInPublic || existsInDist) {
    console.log(`✅ ${file} found`);
  } else {
    console.log(`❌ ${file} missing - this could cause 404 errors`);
  }
});

console.log('\n🎯 RECOMMENDATIONS:');
console.log('==================');
console.log('1. Ensure all referenced assets exist in public/ directory');
console.log('2. Check for hardcoded asset paths in code');
console.log('3. Verify all imports are using correct paths');
console.log('4. Check for missing favicon and manifest files');
console.log('5. Ensure all CSS and JS files are properly bundled');

console.log('\n✅ ASSET CHECK COMPLETE');
