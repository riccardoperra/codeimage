import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {ManifestOptions, VitePWA, VitePWAOptions} from 'vite-plugin-pwa';
import replace from '@rollup/plugin-replace';

const pwaOptions: Partial<VitePWAOptions> = {
  mode: 'development',
  base: '/',
  manifest: {
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
        src: '/pwa/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
};

const replaceOptions = {__DATE__: new Date().toISOString()};
const claims = process.env.CLAIMS === 'true';
const reload = process.env.RELOAD_SW === 'true';

if (process.env.SW === 'true') {
  pwaOptions.srcDir = 'src';
  pwaOptions.filename = claims ? 'claims-sw.ts' : 'prompt-sw.ts';
  pwaOptions.strategies = 'injectManifest';
  (pwaOptions.manifest as Partial<ManifestOptions>).name =
    'PWA Inject Manifest';
  (pwaOptions.manifest as Partial<ManifestOptions>).short_name = 'PWA Inject';
}

if (claims) pwaOptions.registerType = 'autoUpdate';

if (reload) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  replaceOptions.__RELOAD_SW__ = 'true';
}

export default defineConfig({
  clearScreen: true,
  plugins: [
    solidPlugin(),
    vanillaExtractPlugin(),
    VitePWA(pwaOptions),
    replace(replaceOptions),
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
  },
});
