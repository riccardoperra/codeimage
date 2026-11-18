import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {fileURLToPath} from 'node:url';
import type {Plugin, UserConfigExport} from 'vite';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import {withStaticVercelPreview} from '../../scripts/vercel-output-build';

const config: UserConfigExport = defineConfig(async ({mode}) => ({
  plugins: [
    ...(mode !== 'render' && process.env.CODEIMAGE_SOLID1_BRIDGE === '1'
      ? [
          (
            await import('./experiments/solid1-bridge/vite.mjs')
          ).projectMenuBridgeProbe(),
        ]
      : []),
    vanillaExtractPlugin(
      mode === 'render'
        ? {
            unstable_mode: 'emitCss',
            unstable_pluginFilter: ({name}) =>
              name === 'solid' || name === 'vite-tsconfig-paths',
          }
        : {unstable_mode: 'transform'},
    ),
    solidPlugin({
      ssr: mode === 'render',
      solid: mode === 'render' ? {hydratable: false} : undefined,
      extensions: ['.tsx', '.ts'],
    }),
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
          env: (typeof resolvedConfig)['env'];
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
    ...(mode === 'render'
      ? []
      : [withStaticVercelPreview() as unknown as Plugin]),
  ],
  publicDir: mode === 'render' ? false : undefined,
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
    ...(mode === 'render'
      ? {
          ssr: 'src/render/entry-server.tsx',
          outDir: '../../packages/render/dist/ssr',
          cssCodeSplit: false,
          cssMinify: false,
          ssrEmitAssets: true,
          rollupOptions: {
            output: {
              entryFileNames: 'entry-server.js',
              assetFileNames: 'assets/[name][extname]',
            },
          },
        }
      : {}),
    sourcemap: false,
    minify: true,
    polyfillModulePreload: false,
    polyfillDynamicImport: false,
    cssCodeSplit: mode !== 'render',
    reportCompressedSize: true,
  },
  resolve:
    mode === 'render'
      ? {
          alias: [
            {
              find: /^@codeimage\/ui$/,
              replacement: fileURLToPath(
                new URL('../../packages/ui/src/index.tsx', import.meta.url),
              ),
            },
          ],
        }
      : undefined,
  ssr: mode === 'render' ? {noExternal: true} : undefined,
  optimizeDeps: {
    include: ['@codemirror/state', '@codemirror/view', '@codemirror/language'],
  },
}));

export default config;
