import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig} from 'vite';

const enableSsr = !process.env.ENABLE_VERCEL_BUILD;

export default defineConfig({
  build: {
    cssCodeSplit: false,
  },
  plugins: [
    solid({adapter: ssg(), prerenderRoutes: ['/']}),
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ['solid-js/web', 'solid-js', 'solid-js/server'],
        loader: {
          '.css.ts.vanilla.css': 'text',
        },
      },
    }),
  ],
});
