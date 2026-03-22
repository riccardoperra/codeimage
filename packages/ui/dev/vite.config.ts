import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {withStaticVercelPreview} from '../../../scripts/vercel-output-build';

export const viteConfig = defineConfig({
  plugins: [solidPlugin(), vanillaExtractPlugin(), withStaticVercelPreview()],
});

export default viteConfig;
