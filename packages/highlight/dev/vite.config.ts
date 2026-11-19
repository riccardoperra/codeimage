import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import type {Plugin} from 'vite';
import {defineConfig} from 'vite';
import solidPlugin from '@solidjs/vite-plugin';
import {withStaticVercelPreview} from '../../../scripts/vercel-output-build';

export const viteConfig = defineConfig({
  plugins: [
    vanillaExtractPlugin({
      unstable_mode: 'transform',
    }),
    solidPlugin(),
    withStaticVercelPreview() as unknown as Plugin,
  ],
  resolve: {
    dedupe: [
      'solid-js',
      '@solidjs/web',
      '@codemirror/state',
      '@codemirror/view',
    ],
  },
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
