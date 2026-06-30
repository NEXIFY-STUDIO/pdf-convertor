/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const base = '/vub/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg', 'pwa-512x512-maskable.svg'],
      manifest: {
        name: 'Blueprint Flow Editor',
        short_name: 'Blueprint PDF',
        description: 'Offline-first PDF financial statement editor',
        theme_color: '#1a1a2e',
        background_color: '#16213e',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-512x512-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@react-pdf/renderer'],
    include: [
      'base64-js',
      'base64-js-cjs',
      'unicode-trie',
      'dfa',
      'restructure',
      'tiny-inflate',
      'browserify-zlib',
      'fontkit',
      'linebreak',
      'unicode-properties',
      'clone',
      'clone-cjs',
      'cross-fetch',
      'is-url',
      'is-url-cjs',
      'emoji-regex',
      'queue',
      'queue-cjs',
      'crypto-js',
      'jay-peg',
      '@react-pdf/png-js',
      '@react-pdf/pdfkit',
      '@react-pdf/layout',
      '@react-pdf/font',
      '@react-pdf/render',
      '@react-pdf/primitives',
      '@react-pdf/stylesheet',
      '@react-pdf/textkit',
      '@react-pdf/fns',
      '@react-pdf/image',
      'object-assign',
      'prop-types',
      'scheduler'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'brotli/decompress.js': 'brotli/decompress',
      'base64-js': path.resolve(__dirname, './src/shims/base64-js.ts'),
      'base64-js-cjs': path.resolve(__dirname, './node_modules/base64-js/index.js'),
      'clone': path.resolve(__dirname, './src/shims/clone.ts'),
      'clone-cjs': path.resolve(__dirname, './node_modules/clone/clone.js'),
      'cross-fetch': path.resolve(__dirname, './src/shims/cross-fetch.ts'),
      'is-url': path.resolve(__dirname, './src/shims/is-url.ts'),
      'is-url-cjs': path.resolve(__dirname, './node_modules/is-url/index.js'),
      'queue': path.resolve(__dirname, './src/shims/queue.ts'),
      'queue-cjs': path.resolve(__dirname, './node_modules/queue/index.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/production/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/shared/**',
        'src/export/**',
        'src/editor/**',
        'src/components/RightPanel.tsx',
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 94,
        functions: 80,
      },
    },
  },
});
