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
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,

    // Source maps for debugging
    sourcemap: mode !== 'production',

    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'data-vendor';
            }
            if (id.includes('@stripe')) {
              return 'stripe-vendor';
            }
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'viz-vendor';
            }
            return 'vendor';
          }
          
          // Split dashboard pages into separate chunks
          if (id.includes('/pages/dashboard/')) {
            return 'dashboard-pages';
          }
          if (id.includes('/pages/ai-employees/')) {
            return 'ai-employees';
          }
        },
        // Asset naming
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
      },
    },

    // Performance warnings
    chunkSizeWarningLimit: 1000,
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

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@stripe/stripe-js',
      'date-fns',
      'framer-motion',
      'recharts',
    ],
  },
}));
