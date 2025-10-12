import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Environment-aware configuration
  const isDev = mode === 'development';
  const isProd = mode === 'production';

  // Get environment-specific URLs
  const apiUrl =
    process.env.VITE_API_URL || (isDev ? 'http://localhost:8000' : '');
  const wsUrl = process.env.VITE_WS_URL || (isDev ? 'ws://localhost:8000' : '');

  // Local development URLs
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || (isDev ? 'http://localhost:54321' : '');
  const netlifyFunctionsUrl = isDev ? 'http://localhost:8888' : '';
  const stripeWebhookUrl = isDev
    ? 'http://localhost:8888/.netlify/functions/stripe-webhook'
    : '';

  return {
    server: {
      host: '::',
      port: 8080,
      cors: true,
      proxy: isDev
        ? {
            '/api': {
              target: apiUrl,
              changeOrigin: true,
              secure: false,
              configure: (proxy, _options) => {
                proxy.on('error', (err, _req, _res) => {
                  console.log('proxy error', err);
                });
                proxy.on('proxyReq', (proxyReq, req, _res) => {
                  console.log(
                    'Sending Request to the Target:',
                    req.method,
                    req.url
                  );
                });
                proxy.on('proxyRes', (proxyRes, req, _res) => {
                  console.log(
                    'Received Response from the Target:',
                    proxyRes.statusCode,
                    req.url
                  );
                });
              },
            },
            '/ws': {
              target: wsUrl,
              ws: true,
              changeOrigin: true,
            },
            // Supabase local development proxy
            '/supabase': {
              target: supabaseUrl,
              changeOrigin: true,
              secure: false,
              rewrite: path => path.replace(/^\/supabase/, ''),
            },
            // Netlify Functions local development proxy
            '/.netlify/functions': {
              target: netlifyFunctionsUrl,
              changeOrigin: true,
              secure: false,
            },
            // Stripe webhook proxy for local development
            '/stripe-webhook': {
              target: stripeWebhookUrl,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    plugins: [
      react({
        fastRefresh: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2020',
      minify: 'terser',
      sourcemap: mode === 'production' ? false : true,
      terserOptions: {
        compress: {
          drop_console:
            mode === 'production' ? ['log', 'debug', 'info'] : false,
          drop_debugger: true,
          pure_funcs:
            mode === 'production'
              ? ['console.log', 'console.debug', 'console.info']
              : [],
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            supabase: ['@supabase/supabase-js'],
            utils: ['zustand', 'immer', 'date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || '1.0.0'
      ),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },

    // Simplified optimizeDeps
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react-router-dom',
        '@supabase/supabase-js',
      ],
    },

    // Simplified ESBuild options
    esbuild: {
      legalComments: 'none',
      target: 'es2020',
    },
  };
});
