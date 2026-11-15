import {rm} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build as tsdown} from 'tsdown';
import {build as vite} from 'vite';
import {buildFonts} from './build-fonts.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const appRoot = join(root, '../../apps/codeimage');
const dist = join(root, 'dist');
const fontsDir = join(dist, 'fonts');

await rm(dist, {recursive: true, force: true});
await tsdown({
  entry: ['src/watermark.ts'],
  format: 'esm',
  dts: true,
  clean: false,
  tsconfig: 'tsconfig.json',
});
await vite({
  root: appRoot,
  configFile: join(appRoot, 'vite.config.ts'),
  mode: 'render',
  logLevel: 'warn',
});
const {SUPPORTED_FONTS} = await import(
  pathToFileURL(join(dist, 'ssr/entry-server.js')).href
);
await buildFonts(SUPPORTED_FONTS, fontsDir);
await tsdown({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: false,
  tsconfig: 'tsconfig.json',
});
