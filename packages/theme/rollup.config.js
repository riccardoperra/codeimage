import {defineConfig} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import * as pkg from './package.json';

const themes = [
  'arc-dark',
  'coldark',
  'dracula',
  'duotone-dark',
  'duotone-sea',
  'holi',
  'light',
  'material-light',
  'material-ocean',
  'material-palenight',
  'material-volcano',
  'night-owl',
  'one-dark',
  'synthwave84',
  'vscode-dark',
];

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig({
  input: themes.reduce(
    (acc, theme) => ({
      ...acc,
      index: 'src/public-api.ts',
      [theme]: 'src/lib/themes/' + theme + '/index.ts',
    }),
    {},
  ),
  external,
  plugins: [
    typescript({
      declarationDir: 'dist/source',
    }),
  ],
  output: {
    dir: 'dist',
    assetFileNames: source => source.name,
    format: 'es',
    sourcemap: true,
  },
});
