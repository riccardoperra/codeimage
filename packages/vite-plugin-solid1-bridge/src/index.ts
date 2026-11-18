import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {Plugin} from 'vite';
import {normalizePath} from 'vite';
import {buildLegacy} from './build-legacy.js';
import type {Solid1BridgeOptions} from './contracts.js';
import {componentsId, runtimeId, stylesId} from './ids.js';
import type {CompiledBridge} from './transform.js';
import {compileBridge} from './transform.js';

export type {
  LegacyBuildOptions,
  LegacyModuleRule,
  Solid1BridgeOptions,
} from './contracts.js';

const runtime = new URL('./runtime.js', import.meta.url);
const mount = new URL('./mount.js', import.meta.url);
const virtualIds = new Set([componentsId, runtimeId, stylesId]);

export function solid1Bridge({
  entries,
  modules,
  legacy,
  legacyComponents = [],
}: Solid1BridgeOptions): Plugin {
  const rules = new Map(Object.entries(modules));
  let root: string;
  let sources: Map<string, CompiledBridge>;
  let bundle: ReturnType<typeof buildLegacy> | undefined;

  return {
    name: 'vite-plugin-solid1-bridge',
    enforce: 'pre',
    apply: 'build',
    configResolved(config) {
      root = config.root;
    },
    async buildStart() {
      bundle = undefined;
      const compiled = await Promise.all(
        entries.map(async (entry, key): Promise<[string, CompiledBridge]> => {
          const file = normalizePath(resolve(root, entry));
          this.addWatchFile(file);
          const code = await readFile(file, 'utf8');
          try {
            const result = compileBridge(code, {
              key,
              file,
              modules: rules,
              legacyComponents,
            });
            if (!result)
              throw new Error('No configured bridge components found');
            return [file, result];
          } catch (error) {
            const detail =
              error instanceof Error ? error.message : String(error);
            throw new Error(`Cannot bridge ${file}: ${detail}`, {
              cause: error,
            });
          }
        }),
      );
      sources = new Map(compiled);
    },
    resolveId(id) {
      if (virtualIds.has(id)) return '\0' + id;
    },
    async load(id, options) {
      if (!id.startsWith('\0') || !virtualIds.has(id.slice(1))) return;
      if (options?.ssr) this.error('solid1Bridge supports client builds only');
      if (id === '\0' + runtimeId) return readFile(runtime, 'utf8');
      bundle ??= readFile(mount, 'utf8').then(source =>
        buildLegacy(legacy, [...sources.values()], source),
      );
      const result = await bundle;
      return id === '\0' + stylesId ? result.css : result.js;
    },
    transform(_code, id) {
      const compiled = sources.get(normalizePath(id));
      if (compiled) return {code: compiled.host, map: null};
    },
  };
}
