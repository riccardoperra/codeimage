import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {solid1Bridge} from '@codeimage/vite-plugin-solid1-bridge';
import solid2 from '@solidjs/vite-plugin';
import {build, normalizePath} from 'vite';

const path = name =>
  normalizePath(fileURLToPath(new URL(name, import.meta.url)));
const moduleId = 'virtual:codeimage-solid2-islands';
const stylesId = moduleId + '/styles.css';
const menu = path(
  '../../src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu.tsx',
);
const fromApp = createRequire(new URL('../../package.json', import.meta.url));

const readOnlyHost = path('./read-only-host.tsx');
const cloneButton = '../../src/pages/UnifiedEditor/ReadOnlyCloneButton';

async function buildHost(projectMenu) {
  const solid1 = fromApp('vite-plugin-solid');
  const {vanillaExtractPlugin} = fromApp('@vanilla-extract/vite-plugin');
  const [{output}] = await build({
    root: path('./'),
    configFile: false,
    plugins: [
      solid1Bridge({
        entries: projectMenu ? [readOnlyHost, menu] : [readOnlyHost],
        modules: {
          '@codeui/kit': {compound: ['DropdownMenu']},
          [cloneButton]: {standalone: ['ReadOnlyCloneButton']},
        },
        legacyComponents: ['../../../../components/Icons/DotVertical'],
        legacy: {
          root: path('../../'),
          plugins: [
            vanillaExtractPlugin({unstable_mode: 'transform'}),
            solid1(),
          ],
        },
      }),
      solid2(),
    ],
    build: {
      write: false,
      lib: {
        entry: projectMenu ? path('./host.jsx') : readOnlyHost,
        formats: ['es'],
      },
    },
  });
  const chunks = output.filter(file => file.type === 'chunk');
  const [chunk] = chunks;
  if (
    chunks.length !== 1 ||
    chunk.imports.length ||
    chunk.dynamicImports.length
  ) {
    throw new Error(
      'The Solid 2 islands must compile to one standalone host module',
    );
  }
  const css = output.filter(file => file.type === 'asset');
  if (
    css.some(
      file =>
        !file.fileName.endsWith('.css') || typeof file.source !== 'string',
    )
  ) {
    throw new Error('Unexpected assets in the Solid 2 islands');
  }
  return {js: chunk.code, css: css.map(file => file.source).join('\n')};
}

export function editorIslands({projectMenu}) {
  let host;
  return {
    name: 'codeimage-solid2-islands',
    enforce: 'pre',
    buildStart() {
      host = undefined;
    },
    resolveId(id) {
      if (id === moduleId || id === stylesId) return '\0' + id;
    },
    async load(id) {
      if (projectMenu && id === menu)
        return readFile(path('./adapter.jsx'), 'utf8');
      if (id !== '\0' + moduleId && id !== '\0' + stylesId) return;
      host ??= buildHost(projectMenu);
      const result = await host;
      return id === '\0' + stylesId
        ? result.css
        : `import '${stylesId}';\n${result.js}`;
    },
  };
}
