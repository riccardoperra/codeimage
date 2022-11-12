import {defineConfig, Plugin} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
// import {VitePWA, VitePWAOptions} from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import {withStaticVercelPreview} from '../../scripts/vercel-output-build';

// const pwaOptions: Partial<VitePWAOptions> = {
//   base: '/',
//   manifest: {
//     name: 'Codeimage',
//     orientation: 'portrait',
//     dir: 'ltr',
//     short_name: 'Codeimage',
//     start_url: '.',
//     display: 'standalone',
//     background_color: '#1a1a1a',
//     description: 'Create elegant screenshots of your source code.',
//     theme_color: '#1a1a1a',
//     icons: [
//       {
//         src: '/pwa/manifest-icon-192.maskable.png',
//         sizes: '192x192',
//         type: 'image/png',
//         purpose: 'any',
//       },
//       {
//         src: '/pwa/manifest-icon-192.maskable.png',
//         sizes: '192x192',
//         type: 'image/png',
//         purpose: 'maskable',
//       },
//       {
//         src: '/pwa/manifest-icon-512.maskable.png',
//         sizes: '512x512',
//         type: 'image/png',
//         purpose: 'any',
//       },
//       {
//         src: '/pwa/manifest-icon-512.maskable.png',
//         sizes: '512x512',
//         type: 'image/png',
//         purpose: 'maskable',
//       },
//     ],
//   },
//   srcDir: 'src',
//   filename: 'sw.ts',
//   strategies: 'injectManifest',
//   registerType: 'autoUpdate',
// };

export default defineConfig(({mode}) => ({
  plugins: [
    vanillaExtractPlugin(),
    solidPlugin(),
    // VitePWA(pwaOptions),
    tsconfigPaths(),
    {
      name: 'html-inject-umami',
      transformIndexHtml(html) {
        const websiteId = process.env.UMAMI_WEBSITE_ID;
        const scriptSrc = process.env.UMAMI_SCRIPT_SRC;

        if (mode !== 'production' || !websiteId || !scriptSrc) return html;

        // Auto-track is off since query param push a new page view and breaks the analytics
        // TODO: Find a better solution to handle query params
        return html.replace(
          '<!-- %UMAMI% -->',
          `<script async defer data-website-id='${websiteId.trim()}' src='${scriptSrc.trim()}'></script>`,
        );
      },
    },
    {
      name: 'parse-environment-variables',

      configResolved(resolvedConfig) {
        const config = resolvedConfig as Omit<typeof resolvedConfig, 'env'> & {
          env: typeof resolvedConfig['env'];
        };
        const env = config.env;
        config.env = Object.keys(env).reduce((acc, key) => {
          let parsed = config.env[key];
          try {
            parsed = JSON.parse(config.env[key]);
          } catch {}
          return {
            ...acc,
            [key]: parsed,
          };
        }, {});
      },
    },
    withStaticVercelPreview() as unknown as Plugin,
  ],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    minify: true,
    polyfillModulePreload: false,
    polyfillDynamicImport: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
}));
