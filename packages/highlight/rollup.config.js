import typescript from '@rollup/plugin-typescript';
import {readdirSync, rmSync, statSync} from 'fs';
import {posix} from 'path';
import {defineConfig} from 'rollup';
import * as pkg from './package.json';

const {normalize} = posix;

const themesPath = posix.join(__dirname, 'src/lib/themes');

const themes = readdirSync(themesPath).filter(file =>
  statSync(posix.join(themesPath, file)).isDirectory(),
);

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  '@primer/primitives/dist/ts/colors/dark',
  '@primer/primitives/dist/ts/colors/light',
  '@primer/primitives/dist/ts/colors/dark_dimmed',
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
