import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import solid from 'solid-start';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA, VitePWAOptions} from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import vercel from 'solid-start-vercel';

const pwaOptions: Partial<VitePWAOptions> = {
  base: '/',
  manifest: {
    name: 'Codeimage',
    orientation: 'portrait',
    dir: 'ltr',
    short_name: 'Codeimage',
    start_url: '.',
    display: 'standalone',
    background_color: '#1a1a1a',
    description: 'Create elegant screenshots of your source code.',
    theme_color: '#1a1a1a',
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

const claims = process.env.CLAIMS === 'true';

if (process.env.SW === 'true') {
  pwaOptions.srcDir = 'src';
  pwaOptions.filename = 'sw.ts';
  pwaOptions.strategies = 'injectManifest';
}

if (claims) pwaOptions.registerType = 'autoUpdate';

/**
 * Replace env variables in index.html
 */
function htmlTransformPlugin(env: ReturnType<typeof loadEnv>) {
  return {
    name: 'html-transform',
    transformIndexHtml: {
      enforce: 'pre' as const,
      transform: (html: string): string =>
        html.replace(/%(.*?)%/g, (match, p1) => env[p1] ?? match),
    },
  };
}

export default defineConfig({
  clearScreen: true,
  plugins: [
    VitePWA(pwaOptions),
    tsconfigPaths(),
    solid({ssr: false, adapter: vercel()}),
    vanillaExtractPlugin(),
  ],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
  },
  build: {
    brotliSize: true,
    sourcemap: false,
    minify: true,
    polyfillModulePreload: false,
    polyfillDynamicImport: false,
    cssCodeSplit: true,
    ssr: false,
  },
  optimizeDeps: {
    exclude: ['solid-headless'],
  },
});
