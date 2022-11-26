import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import ssg from 'solid-start-static';
import solid from 'solid-start/vite';
import {defineConfig, Plugin} from 'vite';

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
    mergeCssPlugin(),
  ],
  optimizeDeps: {
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/lang-javascript',
    ],
  },
});

function mergeCssPlugin(): Plugin {
  return {
    name: 'fix-single-file-imports',
    enforce: 'post',
    renderChunk(code, options) {
      // I need to remove every css chunk in order to put the styles into the <style id="css-critical-style"> tag.
      // Vite cssSplitCss is broken since files are imported in the wrong order
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
