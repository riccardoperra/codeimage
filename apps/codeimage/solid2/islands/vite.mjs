import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {solid1Bridge} from '@codeimage/vite-plugin-solid1-bridge';
import solid2 from '@solidjs/vite-plugin';
import {build, normalizePath} from 'vite';
import {islandMounts, islandWrapper, registerIslands} from './registry.mjs';

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
const hostFactory = path(
  '../../src/core/solid2-islands/create-solid2-island.tsx',
);
const hostStyles = path('../../src/core/solid2-islands/island-host.css.ts');
const islandsEntry = path('./islands-entry.mjs');
const sharedModules = new Set([
  '@codeimage/config',
  '@codeimage/highlight/themes',
  '@codemirror/state',
  '@codemirror/view',
]);

const prebuiltVanillaCss = {
  name: 'codeimage-prebuilt-vanilla-css',
  enforce: 'pre',
  load(id) {
    if (id.endsWith('.vanilla.css') && existsSync(id)) {
      return readFile(id, 'utf8');
    }
  },
};

async function buildHost(islands) {
  const solid1 = fromApp('vite-plugin-solid');
  const {vanillaExtractPlugin} = fromApp('@vanilla-extract/vite-plugin');
  const [{output}] = await build({
    root: path('./'),
    configFile: false,
    resolve: {dedupe: ['solid-js', '@solidjs/web']},
    plugins: [
      {
        name: 'codeimage-solid2-islands-entry',
        resolveId(id) {
          if (id === islandsEntry) return id;
        },
        load(id) {
          if (id === islandsEntry) {
            return islandMounts(
              islands,
              path('./create-solid2-mount.ts'),
              path('./editor-host.ts'),
            );
          }
        },
      },
      solid1Bridge({
        entries: [readOnlyHost, menu],
        optionalEntries: [...islands.keys()],
        modules: {
          '@codeui/kit': {compound: ['DropdownMenu']},
          [cloneButton]: {standalone: ['ReadOnlyCloneButton']},
          './SettingsSearchField': {standalone: ['SettingsSearchField']},
        },
        legacyComponents: ['../../../../components/Icons/DotVertical'],
        legacy: {
          root: path('../../'),
          plugins: [prebuiltVanillaCss, vanillaExtractPlugin(), solid1()],
        },
      }),
      solid2(),
    ],
    build: {
      write: false,
      rolldownOptions: {external: id => sharedModules.has(id)},
      lib: {
        entry: islandsEntry,
        formats: ['es'],
      },
    },
  });
  const chunks = output.filter(file => file.type === 'chunk');
  const [chunk] = chunks;
  if (
    chunks.length !== 1 ||
    [...chunk.imports, ...chunk.dynamicImports].some(
      id => !sharedModules.has(id),
    )
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
  return {
    js: chunk.code,
    css: `@layer solid2-islands {\n${css.map(file => file.source).join('\n')}\n}`,
  };
}

export function editorIslands({islands: entries}) {
  const islands = registerIslands(path('../../'), entries);
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
      const island = islands.get(id);
      if (island)
        return islandWrapper(island, moduleId, hostFactory, hostStyles);
      if (id !== '\0' + moduleId && id !== '\0' + stylesId) return;
      host ??= buildHost(islands);
      const result = await host;
      return id === '\0' + stylesId
        ? result.css
        : `import '${stylesId}';\n${result.js}`;
    },
  };
}
