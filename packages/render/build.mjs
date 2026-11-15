import {SIGNATURE_FONT} from '../../apps/codeimage/src/core/configuration/signature-fonts.ts';
import {existsSync} from 'node:fs';
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

const packageDir = pkg => dirname(require.resolve(`${pkg}/package.json`));
const fontsource = (pkg, ...stylesheets) => ({
  kind: 'fontsource',
  pkg,
  stylesheets,
  license: join(packageDir(pkg), 'LICENSE'),
});
const packageFont = (pkg, file, license) => ({
  kind: 'file',
  path: join(packageDir(pkg), file),
  license: join(packageDir(pkg), license),
});
const appFont = (file, weight) => {
  const path = join(appRoot, 'public/assets/fonts', file);
  const license = join(dirname(path), 'OFL.txt');
  return {
    kind: 'file',
    path,
    weight,
    license: existsSync(license) ? license : undefined,
  };
};

const FONT_SOURCES = {
  'jetbrains-mono': [
    fontsource('@fontsource-variable/jetbrains-mono', 'index.css'),
  ],
  'fira-code': [fontsource('@fontsource-variable/fira-code', 'index.css')],
  'source-code-pro': [
    fontsource('@fontsource-variable/source-code-pro', 'index.css'),
  ],
  'overpass-mono': [
    fontsource('@fontsource-variable/overpass-mono', 'index.css'),
  ],
  'cascadia-code': [
    fontsource('@fontsource-variable/cascadia-code', 'index.css'),
  ],
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
  ui: [packageFont('inter-ui', 'variable/InterVariable.woff2', 'LICENSE.txt')],
};

// Families for glyphs the app fonts lack, in the order Takumi tries them. The
// renderer bundles them instead of reading host fonts, so every machine draws
// the same image. Twemoji (OFL font, CC-BY 4.0 art) draws emoji and flags. Noto
// Sans SC (Chinese, kana) and Noto Sans KR (Hangul) are OFL variable fonts.
const FALLBACK_FONTS = [
  {
    family: 'Twemoji',
    sources: [packageFont('twemoji-colr-font', 'twemoji.woff2', 'LICENSE')],
  },
  {
    family: 'Noto Sans SC',
    sources: [fontsource('@fontsource-variable/noto-sans-sc', 'index.css')],
  },
  {
    family: 'Noto Sans KR',
    sources: [fontsource('@fontsource-variable/noto-sans-kr', 'index.css')],
  },
];

function parseUnicodeRange(value) {
  return value.split(',').map(range => {
    const [start, end = start] = range.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(start, 16), parseInt(end, 16)];
  });
}

async function fontsourceFaces({pkg, stylesheets}) {
  const pkgDir = packageDir(pkg);
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

async function copyFonts(name, sources) {
  const files = [];
  for (const source of sources) {
    const faces =
      source.kind === 'fontsource' ? await fontsourceFaces(source) : [source];
    for (const {path, weight, unicodeRange} of faces) {
      const file = basename(path);
      await copyFile(path, join(fontsDir, file));
      files.push({file, weight, unicodeRange});
    }
    if (source.license) {
      await copyFile(
        source.license,
        join(fontsDir, 'licenses', `${name}-${basename(source.license)}`),
      );
    }
  }
  return files;
}

async function buildFonts(supportedFontIds) {
  const missing = supportedFontIds.filter(id => !(id in FONT_SOURCES));
  if (missing.length) {
    throw new Error(`No font files for app fonts: ${missing.join(', ')}`);
  }
  await mkdir(join(fontsDir, 'licenses'), {recursive: true});
  const manifest = {fonts: {}, fallbacks: [], faces: []};
  for (const [id, sources] of Object.entries(FONT_SOURCES)) {
    manifest.fonts[id] = await copyFonts(id, sources);
  }
  for (const {family, sources} of FALLBACK_FONTS) {
    const name = family.toLowerCase().replaceAll(' ', '-');
    manifest.fallbacks.push({family, files: await copyFonts(name, sources)});
  }
  manifest.faces.push({
    family: SIGNATURE_FONT.family,
    files: await copyFonts(
      'signature',
      SIGNATURE_FONT.faces.map(face => ({
        ...appFont(face.path.slice('/assets/fonts/'.length)),
        unicodeRange: parseUnicodeRange(face.unicodeRange),
      })),
    ),
  });
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
