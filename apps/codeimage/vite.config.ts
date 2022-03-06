import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {ManifestOptions, VitePWA} from 'vite-plugin-pwa';

const pwaManifest: Partial<ManifestOptions> = {
  name: 'Codeimage',
  orientation: 'portrait',
  dir: 'ltr',
  short_name: 'Codeimage',
  start_url: '.',
  display: 'standalone',
  background_color: '#1a1a1a',
  description: 'Create elegant code screenshots of your source code.',
  icons: [
    {
      src: 'src/assets/pwa/manifest-icon-192.maskable.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'src/assets/pwa/manifest-icon-192.maskable.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: 'src/assets/pwa/manifest-icon-512.maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'src/assets/pwa/manifest-icon-512.maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export default defineConfig({
  clearScreen: true,
  plugins: [
    solidPlugin(),
    vanillaExtractPlugin(),
    VitePWA({
      manifest: pwaManifest,
      devOptions: {
        enabled: true,
        disableRuntimeConfig: true,
        /* other options */
      },
    }),
  ],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: 'es2019',
    brotliSize: true,
    sourcemap: true,
    minify: true,
    polyfillDynamicImport: false,
    cssCodeSplit: true,
    manifest: true,
  },
});
