import typescript from '@rollup/plugin-typescript';
import {vanillaExtractPlugin} from '@vanilla-extract/rollup-plugin';
import fs from 'fs';
import path from 'path';
import {
  defineConfig,
  ModuleFormat,
  OutputOptions,
  rollup,
  RollupOptions,
} from 'rollup';
import {dependencies, peerDependencies} from './package.json';
import {preserveJsxImports} from './tools/preserve-jsx-imports';
import withSolid from './tools/with-solid';

const externals = [
  ...Object.keys(peerDependencies),
  ...Object.keys(dependencies),
  'solid-js/web',
  'solid-js/store',
  '@vanilla-extract/recipes/createRuntimeFn',
  '@vanilla-extract/sprinkles/createRuntimeSprinkles',
];

const cssFileFilter = /\.css\.(js|mjs|jsx|ts|tsx)(\?used)?$/;

const solidConfig = withSolid({
  input: {
    index: 'src/index.tsx',
    'lightTheme.css': './src/lib/themes/light-theme.css.ts',
    'darkTheme.css': './src/lib/themes/dark-theme.css.ts',
  },
  treeshake: 'recommended',
  targets: ['esm', 'cjs'],
  external: externals,
  output: [buildOutput('esm'), buildOutput('cjs')],
  plugins: [
    vanillaExtractPlugin(),
    {
      name: 'generate-vanilla-extract-source',
      async closeBundle() {
        const build = await rollup({
          input: {
            index: 'dist/source/index.jsx',
            'lightTheme.css': 'dist/source/lib/themes/light-theme.css.js',
            'darkTheme.css': 'dist/source/lib/themes/dark-theme.css.js',
          },
          treeshake: false,
          external: externals,
          plugins: [
            typescript({tsconfig: './tsconfig.source.json'}),
            preserveJsxImports(),
            (() => {
              let themes: Record<string, string> = {};
              return {
                name: 'transfer-vanilla-extract-source',
                options(options) {
                  if (options.input) {
                    if (typeof options.input === 'object') {
                      themes = Object.entries(options.input).reduce(
                        (acc, [key, value]) => {
                          if (value.endsWith('.css.js')) {
                            acc[key] = value;
                          }
                          return acc;
                        },
                        {} as Record<string, string>,
                      );
                    }
                  }
                  return options;
                },
                async renderChunk(code, info) {
                  const id = info.facadeModuleId ?? '';
                  if (!cssFileFilter.test(id)) {
                    return;
                  }
                  const index = id.indexOf('?');
                  const filePath = index === -1 ? id : id.substring(0, index);
                  const resolvedPath = filePath.split(path.sep).join('/');

                  let builtPath = resolvedPath.replace(
                    '/dist/source/',
                    '/dist/esm/',
                  );
                  const cssFile = builtPath.replace(/\.js$/, '.ts.vanilla.css');

                  let jsFile: string;
                  if (info.isEntry) {
                    const parsedFileName = path.parse(info.fileName);
                    const parsedFacadeModuleId = path.parse(id);
                    parsedFacadeModuleId.name = parsedFileName.name;
                    parsedFacadeModuleId.base = `${parsedFileName.name}${parsedFileName.ext}`;
                    jsFile = path
                      .format(parsedFacadeModuleId)
                      .split(path.sep)
                      .join('/')
                      .replace('/dist/source/', '/dist/esm/');
                  } else {
                    jsFile = builtPath.replace(/\.js$/, '.vanilla.js');
                  }

                  try {
                    const jsCode = fs.readFileSync(jsFile, {
                      encoding: 'utf8',
                    });

                    if (fs.existsSync(cssFile)) {
                      const cssCode = fs.readFileSync(cssFile, {
                        encoding: 'utf8',
                      });
                      const cssParsedPath = path.parse(cssFile);
                      const chunkPath = path.parse(info.fileName);

                      this.emitFile({
                        type: 'asset',
                        source: cssCode,
                        fileName: `${chunkPath.dir}/${cssParsedPath.name}${cssParsedPath.ext}`,
                      });
                    }
                    return {
                      code: jsCode,
                    };
                  } catch (e) {
                    console.log(e);
                  }
                },
              };
            })(),
          ],
        });
        await build.write({
          dir: './dist/source-gen',
          preserveModules: true,
          preserveModulesRoot: 'dist/source',
          exports: 'named',
          entryFileNames({name}) {
            return `${name.replace(/\.css$/, '.css.vanilla')}.[ext]`;
          },
          assetFileNames({name}) {
            return name?.replace(/^dist\/source\//, '') ?? '';
          },
        });
      },
    },
    {
      name: 'no-treeshake',
      transform() {
        return {
          moduleSideEffects: false,
        };
      },
    },
  ],
});

function buildOutput(format: ModuleFormat): OutputOptions {
  return {
    preserveModules: true,
    preserveModulesRoot: 'src',
    assetFileNames({name}) {
      return name?.replace(/^src\//, '') ?? '';
    },
    entryFileNames({name}) {
      return `${name.replace(/\.css$/, '.css.vanilla')}.js`;
    },
    exports: 'named',
    dir: `./dist/${format}`,
    format: format,
  };
}

export default defineConfig(solidConfig as RollupOptions);
