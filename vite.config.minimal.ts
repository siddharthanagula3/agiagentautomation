import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Minimal configuration to avoid initialization errors
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: false, // Disable minification temporarily
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      output: {
        // Single vendor chunk to avoid splitting issues
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
