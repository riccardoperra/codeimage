import {loadavg} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';

// Times the static PNG export of the trunk build and of this build, ten runs
// each, interleaved. Build the trunk copy with `pnpm libs:build:render` on the
// trunk ref and copy `packages/render/dist` to `packages/render/<dir>/dist`, so
// it resolves the same dependencies.
const {values} = parseArgs({
  options: {
    'base-dist': {type: 'string'},
    runs: {type: 'string', default: '10'},
  },
});

const document = {
  $version: '1.10.0',
  $snippetId: null,
  format: 'png',
  scale: 2,
  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
  },
  terminal: {
    type: 'macOs',
    showHeader: true,
    accentVisible: true,
    shadow: '0 20px 40px rgba(0,0,0,.3)',
    background: '#282a36',
    textColor: '#f8f8f2',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: 'glass',
  },
  editor: {
    options: {
      fontId: 'jetbrains-mono',
      fontWeight: 400,
      showLineNumbers: true,
      themeId: 'dracula',
      enableLigatures: true,
    },
    editors: [
      {
        id: 'main',
        code: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n',
        tabName: 'hello.ts',
        languageId: 'typescript',
        lineNumberStart: 1,
      },
    ],
  },
};

type Render = (input: typeof document) => Promise<Uint8Array | string>;

const median = (samples: number[]) => {
  const sorted = samples.toSorted((a, b) => a - b);
  const middle = sorted.length / 2;
  return (
    (sorted[Math.floor(middle - 0.5)] + sorted[Math.ceil(middle - 0.5)]) / 2
  );
};

async function main() {
  if (!values['base-dist']) {
    console.error(
      'Usage: tsx scripts/parity/animation-perf.ts --base-dist <dir>',
    );
    process.exitCode = 2;
    return;
  }
  const load = (dist: string) =>
    import(pathToFileURL(resolve(dist, 'index.mjs')).href).then(
      module => module.renderSnapshot as Render,
    );
  const sides = {
    trunk: await load(values['base-dist']),
    head: await load(resolve(__dirname, '../../packages/render/dist')),
  };
  const samples = {trunk: [] as number[], head: [] as number[]};
  const [expected] = await Promise.all([
    sides.trunk(document),
    sides.head(document),
  ]);
  let mismatches = 0;
  for (let run = 0; run < Number(values.runs); run++) {
    for (const side of run % 2
      ? (['head', 'trunk'] as const)
      : (['trunk', 'head'] as const)) {
      const start = performance.now();
      const image = await sides[side](document);
      samples[side].push(performance.now() - start);
      if (Buffer.compare(Buffer.from(image), Buffer.from(expected)))
        mismatches++;
    }
  }
  const trunk = median(samples.trunk);
  const head = median(samples.head);
  console.log(
    JSON.stringify({
      trunk,
      head,
      ratio: head / trunk,
      trunkRange: [Math.min(...samples.trunk), Math.max(...samples.trunk)],
      headRange: [Math.min(...samples.head), Math.max(...samples.head)],
      runs: Number(values.runs),
      // Renders whose PNG differs from the first trunk render.
      mismatches,
      unit: 'ms',
      loadAverage: loadavg().map(value => Number(value.toFixed(2))),
    }),
  );
  if (mismatches || head > trunk * 1.05) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
