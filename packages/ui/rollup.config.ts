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
            // Source folder should not be edited, but we need to manually
            // preserve custom jsx imports like styled.div
            preserveJsxImports(),
            {
              name: 'transfer-vanilla-extract-source',
              async renderChunk(code, info) {
                const id = info.facadeModuleId ?? '';
                // We need to keep untouched files that are not handled by Vanilla Extract
                if (!cssFileFilter.test(id)) {
                  return;
                }
                // The path should be resolved removing the query parameter that
                // rollup applies like ?used / ?unused
                const index = id.indexOf('?');
                const filePath = index === -1 ? id : id.substring(0, index);
                const resolvedPath = filePath.split(path.sep).join('/');

                // This is the base path that contain the generated css from vanilla-extract.
                const builtPath = resolvedPath.replace(
                  '/dist/source/',
                  '/dist/esm/',
                );

                // @vanilla-extract/rollup-plugin generate a  css file with the suffix `.ts.vanilla.css`.
                // It will be in the same folder of the js file due to preserveModules.
                const cssFile = builtPath.replace(/\.js$/, '.ts.vanilla.css');

                let jsFile: string;
                // Entry inputs should be handled in a different way
                // since the facadeModuleId is different from the file name that
                // will be used for outputting the .js file.
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

                  // Sometimes Vanilla extract doesn't generate the css file,
                  // for example when the .js file contains only css variables or
                  // something that should not be added to the stylesheet.
                  if (fs.existsSync(cssFile)) {
                    const cssCode = fs.readFileSync(cssFile, {
                      encoding: 'utf8',
                    });
                    const cssParsedPath = path.parse(cssFile);
                    const chunkPath = path.parse(info.fileName);
                    // We need to emit every css file present in the dist/esm folder
                    // that has been generated with Vanilla Extract
                    this.emitFile({
                      type: 'asset',
                      source: cssCode,
                      fileName: `${chunkPath.dir}/${cssParsedPath.name}${cssParsedPath.ext}`,
                    });
                  }
                  return {
                    code: jsCode,
                    map: info.map,
                  };
                } catch (e) {
                  console.log(e);
                }
              },
            },
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
    // This is needed in order to fix some side effects that are not resolved manually.
    // TODO: need to check this
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
