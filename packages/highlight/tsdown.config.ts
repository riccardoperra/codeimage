import {readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'tsdown';

const themesPath = path.resolve(import.meta.dirname, 'src/lib/themes');
const pkg = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const themes = readdirSync(themesPath).filter(file =>
  statSync(path.join(themesPath, file)).isDirectory(),
);

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  '@primer/primitives/dist/ts/colors/dark',
  '@primer/primitives/dist/ts/colors/light',
  '@primer/primitives/dist/ts/colors/dark_dimmed',
  /@codemirror/
];

const themeEntries = themes.reduce<Record<string, string>>((acc, theme) => {
  acc[`lib/themes/${theme}/index`] = `src/lib/themes/${theme}/index.ts`;
  return acc;
}, {});

export default defineConfig({
  entry: {
    index: 'src/public-api.ts',
    'lib/themes/index': 'src/lib/themes/index.ts',
    ...themeEntries,
  },
  format: ['esm'],
  platform: 'neutral',
  unbundle: true,
  dts: true,
  clean: true,
  sourcemap: false,
  deps: {
    neverBundle: external
  },
});
