import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';

export const viteConfig = defineConfig({
  plugins: [vanillaExtractPlugin(), solidPlugin()],
});

export default viteConfig;
