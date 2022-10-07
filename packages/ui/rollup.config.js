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

/**
 *
 * @param {import('rollup').ModuleFormat} format
 */
function buildOutput(format) {
  return {
    preserveModules: true,
    preserveModulesRoot: 'src',
    assetFileNames({name}) {
      return name.replace(/^src\//, '');
    },
    exports: 'named',
    dir: `./dist/${format}`,
    format: format,
  };
}

/** @type {import('rollup').RollupOptions} */
const solidConfig = withSolid({
  // TODO: refactor withSolid
  input: {
    index: 'src/index.tsx',
    'lightTheme.css': './src/lib/themes/light-theme.css.ts',
    'darkTheme.css': './src/lib/themes/dark-theme.css.ts',
  },
  targets: ['esm', 'cjs'],
  external: externals,
  output: [buildOutput('esm'), buildOutput('cjs')],
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
