import {vanillaExtractPlugin} from '@vanilla-extract/vite-plugin';
import {nodeTypes} from '@mdx-js/mdx';
import mdx from '@mdx-js/rollup';
import fs from 'node:fs';
import path from 'node:path';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import type {Plugin, UserConfigExport} from 'vite';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import {withStaticVercelPreview} from '../../scripts/vercel-output-build';
import alias from 'esbuild-plugin-alias';

const config: UserConfigExport = defineConfig(({mode}) => ({
  plugins: [
    {
      ...mdx({
        jsx: true,
        jsxImportSource: 'solid-js',
        providerImportSource: 'solid-mdx',
        rehypePlugins: [rehypeSlug, [rehypeRaw, {passThrough: nodeTypes}]],
      }),
      enforce: 'pre',
    },
    vanillaExtractPlugin({
      unstable_mode: 'transform',
      // esbuildOptions: {
      external: ['solid-js/web'],
      plugins: [
        alias({
          'solid-js/web': require.resolve('solid-js/web/dist/server.js'),
        }),
        {
          name: 'esbuild-vanilla-extract-fix-solid-call',
          setup(build) {
            const loaderByExtension: Record<
              string,
              'ts' | 'tsx' | 'js' | 'jsx'
            > = {
              '.ts': 'ts',
              '.tsx': 'tsx',
              '.js': 'js',
              '.jsx': 'jsx',
            };

            build.onLoad({filter: /\.[jt]sx?$/}, async ({path: path$1}) => {
              const source = await fs.promises.readFile(path$1, 'utf-8');
              if (
                !source.includes("from 'solid-js/web'") &&
                !source.includes('from "solid-js/web"')
              ) {
                return;
              }

              const fakeLocals = new Set<string>();
              const transformed = source.replace(
                /import\s*\{([^}]+)\}\s*from\s*['"]solid-js\/web['"];?/g,
                (_, imports) => {
                  const remaining: string[] = [];
                  for (const rawSpecifier of imports.split(',')) {
                    const specifier = rawSpecifier.trim();
                    if (!specifier) continue;

                    const [imported, localAlias] = specifier
                      .split(/\s+as\s+/)
                      .map(s => s.trim());
                    if (imported === 'use') {
                      fakeLocals.add(localAlias || 'use');
                      continue;
                    }

                    remaining.push(specifier);
                  }

                  if (!remaining.length) {
                    return '';
                  }

                  return `import { ${remaining.join(
                    ', ',
                  )} } from 'solid-js/web';`;
                },
              );

              if (!fakeLocals.size) {
                return;
              }

              const fakeDeclarations = Array.from(fakeLocals)
                .map(localName => `const ${localName} = () => undefined;`)
                .join('\n');

              return {
                contents: `${fakeDeclarations}\n${transformed}`,
                loader: loaderByExtension[path.extname(path$1)] || 'ts',
                resolveDir: path.dirname(path$1),
              };
            });
          },
        },
        {
          name: 'esbuild-vanilla-extract-css-ts-loader',
          setup(build) {
            build.onLoad(
              {filter: /.css.ts.vanilla.css$/},
              async ({path: path$1}) => {
                if (path$1.includes('/ui/')) {
                  const css = await fs.promises.readFile(path$1, 'utf-8');
                  return {
                    contents: css,
                    loader: 'text',
                    resolveDir: path.dirname(path$1),
                  };
                }
              },
            );
          },
        },
      ],
      // },
    }),
    solidPlugin({
      extensions: ['.mdx', '.tsx', '.ts'],
    }),
    tsconfigPaths(),
    {
      name: 'html-inject-umami',
      transformIndexHtml(html) {
        const websiteId = process.env.UMAMI_WEBSITE_ID;
        const scriptSrc = process.env.UMAMI_SCRIPT_SRC;

        if (mode !== 'production' || !websiteId || !scriptSrc) return html;

        // Auto-track is off since query param push a new page view and breaks the analytics
        // TODO: Find a better solution to handle query params
        return html.replace(
          '<!-- %UMAMI% -->',
          `<script async defer data-website-id='${websiteId.trim()}' src='${scriptSrc.trim()}'></script>`,
        );
      },
    },
    {
      name: 'parse-environment-variables',

      configResolved(resolvedConfig) {
        const config = resolvedConfig as Omit<typeof resolvedConfig, 'env'> & {
          env: (typeof resolvedConfig)['env'];
        };
        const env = config.env;
        config.env = Object.keys(env).reduce((acc, key) => {
          let parsed = config.env[key];
          try {
            parsed = JSON.parse(config.env[key]);
          } catch {}
          return {
            ...acc,
            [key]: parsed,
          };
        }, {});
      },
    },
    withStaticVercelPreview() as unknown as Plugin,
  ],
  server: {
    strictPort: true,
    port: 4200,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    minify: true,
    polyfillModulePreload: false,
    polyfillDynamicImport: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
}));

export default config;
