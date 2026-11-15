import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import type {Plugin} from 'esbuild';

const require = createRequire(import.meta.url);
const {build} = createRequire(require.resolve('tsx'))('esbuild');
const {values} = parseArgs({
  options: {base: {type: 'string', default: 'dc07a549'}},
});
const directory = fileURLToPath(
  new URL('../../apps/codeimage/src/core/animation/', import.meta.url),
);
const fixture = execFileSync(
  'git',
  ['show', `${values.base}:apps/codeimage/src/core/animation/timeline.test.ts`],
  {encoding: 'utf8'},
);
type Captured = {name: string; timeline: string}[];
declare global {
  var animationDefaultsCapture: Captured;
  var animationDefaultsTest: string;
}

async function capture(baseline: boolean): Promise<Captured> {
  const plugin: Plugin = {
    name: 'capture-default-timelines',
    setup(builder) {
      builder.onResolve({filter: /^vitest$/}, () => ({
        path: 'vitest',
        namespace: 'fixtures',
      }));
      builder.onLoad({filter: /.*/, namespace: 'fixtures'}, () => ({
        contents:
          'export function test(name, fn) {globalThis.animationDefaultsTest = name; fn();}',
        loader: 'js',
      }));
      builder.onLoad(
        {filter: /\/(?:timeline|compile|model)\.ts$/},
        async ({path}) => {
          const file = path.split('/').at(-1)!;
          let contents = baseline
            ? execFileSync(
                'git',
                [
                  'show',
                  `${values.base}:apps/codeimage/src/core/animation/${file}`,
                ],
                {encoding: 'utf8'},
              )
            : await readFile(path, 'utf8');
          if (file === 'timeline.ts') {
            contents = contents.replace(
              'export function planTimeline(',
              'function sourcePlanTimeline(',
            );
            contents +=
              '\nexport function planTimeline(...args: Parameters<typeof sourcePlanTimeline>) {const timeline = sourcePlanTimeline(...args); globalThis.animationDefaultsCapture.push({name: globalThis.animationDefaultsTest, timeline: JSON.stringify(timeline)}); return timeline;}';
          }
          return {contents, loader: 'ts'};
        },
      );
    },
  };
  const result = await build({
    stdin: {
      contents: `globalThis.animationDefaultsCapture = [];\n${fixture}`,
      resolveDir: directory,
      sourcefile: 'timeline.fixture.ts',
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    plugins: [plugin],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString('base64');
  await import(`data:text/javascript;base64,${encoded}`);
  return globalThis.animationDefaultsCapture;
}
const baseline = await capture(true);
const current = await capture(false);
assert.ok(baseline.length > 0);
assert.deepEqual(
  current,
  baseline,
  'Default timelines must preserve every serialized byte',
);
console.log(
  `PASS ${current.length} default timeline outputs byte-identical to ${values.base}, using its unchanged test fixtures`,
);
