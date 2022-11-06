import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import vercel from 'solid-start-vercel';
import solid from 'solid-start/vite';
import {defineConfig} from 'vite';

const enableSsr = !process.env.ENABLE_VERCEL_BUILD;

export default defineConfig({
  plugins: [
    solid({ssr: enableSsr, adapter: vercel()}),
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ['solid-js/web'],
        loader: {
          '.css.ts.vanilla.css': 'text',
        },
      },
    }),
  ],
});
