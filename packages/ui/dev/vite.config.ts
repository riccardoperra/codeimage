import {vanillaExtractPlugin} from '@codeimage/vanilla-extract';
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

export const viteConfig = defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    solidPlugin(),
    dts({
      skipDiagnostics: false,
      logDiagnostics: true,
    }),
  ],
});

export default viteConfig;
