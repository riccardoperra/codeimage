import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {basename, dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build as tsdown} from 'tsdown';
import {build as vite} from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const appRoot = join(root, '../../apps/codeimage');
const dist = join(root, 'dist');
const fontsDir = join(dist, 'fonts');
const require = createRequire(import.meta.url);

const fontsource = (pkg, ...stylesheets) => ({kind: 'fontsource', pkg, stylesheets});
const appFont = (file, weight) => ({kind: 'file', path: join(appRoot, 'public/assets/fonts', file), weight});

const FONT_SOURCES = {
  'jetbrains-mono': [fontsource('@fontsource-variable/jetbrains-mono', 'index.css')],
  'fira-code': [fontsource('@fontsource-variable/fira-code', 'index.css')],
  'source-code-pro': [fontsource('@fontsource-variable/source-code-pro', 'index.css')],
  'overpass-mono': [fontsource('@fontsource-variable/overpass-mono', 'index.css')],
  'cascadia-code': [fontsource('@fontsource-variable/cascadia-code', 'index.css')],
  'space-mono': [fontsource('@fontsource/space-mono', '400.css', '700.css')],
  'geist-mono': [appFont('geist_mono/GeistMono[wght].ttf')],
  'ibm-plex-mono': [
    appFont('IBM_Plex_Mono/IBMPlexMono-Regular.ttf', 400),
    appFont('IBM_Plex_Mono/IBMPlexMono-SemiBold.ttf', 500),
    appFont('IBM_Plex_Mono/IBMPlexMono-Bold.ttf', 600),
  ],
  agave: [appFont('agave/Agave-Regular.ttf', 400)],
  ...Object.fromEntries(
    ['Argon', 'Krypton', 'Neon', 'Radon', 'Xenon'].map(name => [
      `monaspace-${name}`,
      [appFont(`monaspace/Monaspace${name}VarVF[wght,wdth,slnt].ttf`)],
    ]),
  ),
  ui: [
    {
      kind: 'file',
      path: join(dirname(require.resolve('inter-ui/package.json')), 'variable/InterVariable.woff2'),
    },
  ],
};

function parseUnicodeRange(value) {
  return value.split(',').map(range => {
    const [start, end = start] = range.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(start, 16), parseInt(end, 16)];
  });
}

async function fontsourceFaces({pkg, stylesheets}) {
  const pkgDir = dirname(require.resolve(`${pkg}/package.json`));
  const faces = [];
  for (const stylesheet of stylesheets) {
    const css = await readFile(join(pkgDir, stylesheet), 'utf8');
    for (const [, body] of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
      const src = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(body)[1];
      const weight = /font-weight:\s*(\d+);/.exec(body)?.[1];
      const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1];
      faces.push({
        path: join(pkgDir, 'files', src),
        weight: weight ? Number(weight) : undefined,
        unicodeRange: range ? parseUnicodeRange(range) : undefined,
      });
    }
  }
  return faces;
}

async function buildFonts(supportedFontIds) {
  const missing = supportedFontIds.filter(id => !(id in FONT_SOURCES));
  if (missing.length) {
    throw new Error(`No font files for app fonts: ${missing.join(', ')}`);
  }
  await mkdir(fontsDir, {recursive: true});
  const manifest = {};
  for (const [id, sources] of Object.entries(FONT_SOURCES)) {
    manifest[id] = [];
    for (const source of sources) {
      const faces = source.kind === 'fontsource' ? await fontsourceFaces(source) : [source];
      for (const {path, weight, unicodeRange} of faces) {
        const file = basename(path);
        await copyFile(path, join(fontsDir, file));
        manifest[id].push({file, weight, unicodeRange});
      }
    }
  }
  await writeFile(join(fontsDir, 'manifest.json'), JSON.stringify(manifest));
}

await rm(dist, {recursive: true, force: true});
await vite({
  root: appRoot,
  configFile: join(appRoot, 'vite.config.ts'),
  mode: 'render',
  logLevel: 'warn',
});
const {SUPPORTED_FONT_IDS} = await import(
  pathToFileURL(join(dist, 'ssr/entry-server.js')).href
);
await buildFonts(SUPPORTED_FONT_IDS);
await tsdown({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: false,
  tsconfig: 'tsconfig.json',
});
