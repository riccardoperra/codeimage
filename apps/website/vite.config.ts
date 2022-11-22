import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig} from 'vite';

const enableSsr = !process.env.ENABLE_VERCEL_BUILD;

export default defineConfig({
  plugins: [
    solid({adapter: ssg(), prerenderRoutes: ['/']}),
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ['solid-js/web'],
        loader: {
          '.css.ts.vanilla.css': 'text',
        },
      },
    }),
  ],
  optimizeDeps: {
    // Add both @codemirror/state and @codemirror/view to included deps to optimize
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/lang-javascript',
    ],
  },
});
