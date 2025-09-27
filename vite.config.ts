import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Build optimization - using more compatible settings
    target: 'es2015', // More compatible target
    minify: 'terser', // Use terser instead of esbuild for better compatibility
    cssMinify: true,
    
    // Source maps for debugging
    sourcemap: mode === 'development',
    
    // Disable code splitting temporarily to avoid initialization issues
    rollupOptions: {
      output: {
        // Disable manual chunks - let Vite handle it automatically
        // This prevents initialization order issues
        manualChunks: undefined,
        
        // Use simpler file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Ensure proper module format
        format: 'es',
        
        // Prevent code splitting for vendor chunks
        inlineDynamicImports: false,
      },
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    
    // Module preload polyfill
    modulePreload: {
      polyfill: true,
    },
    
    // CommonJS handling
    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: false,
      esmExternals: true,
    },
    
    // Terser options for better compatibility
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log'] : [],
      },
      mangle: {
        safari10: true, // Work around Safari 10 bugs
      },
      format: {
        comments: false,
      },
    },
  },
  
  // Preview server configuration
  preview: {
    port: 8080,
    host: "::",
    cors: true,
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  
  // Optimize dependencies - comprehensive list
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      '@supabase/supabase-js',
      '@supabase/realtime-js',
      '@supabase/storage-js',
      '@supabase/functions-js',
      '@supabase/postgrest-js',
      '@supabase/auth-helpers-react',
      'date-fns',
      'framer-motion',
      'recharts',
      'zustand',
      'immer',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'lucide-react',
      'sonner',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'react-day-picker',
      'cmdk',
      'vaul',
      'embla-carousel-react',
      'input-otp',
      'react-resizable-panels',
      'next-themes'
    ],
    exclude: [
      '@sentry/react' // Exclude Sentry to prevent issues
    ],
    esbuildOptions: {
      target: 'es2015', // Match build target
      keepNames: true, // Preserve function names
    },
    force: true, // Force re-optimization
  },
  
  // ESBuild specific options
  esbuild: {
    legalComments: 'none',
    target: 'es2015',
    keepNames: true, // Important for debugging
  },
}));
