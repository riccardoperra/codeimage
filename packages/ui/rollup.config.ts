import {defineConfig, ModuleFormat, OutputOptions, RollupOptions} from 'rollup';
import {dependencies, peerDependencies} from './package.json';
import withSolid from './tools/with-solid';

const externals = [
  ...Object.keys(peerDependencies),
  ...Object.keys(dependencies),
  'solid-js/web',
  'solid-js/store',
  '@vanilla-extract/recipes/createRuntimeFn',
];

function buildOutput(format: ModuleFormat): OutputOptions {
  return {
    preserveModules: true,
    preserveModulesRoot: 'src',
    assetFileNames({name}) {
      return name!.replace(/^src\//, '');
    },
    exports: 'named',
    dir: `./dist/${format}`,
    format: format,
  };
}

const solidConfig = withSolid({
  input: {
    index: 'src/index.tsx',
    'lightTheme.css': './src/lib/themes/light-theme.css.ts',
    'darkTheme.css': './src/lib/themes/dark-theme.css.ts',
  },
  targets: ['esm', 'cjs'],
  external: externals,
  output: [buildOutput('esm'), buildOutput('cjs')],
});

export default defineConfig(solidConfig as RollupOptions);
