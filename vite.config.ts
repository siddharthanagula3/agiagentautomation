import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
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
    ? 'http://localhost:8888/.netlify/functions/payments/stripe-webhook'
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
              org: process.env.SENTRY_ORG || 'agi-agent-automation',
              project: process.env.SENTRY_PROJECT || 'agi-agent-automation',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                assets: './dist/**',
                // Delete source maps after upload for security
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
              release: {
                name: `agi-agent-automation@${process.env.npm_package_version || '1.0.0'}`,
                // Inject release version into the build
                inject: true,
                // Set commits for release tracking
                setCommits: {
                  auto: true,
                  ignoreMissing: true,
                },
              },
              // Only upload if auth token is present
              disable: !process.env.SENTRY_AUTH_TOKEN,
              // Telemetry for Sentry plugin (disable in CI)
              telemetry: false,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      },
    },
    build: {
      target: 'es2020',
      // Use esbuild for minification - faster and simpler than Terser
      // esbuild automatically handles console removal in production
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks - keep large libraries separate
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) {
                return 'react-vendor';
              }
              if (id.includes('react-router')) {
                return 'router';
              }
              if (
                id.includes('@radix-ui') ||
                id.includes('lucide-react') ||
                id.includes('framer-motion')
              ) {
                return 'ui-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query';
              }
              if (
                id.includes('zustand') ||
                id.includes('clsx') ||
                id.includes('tailwind-merge')
              ) {
                return 'utils';
              }
              if (id.includes('openai') || id.includes('@anthropic-ai')) {
                return 'ai-vendor';
              }
              if (id.includes('@stripe')) {
                return 'stripe';
              }
              if (
                id.includes('marked') ||
                id.includes('highlight.js') ||
                id.includes('prismjs')
              ) {
                return 'markdown-vendor';
              }
              if (id.includes('@codemirror') || id.includes('@lezer')) {
                return 'editor-vendor';
              }
              if (id.includes('sonner')) {
                return 'sonner';
              }
            }
            // Split large feature modules
            if (id.includes('/features/chat/')) {
              return 'chat';
            }
            if (id.includes('/features/vibe/')) {
              return 'vibe';
            }
            if (id.includes('/features/workforce/')) {
              return 'workforce';
            }
            if (id.includes('/features/marketplace/')) {
              return 'marketplace';
            }
            if (id.includes('/core/ai/')) {
              return 'ai-core';
            }
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
