/**
 * Original code by SEEK
 * MIT Licensed, Copyright(c) 2021 SEEK, see LICENSE.remix.md for details
 *
 * Credits to the SEEK team:
 * https://github.com/seek-oss/vanilla-extract/blob/master/packages/vite-plugin/src/postcss.ts
 */

import type {Plugin, ProcessOptions} from 'postcss';
import type {ResolvedConfig} from 'vite';

export interface PostCSSConfigResult {
  options: ProcessOptions;
  plugins: Plugin[];
}

// Mostly copied from vite's implementation
// https://github.com/vitejs/vite/blob/efec70f816b80e55b64255b32a5f120e1cf4e4be/packages/vite/src/node/plugins/css.ts
export const resolvePostcssConfig = async (
  config: ResolvedConfig,
): Promise<PostCSSConfigResult | null> => {
  // inline postcss config via vite config
  const inlineOptions = config.css?.postcss;
  const inlineOptionsIsString = typeof inlineOptions === 'string';

  if (inlineOptions && !inlineOptionsIsString) {
    const options = {...inlineOptions};

    delete options.plugins;
    return {
      options,
      // @ts-expect-error - Cannot merge that interface
      plugins: inlineOptions.plugins || [],
    };
  } else {
    try {
      const searchPath =
        typeof inlineOptions === 'string' ? inlineOptions : config.root;

      const postCssConfig = await (
        await import('postcss-load-config')
      ).default({}, searchPath);

      return {
        options: postCssConfig.options,
        // @ts-expect-error - The postcssrc options don't agree with real postcss, but it should be ok
        plugins: postCssConfig.plugins,
      };
    } catch (e: any) {
      if (!/No PostCSS Config found/.test(e.message)) {
        throw e;
      }
      return null;
    }
  }
};
