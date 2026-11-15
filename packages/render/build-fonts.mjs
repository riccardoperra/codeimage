import {SIGNATURE_FONT} from '../../apps/codeimage/src/core/configuration/signature-fonts.ts';
import {existsSync} from 'node:fs';
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {basename, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {create} from 'fontkit';
import postcss from 'postcss';
import {fontManifestSchema} from './src/fontManifest.ts';

const root = dirname(fileURLToPath(import.meta.url));
const appRoot = join(root, '../../apps/codeimage');
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
  pkg,
  file,
});
const appFont = (file, weight) => {
  const path = join(appRoot, 'public/assets/fonts', file);
  const license = join(dirname(path), 'OFL.txt');
  return {
    kind: 'file',
    path,
    file,
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
    fontsource('@fontsource/ibm-plex-mono', '400.css', '600.css', '700.css'),
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

export function parseUnicodeRange(value) {
  return value.split(',').map(range => {
    const [start, end = start] = range.trim().replace(/^U\+/i, '').split('-');
    return [
      parseInt(start.replaceAll('?', '0'), 16),
      parseInt(end.replaceAll('?', 'f'), 16),
    ];
  });
}

async function fontsourceFaces({pkg, stylesheets}) {
  const pkgDir = packageDir(pkg);
  const faces = [];
  for (const stylesheet of stylesheets) {
    const css = postcss.parse(await readFile(join(pkgDir, stylesheet), 'utf8'));
    css.walkAtRules('font-face', rule => {
      const declarations = Object.fromEntries(
        rule.nodes
          .filter(node => node.type === 'decl')
          .map(node => [node.prop, node.value]),
      );
      if (declarations['font-style'] !== 'normal') return;
      const src = /url\(['"]?\.\/files\/([^)'" ]+\.woff2)/.exec(
        declarations.src,
      )?.[1];
      if (!src) throw new Error(`Unsupported font source: ${declarations.src}`);
      const weight = /^\d+$/.test(declarations['font-weight'])
        ? Number(declarations['font-weight'])
        : undefined;
      faces.push({
        path: join(pkgDir, 'files', src),
        file: `files/${src}`,
        weight:
          pkg === '@fontsource/ibm-plex-mono'
            ? {400: 400, 600: 500, 700: 600}[weight]
            : weight,
        unicodeRange: declarations['unicode-range']
          ? parseUnicodeRange(declarations['unicode-range'])
          : undefined,
      });
    });
  }
  return faces;
}

export function coverage(bytes, declared) {
  const points = create(bytes)
    .characterSet.filter(
      point =>
        !declared ||
        declared.some(([start, end]) => point >= start && point <= end),
    )
    .sort((a, b) => a - b);
  const ranges = [];
  for (const point of points) {
    const last = ranges.at(-1);
    if (last && point <= last[1] + 1) last[1] = point;
    else ranges.push([point, point]);
  }
  return ranges;
}

// This main commit contains the exact app-hosted variable fonts and signature Inter.
export const APP_FONTS_COMMIT = 'dffa7f6c3de707c8829f7501e4d2dc36de96705f';

export async function buildFonts(supportedFonts, fontsDir) {
  const dependencies = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  ).devDependencies;
  const codeIds = supportedFonts.map(font => font.id);
  if (
    codeIds.some(id => !(id in FONT_SOURCES)) ||
    Object.keys(FONT_SOURCES).some(id => id !== 'ui' && !codeIds.includes(id))
  )
    throw new Error('Font recipes differ from app font inventory');
  const recipes = [
    ...Object.entries(FONT_SOURCES).map(([id, sources]) => ({
      id,
      family:
        id === 'ui'
          ? 'Inter var'
          : supportedFonts.find(font => font.id === id).name,
      role: id === 'ui' ? 'ui' : 'code',
      sources,
    })),
    {
      id: 'signature',
      family: SIGNATURE_FONT.family,
      role: 'ui',
      sources: SIGNATURE_FONT.faces.map(face => ({
        ...appFont(face.path.slice('/assets/fonts/'.length)),
        unicodeRange: parseUnicodeRange(face.unicodeRange),
      })),
    },
    ...FALLBACK_FONTS.map(font => ({
      ...font,
      id: font.family.toLowerCase().replaceAll(' ', '-'),
      role: 'fallback',
    })),
  ];
  const manifest = {schema: 1, fonts: []};
  await mkdir(join(fontsDir, 'licenses'), {recursive: true});
  for (const {id, family, role, sources} of recipes) {
    const bundled =
      id === 'ui' || id === 'signature' || id === 'jetbrains-mono';
    const font = {
      id,
      family,
      label: id === 'ui' ? 'Inter' : family,
      role,
      source: '',
      files: [],
    };
    for (const source of sources) {
      let version;
      if (source.pkg) {
        version = JSON.parse(
          await readFile(join(packageDir(source.pkg), 'package.json'), 'utf8'),
        ).version;
        if (dependencies[source.pkg] !== version)
          throw new Error(`Pin mismatch for ${source.pkg}: ${version}`);
      }
      font.source = source.pkg
        ? `${source.pkg}@${version}`
        : `codeimage@${APP_FONTS_COMMIT}`;
      const faces =
        source.kind === 'fontsource' ? await fontsourceFaces(source) : [source];
      for (const face of faces) {
        const bytes = await readFile(face.path);
        const file = basename(face.path);
        const url = bundled
          ? null
          : source.pkg
            ? `https://cdn.jsdelivr.net/npm/${source.pkg}@${version}/${face.file}`
            : `https://raw.githubusercontent.com/riccardoperra/codeimage/${APP_FONTS_COMMIT}/apps/codeimage/public/assets/fonts/${encodeURI(face.file)}`;
        font.files.push({
          file,
          bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          weight: face.weight,
          unicodeRange: coverage(bytes, face.unicodeRange),
          declaredRange: face.unicodeRange,
          url,
        });
        if (bundled) await copyFile(face.path, join(fontsDir, file));
      }
      if (bundled && source.license)
        await copyFile(
          source.license,
          join(fontsDir, 'licenses', `${id}-${basename(source.license)}`),
        );
    }
    manifest.fonts.push(font);
  }
  const parsed = fontManifestSchema.parse(manifest);
  await writeFile(join(fontsDir, 'manifest.json'), JSON.stringify(parsed));
  return parsed;
}
