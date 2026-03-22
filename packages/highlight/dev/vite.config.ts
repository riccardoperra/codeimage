import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import type {Plugin} from 'vite';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {withStaticVercelPreview} from '../../../scripts/vercel-output-build';

export const viteConfig = defineConfig({
  plugins: [
    vanillaExtractPlugin({
      unstable_mode: 'transform',
    }),
    solidPlugin(),
    withStaticVercelPreview() as unknown as Plugin,
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

export default viteConfig;
