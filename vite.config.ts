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
    target: 'es2015', // Use older target for better compatibility
    minify: 'terser', // Use terser instead of esbuild for better control
    sourcemap: false,

    // Optimized rollup options for Netlify
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react';
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('@supabase')) return 'supabase';
            return 'vendor';
          }
        },

        // Optimized file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        // Fix initialization order issues with more conservative approach
        interop: 'compat',
        generatedCode: {
          constBindings: false, // Use var declarations
          arrowFunctions: false, // Use function declarations
          objectShorthand: false, // Avoid object shorthand that can cause issues
        },
        // More comprehensive banner with TDZ protection
        banner: `
          (function() {
            // Define __name globally
            if (typeof globalThis.__name === "undefined") {
              globalThis.__name = function(target, value) {
                try {
                  if (target && typeof value === "string") {
                    Object.defineProperty(target, "name", { value: value, configurable: true });
                  }
                } catch(e) {}
              };
            }

            // Comprehensive TDZ protection
            var commonVars = ['C', 'R', 'P', 'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Q', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            for (var i = 0; i < commonVars.length; i++) {
              var varName = commonVars[i];
              if (typeof window[varName] === "undefined") {
                try { window[varName] = {}; } catch(e) {}
              }
            }
          })();
        `,
      },
    },
    
    // Increase chunk size warning limit for large apps
    chunkSizeWarningLimit: 1000,
    
    // Module preload optimization
    modulePreload: {
      polyfill: false, // Disable polyfill for better performance
    },
    
    // CommonJS handling
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
      '@supabase/supabase-js',
    ],
    exclude: [], // Remove Sentry from exclude
    esbuildOptions: {
      target: 'es2020',
      keepNames: false, // Disable keepNames to prevent __name conflicts
    },
  },

  // ESBuild specific options (for dependencies)
  esbuild: {
    legalComments: 'none',
    target: 'es2015', // Match build target
    keepNames: false,
    minifyIdentifiers: false, // Disable to prevent variable name conflicts
    // Fix temporal dead zone issues
    tsconfigRaw: {
      compilerOptions: {
        useDefineForClassFields: false,
        target: 'es2015',
      }
    }
  },
}));
