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

let bundleSource = false;

const solidConfig = withSolid({
  input: {
    index: 'src/index.tsx',
    'lightTheme.css': './src/lib/themes/light-theme.css.ts',
    'darkTheme.css': './src/lib/themes/dark-theme.css.ts',
  },
  treeshake: 'smallest',
  targets: ['esm', 'cjs'],
  external: externals,
  output: [buildOutput('esm'), buildOutput('cjs')],
  plugins: [
    vanillaExtractPlugin(),
    {
      name: 'generate-vanilla-extract-source',
      async writeBundle() {
        if (bundleSource) {
          return;
        }
        bundleSource = true;
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
              const emittedFiles = new Map();
              const cssFileFilter = /\.css\.(js|mjs|jsx|ts|tsx)(\?used)?$/;
              return {
                name: 'transfer-vanilla-extract-source',
                buildStart() {
                  emittedFiles.clear();
                },
                async renderChunk(code, info) {
                  const id = info.facadeModuleId ?? '';
                  if (!cssFileFilter.test(id)) {
                    return;
                  }
                  const index = id.indexOf('?');
                  const filePath = index === -1 ? id : id.substring(0, index);
                  const resolvedPath = filePath.split(path.sep).join('/');
                  const builtPath = resolvedPath.replace(
                    '/dist/source/',
                    '/dist/esm/',
                  );

                  const jsFile = builtPath.replace(/\.js$/, '.vanilla.js');
                  const cssFile = builtPath.replace(/\.js$/, '.ts.vanilla.css');

                  try {
                    const jsCode = fs.readFileSync(jsFile, {
                      encoding: 'utf8',
                    });
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
                    return {
                      code: jsCode,
                    };
                  } catch (e) {}
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
          moduleSideEffects: 'no-treeshake',
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
