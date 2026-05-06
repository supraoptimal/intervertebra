import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Deployed at geneleung.org/intervertebra/
export default defineConfig({
  base: '/intervertebra/',
  // Output into dist/intervertebra so the on-disk path mirrors the public URL
  // path. This is required because Vite emits asset references like
  // /intervertebra/assets/... and the deployed Vercel app needs to serve
  // those at the same path on its own domain (intervertebra.vercel.app).
  build: {
    outDir: 'dist/intervertebra',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Inter Vertebra — Spine ERAS Tracker',
        short_name: 'Inter Vertebra',
        description:
          'Audit tool for tracking ERAS protocol compliance in spine surgery. Local-only, no patient identifiers.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/intervertebra/',
        start_url: '/intervertebra/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
