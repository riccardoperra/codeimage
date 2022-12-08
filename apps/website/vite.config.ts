import {vanillaExtractPlugin as customVanillaExtractPlugin} from '@codeimage/vanilla-extract';
import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import fs from 'node:fs';
import path from 'node:path';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig, Plugin} from 'vite';

export default defineConfig({
  build: {
    cssCodeSplit: true,
  },
  plugins: [
    vanillaExtractPlugin({
      esbuildOptions: {
        external: ['solid-js/web', 'solid-headless'],
        // plugins: [
        //   {
        //     name: 'build-xt',
        //     setup(build) {
        //       build.onLoad(
        //         {filter: /.css.ts.vanilla.css$/},
        //         async ({path: path$1}) => {
        //           const css = await fs.promises.readFile(path$1, 'utf-8');
        //           return {
        //             contents: css,
        //             loader: 'text',
        //             resolveDir: path.dirname(path$1),
        //           };
        //         },
        //       );
        //     },
        //   },
        // ],
      },
    }),
    solid({adapter: ssg(), prerenderRoutes: ['/']}),
    mergeCssPlugin(),
  ],
  optimizeDeps: {
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/lang-javascript',
      '@codeimage/highlight',
    ],
    force: true,
  },
});

function mergeCssPlugin(): Plugin {
  return {
    name: 'fix-single-file-imports',
    enforce: 'post',
    renderChunk(code, options) {
      // I need to remove every css chunk in order to put the styles into the <style id="css-critical-style"> tag.
      // Vite cssSplitCss is broken since files are imported in the wrong order.
      // The next step is to call the extract-static-css script
      if (options['viteMetadata']) {
        const importedCss = options['viteMetadata']['importedCss'] as
          | Set<string>
          | undefined;
        if (importedCss) {
          importedCss.clear();
        }
      }
      return {
        code,
      };
    },
  };
}
