import typescript from '@rollup/plugin-typescript';
import {readdirSync, rmSync, statSync} from 'fs';
import {posix} from 'path';
import {defineConfig} from 'rollup';
import * as pkg from './package.json' with {type: 'json'};

const {normalize} = posix
const __dirname = import.meta.dirname;

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

const bundleInput = {
  index: 'src/public-api.ts',
  themes: 'src/lib/themes/index.ts',
  ...inputs,
}

export default defineConfig({
  input: bundleInput,
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
      if (source.isEntry) {
        const theme = themes.find(_ => path.includes(`lib/themes/${_}`));
        if (theme) {
          return `lib/themes/${theme}/index.js`
        } else {
          const path = bundleInput[source.name];
          if (path) {
            return path
              .replace('src/', '')
              .replace('.ts', '.js');
          }
        }
      }
      return "[name].js";
    },
  },
});
