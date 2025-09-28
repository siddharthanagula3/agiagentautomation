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
            // Keep React and React-DOM together to prevent createElement issues
            if (id.includes('react') || id.includes('react-dom')) return 'react';
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('zustand') || id.includes('immer')) return 'state';
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
        // More comprehensive banner with TDZ protection and React fix
        banner: `
          (function() {
            // Define __name globally first (critical for React imports)
            if (typeof globalThis.__name === "undefined") {
              globalThis.__name = function(target, value) {
                try {
                  if (target && typeof value === "string") {
                    Object.defineProperty(target, "name", { value: value, configurable: true });
                  }
                } catch(e) {}
              };
            }

            // Enhanced React support - ensure React and ReactDOM are available
            if (typeof window !== "undefined") {
              // Pre-create React namespace to prevent undefined errors
              if (!window.React) {
                window.React = {
                  createElement: function() {
                    // Fallback createElement that will be replaced by real React
                    return arguments;
                  },
                  Fragment: function() { return arguments; }
                };
              }

              // Also ensure on globalThis
              if (!globalThis.React) {
                globalThis.React = window.React;
              }
            }

            // Comprehensive TDZ protection for all common minified variables
            var allVars = ['C', 'R', 'P', 'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Q', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            for (var i = 0; i < allVars.length; i++) {
              var varName = allVars[i];
              if (typeof window[varName] === "undefined") {
                try {
                  window[varName] = {};
                  globalThis[varName] = {};
                } catch(e) {}
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
      'react-dom/client',
      'react/jsx-runtime',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
    exclude: [], // Remove Sentry from exclude
    // Force React to be pre-bundled together to prevent createElement issues
    force: true,
    esbuildOptions: {
      target: 'es2020',
      keepNames: false, // Disable keepNames to prevent __name conflicts
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },
  },

  // ESBuild specific options (for dependencies)
  esbuild: {
    legalComments: 'none',
    target: 'es2015', // Match build target
    keepNames: true, // Keep names for React compatibility
    minifyIdentifiers: false, // Disable to prevent variable name conflicts
    format: 'esm', // Use ESM format for better React compatibility
    // Fix temporal dead zone issues
    tsconfigRaw: {
      compilerOptions: {
        useDefineForClassFields: false,
        target: 'es2015',
      }
    }
  },
}));
