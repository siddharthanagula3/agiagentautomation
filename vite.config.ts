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
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],

          // Data fetching and state
          'data-vendor': ['@tanstack/react-query', 'zustand'],

          // Payment and external services
          'external-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],

          // Charts and visualization
          'viz-vendor': ['recharts'],

          // Utilities
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'framer-motion'],

          // Security
          'security-vendor': ['dompurify'],
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
