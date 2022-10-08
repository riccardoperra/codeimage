import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import {withStaticVercelPreview} from '../../../scripts/vercel-output-build';

export const viteConfig = defineConfig({
  plugins: [vanillaExtractPlugin(), solidPlugin(), withStaticVercelPreview()],
});

export default viteConfig;
