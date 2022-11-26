import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    cssCodeSplit: true,
  },
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
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codeimage/highlight',
      '@codemirror/lang-javascript',
    ],
  },
});
