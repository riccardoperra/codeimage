import withSolid from 'rollup-preset-solid';
import ts from 'typescript';
import {dependencies, peerDependencies} from './package.json';

const externals = [
  ...Object.keys(peerDependencies),
  ...Object.keys(dependencies),
  'solid-js/web',
  'solid-js/store',
  '@vanilla-extract/recipes/createRuntimeFn',
];

/** @type {import('rollup').RollupOptions} */
const solidConfig = withSolid({
  input: 'src/index.tsx',
  targets: ['esm', 'cjs'],
  external: externals,
  output: [
    {
      preserveModules: true,
      preserveModulesRoot: 'src',
      // Change .css.js files to something else so that they don't get re-processed by consumer's setup
      // entryFileNames({name}) {
      //   return `${name.replace(/\.css$/, '.css.vanilla')}.js`;
      // },

      // Apply preserveModulesRoot to asset names
      assetFileNames({name}) {
        return name.replace(/^src\//, '');
      },
      exports: 'named',
      dir: './dist/esm',
      format: 'esm',
    },
    {
      preserveModules: true,
      preserveModulesRoot: 'src',
      // Change .css.js files to something else so that they don't get re-processed by consumer's setup
      // entryFileNames({name}) {
      //   return `${name.replace(/\.css$/, '.css.vanilla')}.js`;
      // },

      // Apply preserveModulesRoot to asset names
      assetFileNames({name}) {
        return name.replace(/^src\//, '');
      },

      exports: 'named',
      dir: './dist/cjs',
      format: 'cjs',
    },
  ],
});

/** @type {import('rollup').Plugin} */
const customTsPlugin = {
  name: 'ts',
  buildEnd() {
    const currentDir = process.cwd();
    const configFile = ts.findConfigFile(
      currentDir,
      ts.sys.fileExists,
      'tsconfig.json',
    );
    if (!configFile) throw Error('tsconfig.json not found');
    const {config} = ts.readConfigFile(configFile, ts.sys.readFile);

    const {options, fileNames, errors} = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      currentDir,
    );

    const program = ts.createProgram({
      options: {
        ...options,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.Preserve,
        jsxImportSource: 'solid-js',
        declarationMap: false,
        outDir: `dist/source`,
        declarationDir: 'dist/types',
      },
      rootNames: fileNames,
      configFileParsingDiagnostics: errors,
    });

    program.emit();
  },
};

solidConfig.plugins = (solidConfig.plugins || []).map(plugin => {
  if (plugin && plugin.name === 'ts') {
    return customTsPlugin;
  }
  return plugin;
});

export default solidConfig;
