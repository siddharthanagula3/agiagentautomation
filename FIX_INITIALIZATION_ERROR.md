# 🔧 Fix for "Cannot access 'g' before initialization" Error

## Problem
The application is throwing a runtime error: `Uncaught ReferenceError: Cannot access 'g' before initialization` in the vendor bundle. This is a JavaScript temporal dead zone error caused by circular dependencies or incorrect module initialization order.

## Solutions Applied

### Solution 1: Updated Build Configuration
**File:** `vite.config.ts`
- Changed build target from `esnext` to `es2015` for better compatibility
- Switched from `esbuild` to `terser` for minification
- Disabled manual chunking to let Vite handle automatically
- Added comprehensive optimizeDeps list
- Enabled `keepNames` to preserve function names

### Solution 2: Added Alternative Scripts
**File:** `package.json`
- Added `build:clean` script to clear cache before building
- Added `reinstall` script for clean dependency installation
- Added `terser` to devDependencies

### Solution 3: Minimal Configuration Backup
**File:** `vite.config.minimal.ts`
- Created a minimal configuration file as fallback
- Disables minification temporarily for debugging

## Quick Fix Instructions

### Option 1: Automated Fix (Recommended)
```batch
# Run the fix script
.\fix-initialization-error.bat
```

### Option 2: Manual Steps
```bash
# 1. Complete clean
rm -rf dist node_modules package-lock.json

# 2. Install dependencies including terser
npm install
npm install --save-dev terser

# 3. Build with clean cache
npm run build:clean

# 4. Test locally
npm run preview

# 5. If working, commit and push
git add .
git commit -m "Fix: Module initialization error with terser and es2015 target"
git push origin main
```

### Option 3: Use Minimal Config (If above fails)
```bash
# 1. Backup current config
cp vite.config.ts vite.config.backup.ts

# 2. Use minimal config
cp vite.config.minimal.ts vite.config.ts

# 3. Build
npm run build

# 4. Test
npm run preview
```

## Deployment to Netlify

### Before Deploying
1. Ensure environment variables are set in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

2. Update `netlify.toml` if not already done

### Deploy with Cache Clear
1. Go to Netlify Dashboard
2. Navigate to **Deploys**
3. Click **Trigger deploy**
4. Select **Clear cache and deploy site**

## Debugging If Error Persists

### 1. Check Exact Error Location
```javascript
// In browser console, the error shows:
// vendor.h_r3mBod.js:9
// Look for variable 'g' initialization
```

### 2. Enable Verbose Logging
Add to `vite.config.ts`:
```javascript
build: {
  sourcemap: 'inline', // Better source maps
  minify: false, // Temporarily disable minification
}
```

### 3. Check for Circular Dependencies
```bash
npx madge --circular src
```

### 4. Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

### 5. Test Different Node Version
In `netlify.toml`:
```toml
[build.environment]
  NODE_VERSION = "18" # Try 18 instead of 20
```

## Root Cause Analysis

The error is caused by one of these issues:
1. **Circular Dependencies**: Modules importing each other in a circle
2. **Hoisting Issues**: Variables being accessed before declaration
3. **Bundler Optimization**: Aggressive code splitting causing wrong execution order
4. **Third-party Library**: A library with initialization issues

## Expected Result After Fix

✅ Build completes successfully
✅ No runtime errors in browser
✅ Application loads normally
✅ All routes accessible
✅ No console errors

## Emergency Fallback

If nothing works, create a production build without optimizations:
```bash
# In vite.config.ts, set:
build: {
  minify: false,
  terserOptions: undefined,
  rollupOptions: {
    output: {
      manualChunks: undefined,
    }
  }
}
```

## Contact Support

If the issue persists after all fixes:
1. Save the browser console error
2. Run `npm list` and save output
3. Check which specific page triggers the error
4. Note any patterns (only on certain routes, after certain actions, etc.)

---

**Last Updated**: Fixed with terser minification and es2015 target for better compatibility
