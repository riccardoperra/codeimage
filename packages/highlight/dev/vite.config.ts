import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';

export const viteConfig = defineConfig({
  plugins: [vanillaExtractPlugin(), solidPlugin()],
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
