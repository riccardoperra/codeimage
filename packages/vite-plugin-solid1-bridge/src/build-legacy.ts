import {dirname, join} from 'node:path';
import {build} from 'vite';
import type {LegacyBuildOptions} from './contracts.js';
import type {CompiledBridge} from './transform.js';

export async function buildLegacy(
  {root, plugins}: LegacyBuildOptions,
  sources: readonly CompiledBridge[],
  mountSource: string,
) {
  const directory = join(root, '.solid1-bridge');
  const entry = join(directory, 'index.mjs');
  const files = new Map([[join(directory, 'mount.js'), mountSource]]);
  const exports = [];
  for (const [key, {legacy, exported}] of sources.entries()) {
    const name = `entry-${key}.jsx`;
    files.set(join(directory, name), legacy);
    exports.push(`export {${exported.join(', ')}} from './${name}';`);
  }
  files.set(entry, exports.join('\n'));

  const result = await build({
    root,
    configFile: false,
    plugins: [
      {
        name: 'solid1-bridge-legacy-sources',
        resolveId(id, importer) {
          const file =
            importer && id.startsWith('./') && files.has(importer)
              ? join(dirname(importer), id)
              : id;
          if (files.has(file)) return file;
        },
        load(id) {
          return files.get(id);
        },
      },
      ...plugins,
    ],
    define: {'process.env.NODE_ENV': JSON.stringify('production')},
    build: {
      write: false,
      minify: false,
      lib: {entry, formats: ['es']},
    },
  });

  const bundle = Array.isArray(result) ? result[0] : result;
  if (!bundle || !('output' in bundle)) {
    throw new Error('Expected a Solid 1 build output');
  }
  const {output} = bundle;
  const chunks = output.filter(file => file.type === 'chunk');
  const assets = output.filter(file => file.type === 'asset');
  const [chunk] = chunks;
  if (
    chunks.length !== 1 ||
    chunk.imports.length ||
    chunk.dynamicImports.length ||
    assets.some(
      file =>
        !file.fileName.endsWith('.css') || typeof file.source !== 'string',
    )
  ) {
    throw new Error(
      `Unexpected bridge outputs: ${output.map(file => file.fileName).join(', ')}`,
    );
  }
  return {js: chunk.code, css: assets.map(file => file.source).join('\n')};
}
