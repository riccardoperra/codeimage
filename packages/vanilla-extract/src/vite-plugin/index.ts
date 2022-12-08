/**
 * Original code by SEEK
 * MIT Licensed, Copyright(c) 2021 SEEK, see LICENSE.remix.md for details
 *
 * Credits to the SEEK team:
 * https://github.com/seek-oss/vanilla-extract/blob/master/packages/vite-plugin/src/index.ts
 */

import {
  compile,
  CompileOptions,
  cssFileFilter,
  getPackageInfo,
  IdentifierOption,
  processVanillaFile,
  transform,
} from '@vanilla-extract/integration';
import outdent from 'outdent';
import path from 'path';

import type {Plugin, ResolvedConfig, ViteDevServer} from 'vite';
import {normalizePath} from 'vite';
import {vanillaCssTsFilesLoader} from '../esbuild/vanillaCssTsFilesLoader';
import {PostCSSConfigResult, resolvePostcssConfig} from './postcss';

const styleUpdateEvent = (fileId: string) =>
  `vanilla-extract-style-update:${fileId}`;

const virtualExtCss = '.vanilla.css';
const virtualExtJs = '.vanilla.js';

interface Options {
  identifiers?: IdentifierOption;
  esbuildOptions?: CompileOptions['esbuildOptions'];
}

const coreEsbuildPlugins = [vanillaCssTsFilesLoader()];

export function vanillaExtractPlugin({
  identifiers,
  esbuildOptions,
}: Options = {}): Plugin {
  let config: ResolvedConfig;
  let server: ViteDevServer;
  let postCssConfig: PostCSSConfigResult | null;
  const cssMap = new Map<string, string>();

  // Run the plugin with solid-js compatibility
  esbuildOptions = esbuildOptions || ({} as CompileOptions['esbuildOptions']);
  if (!esbuildOptions) {
    throw new Error('Invalid esbuild options');
  }
  if (!esbuildOptions.external) {
    esbuildOptions.external = ['solid-js/web'];
  }

  esbuildOptions.plugins = [
    ...(esbuildOptions?.plugins ?? []),
    ...coreEsbuildPlugins,
  ];

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  let forceEmitCssInSsrBuild: boolean = !!process.env.VITE_RSC_BUILD;
  let packageName: string;

  // Fixes virtual file while importing from other packages in pnpm monorepo
  // Path should be normalized to be able to use HMR
  const getAbsoluteVirtualFileId = (source: string) =>
    source.startsWith('..')
      ? normalizePath(path.join(config.root, source))
      : source.startsWith('/@id/')
      ? normalizePath(path.join(config.root, source.substring(5)))
      : source;

  return {
    name: 'vanilla-extract',
    enforce: 'pre',
    configureServer(_server) {
      server = _server;
    },
    config(_userConfig, env) {
      const include =
        env.command === 'serve' ? ['@vanilla-extract/css/injectStyles'] : [];

      return {
        optimizeDeps: {include},
        ssr: {
          external: [
            '@vanilla-extract/css',
            '@vanilla-extract/css/fileScope',
            '@vanilla-extract/css/adapter',
          ],
        },
      };
    },
    async configResolved(resolvedConfig) {
      config = resolvedConfig;
      packageName = getPackageInfo(config.root).name;

      if (config.command === 'serve') {
        postCssConfig = await resolvePostcssConfig(config);
      }

      if (
        config.plugins.some(plugin =>
          ['astro:build', 'solid-start-server'].includes(plugin.name),
        )
      ) {
        forceEmitCssInSsrBuild = true;
      }
    },
    resolveId(source) {
      const [validId, query] = source.split('?');
      if (!validId.endsWith(virtualExtCss) && !validId.endsWith(virtualExtJs)) {
        return;
      }

      // Absolute paths seem to occur often in monorepos, where files are
      // imported from outside the config root.
      const absoluteId = source.startsWith(config.root)
        ? source
        : getAbsoluteVirtualFileId(validId);

      // There should always be an entry in the `cssMap` here.
      // The only valid scenario for a missing one is if someone had written
      // a file in their app using the .vanilla.js/.vanilla.css extension
      if (cssMap.has(absoluteId)) {
        // Keep the original query string for HMR.
        return absoluteId + (query ? `?${query}` : '');
      }
    },
    load(id) {
      const [validId] = id.split('?');

      if (!cssMap.has(validId)) {
        return;
      }

      const css = cssMap.get(validId);

      if (typeof css !== 'string') {
        return;
      }

      if (validId.endsWith(virtualExtCss)) {
        return css;
      }

      return outdent`
        import { injectStyles } from '@vanilla-extract/css/injectStyles';
        const inject = (css) => injectStyles({
          fileScope: ${JSON.stringify({filePath: validId})},
          css
        });
        inject(${JSON.stringify(css)});
        if (import.meta.hot) {
          import.meta.hot.on('${styleUpdateEvent(validId)}', (css) => {
            inject(css);
          });
        }
      `;
    },
    async transform(code, id, ssrParam) {
      const [validId] = id.split('?');

      if (!cssFileFilter.test(validId)) {
        return null;
      }

      const identOption =
        identifiers ?? (config.mode === 'production' ? 'short' : 'debug');

      let ssr: boolean | undefined;

      if (typeof ssrParam === 'boolean') {
        ssr = ssrParam;
      } else {
        ssr = ssrParam?.ssr;
      }

      if (ssr && !forceEmitCssInSsrBuild) {
        return transform({
          source: code,
          filePath: normalizePath(validId),
          rootPath: config.root,
          packageName,
          identOption,
        });
      }

      const {source, watchFiles} = await compile({
        filePath: validId,
        cwd: config.root,
        esbuildOptions,
        identOption,
      });

      for (const file of watchFiles) {
        // In start mode, we need to prevent the file from rewatching itself.
        // If it's a `build --watch`, it needs to watch everything.
        if (config.command === 'build' || file !== validId) {
          this.addWatchFile(file);
        }
      }

      const output = await processVanillaFile({
        source,
        filePath: validId,
        identOption:
          identifiers ?? (config.mode === 'production' ? 'short' : 'debug'),
        serializeVirtualCssPath: async ({fileScope, source}) => {
          const rootRelativeId = `${fileScope.filePath}${
            config.command === 'build' || (ssr && forceEmitCssInSsrBuild)
              ? virtualExtCss
              : virtualExtJs
          }`;
          const absoluteId = getAbsoluteVirtualFileId(rootRelativeId);

          let cssSource = source;

          if (postCssConfig) {
            const postCssResult = await (await import('postcss'))
              .default(postCssConfig.plugins)
              .process(source, {
                ...postCssConfig.options,
                from: undefined,
                map: false,
              });

            cssSource = postCssResult.css;
          }

          if (
            server &&
            cssMap.has(absoluteId) &&
            cssMap.get(absoluteId) !== source
          ) {
            const {moduleGraph} = server;
            const [module] = Array.from(
              moduleGraph.getModulesByFile(absoluteId) || [],
            );

            if (module) {
              moduleGraph.invalidateModule(module);

              // Vite uses this timestamp to add `?t=` query string automatically for HMR.
              module.lastHMRTimestamp =
                (module as any).lastInvalidationTimestamp || Date.now();
            }

            server.ws.send({
              type: 'custom',
              event: styleUpdateEvent(absoluteId),
              data: cssSource,
            });
          }

          cssMap.set(absoluteId, cssSource);

          // We use the root relative id here to ensure file contents (content-hashes)
          // are consistent across build machines
          return `import "${rootRelativeId}";`;
        },
      });

      return {
        code: output,
        map: {mappings: ''},
      };
    },
  };
}
