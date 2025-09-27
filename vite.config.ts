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
      // Proxy API calls to backend during development
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
    // Build optimization
    target: 'es2020', // Changed from 'esnext' to 'es2020' for better compatibility
    minify: 'esbuild',
    cssMinify: true,

    // Source maps for debugging
    sourcemap: mode !== 'production',

    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Simplified chunking strategy to avoid circular dependencies
          if (id.includes('node_modules')) {
            // Keep React ecosystem together
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('@remix-run')) {
              return 'react-vendor';
            }
            // Keep UI libraries together
            if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('@floating-ui')) {
              return 'ui-vendor';
            }
            // Keep data/state libraries together
            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('immer')) {
              return 'state-vendor';
            }
            // Separate heavy visualization libraries
            if (id.includes('recharts') || id.includes('d3') || id.includes('framer-motion')) {
              return 'viz-vendor';
            }
            // Stripe separate
            if (id.includes('@stripe')) {
              return 'stripe-vendor';
            }
            // Supabase separate
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Everything else in a general vendor chunk
            return 'vendor';
          }
        },
        // Asset naming
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
      },
    },

    // Performance warnings
    chunkSizeWarningLimit: 1500,
    
    // CommonJS optimization
    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: false,
    },
  },

  // Preview server configuration
  preview: {
    port: 8080,
    host: "::",
    cors: true,
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  // Performance optimizations - expanded list
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
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-slot',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
    exclude: ['@sentry/react'], // Exclude Sentry to prevent bundling issues
    esbuildOptions: {
      target: 'es2020',
    },
  },
}));
