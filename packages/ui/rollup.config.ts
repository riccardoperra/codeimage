import {vanillaExtractPlugin} from '@vanilla-extract/rollup-plugin';
import type {ModuleFormat, OutputOptions, RollupOptions} from 'rollup';
import {defineConfig} from 'rollup';
import {dependencies, peerDependencies} from './package.json';
import withSolid from './tools/with-solid';

const externals = [
  ...Object.keys(peerDependencies),
  ...Object.keys(dependencies),
  'solid-js/web',
  'solid-js/store',
  '@vanilla-extract/recipes/createRuntimeFn',
  '@vanilla-extract/sprinkles/createRuntimeSprinkles',
  'solid-use/props',
];

const solidConfig = withSolid({
  input: {
    index: 'src/index.tsx',
    'lightTheme.css': './src/lib/themes/light-theme.css.ts',
    'darkTheme.css': './src/lib/themes/dark-theme.css.ts',
  },
  targets: ['esm', 'cjs'],
  external: externals,
  output: [buildOutput('esm')],
  plugins: [
    vanillaExtractPlugin(),
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
