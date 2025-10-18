import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';

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
      port: 5173,
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
              rewrite: (path) => path.replace(/^\/supabase/, ''),
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
      // Bundle analyzer for production builds
      ...(isProd
        ? [
            visualizer({
              filename: 'dist/bundle-analysis.html',
              open: false,
              gzipSize: true,
              brotliSize: true,
            }),
            // Sentry plugin for source maps and release tracking
            sentryVitePlugin({
              org: 'agi-agent-automation',
              project: 'agi-agent-automation',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                assets: './dist/**',
              },
              release: {
                name: process.env.npm_package_version || '1.0.0',
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@features': path.resolve(__dirname, './src/features'),
        '@core': path.resolve(__dirname, './src/core'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    build: {
      target: 'es2020',
      minify: 'terser',
      sourcemap: true,
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
            // Simplified chunking to avoid initialization issues
            'react-vendor': ['react', 'react-dom', 'react-dom/client'],
            router: ['react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-slot',
              'lucide-react',
              'framer-motion',
            ],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
            utils: ['zustand', 'clsx', 'tailwind-merge'],
            'ai-vendor': ['openai', '@anthropic-ai/sdk'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            sonner: ['sonner'],
            workforce: ['@/features/workforce/pages/EmployeeManagement.tsx'],
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

    // Enhanced optimizeDeps to prevent initialization issues
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react-router-dom',
        '@supabase/supabase-js',
        'sonner',
        'lucide-react',
        '@radix-ui/react-slot',
        'zustand',
        'clsx',
        'tailwind-merge',
      ],
      exclude: ['@sentry/react', '@sentry/tracing'],
    },

    // Simplified ESBuild options
    esbuild: {
      legalComments: 'none',
      target: 'es2020',
    },
  };
});
