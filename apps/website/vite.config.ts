import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig} from 'vite';
import {withStaticVercelPreview} from '../../scripts/vercel-output-build';

const enableSsr = !process.env.ENABLE_VERCEL_BUILD;

export default defineConfig({
  plugins: [
    solid({ssr: enableSsr, adapter: ssg()}),
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ['solid-js/web'],
        loader: {
          '.css.ts.vanilla.css': 'text',
        },
      },
    }),
    withStaticVercelPreview() as unknown as Plugin,
  ],
});
