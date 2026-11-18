import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import solid2 from '@solidjs/vite-plugin';
import {build} from 'vite';
import {solid1Bridge} from '../../../../packages/vite-plugin-solid1-bridge/dist/index.js';

const fromApp = createRequire(
  new URL('../../../../apps/codeimage/package.json', import.meta.url),
);
const solid1 = fromApp('vite-plugin-solid');
const {vanillaExtractPlugin} = fromApp('@vanilla-extract/vite-plugin');
const path = name => fileURLToPath(new URL(name, import.meta.url));
const entry = path('./app.jsx');
const projectMenu = path(
  '../../../../apps/codeimage/src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu.tsx',
);

const [{output}] = await build({
  root: path('./'),
  configFile: false,
  plugins: [
    solid1Bridge({
      entries: [entry, projectMenu],
      modules: {
        '@codeui/kit': {standalone: ['Button'], compound: ['DropdownMenu']},
        '@kobalte/core/dropdown-menu': {compound: ['DropdownMenu']},
      },
      legacyComponents: ['../../../../components/Icons/DotVertical'],
      legacy: {
        root: path('../../../../apps/codeimage/'),
        plugins: [vanillaExtractPlugin({unstable_mode: 'transform'}), solid1()],
      },
    }),
    solid2(),
  ],
  build: {
    write: false,
    lib: {entry, formats: ['es']},
  },
});

const chunks = output.filter(file => file.type === 'chunk');
const [chunk] = chunks;
const assets = output.filter(file => file.type === 'asset');
if (
  chunks.length !== 1 ||
  chunk.imports.length ||
  chunk.dynamicImports.length ||
  assets.some(
    file => !file.fileName.endsWith('.css') || typeof file.source !== 'string',
  )
) {
  throw new Error(
    'The demo must compile to a self-contained JS module and CSS',
  );
}

const template = await readFile(path('./demo.html'), 'utf8');
const script = chunk.code.replaceAll(/<\/script/gi, '<\\/script');
const css = assets.map(file => file.source).join('\n');
await mkdir(path('./dist'), {recursive: true});
await writeFile(
  path('./dist/index.html'),
  template
    .replace('</head>', () => `<style>${css}</style></head>`)
    .replace('<!-- app -->', () => `<script type="module">${script}</script>`),
);
