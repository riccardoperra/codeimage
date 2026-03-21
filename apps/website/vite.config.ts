import {devtools} from '@tanstack/devtools-vite';

import {tanstackStart} from '@tanstack/solid-start/plugin/vite';
import {defineConfig} from 'vite';

import solidPlugin from 'vite-plugin-solid';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    solidPlugin({ssr: true}),
  ],
});
