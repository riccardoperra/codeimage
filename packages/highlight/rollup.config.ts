import {defineConfig} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import * as pkg from './package.json';
import {rmSync} from 'fs';
import {posix} from 'path';

const {normalize} = posix;

const themes = [
  'arcDark',
  'coldarkDark',
  'coldarkCold',
  'dracula',
  'duotoneDark',
  'duotoneSea',
  'holi',
  'light',
  'materialLight',
  'materialOcean',
  'materialPalenight',
  'materialVolcano',
  'nightOwl',
  'oneDark',
  'synthwave84',
  'vsCodeDark',
];

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const inputs = themes.reduce((acc, theme) => {
  return {
    ...acc,
    [theme]: `src/lib/themes/${theme}/index.ts`,
  };
}, {});

rmSync('dist', {
  force: true,
  recursive: true,
});

export default defineConfig({
  input: {
    index: 'src/public-api.ts',
    themes: 'src/lib/themes/index.ts',
    ...inputs,
  },
  external,
  plugins: [
    typescript({
      declarationDir: './dist',
    }),
  ],
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    entryFileNames: source => {
      const path = normalize(source.facadeModuleId).replaceAll('\\', '/');
      return source.isEntry && themes.some(theme => path.includes(theme))
        ? 'index.js'
        : `${source.name}.js`;
    },
  },
});
