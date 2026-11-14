import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {cpus, loadavg} from 'node:os';
import {parseArgs} from 'node:util';
import {Renderer} from '@takumi-rs/core';
import {PNG} from 'pngjs';
import type {SnapshotInput} from '../src/document';
import {renderSnapshot, snapshotMarkup} from '../src/render';
import {sampleDocument} from '../src/sample';

const {values: args} = parseArgs({
  options: {
    lines: {type: 'string', default: '300'},
    scale: {type: 'string', default: '2'},
    warmup: {type: 'string', default: '5'},
    runs: {type: 'string', default: '30'},
    out: {type: 'string'},
  },
});

const BLOCK = [
  'import {createSignal, For} from "solid-js";',
  '',
  'interface Todo {',
  '  id: number;',
  '  title: string;',
  '  done: boolean;',
  '}',
  '',
  'export function TodoList(props: {initial: Todo[]}) {',
  '  const [todos, setTodos] = createSignal(props.initial);',
  '  const toggle = (id: number) =>',
  '    setTodos(list => list.map(t => (t.id === id ? {...t, done: !t.done} : t)));',
  '  return (',
  '    <ul class="todos">',
  '      <For each={todos()}>{todo => <li onClick={() => toggle(todo.id)}>{todo.title}</li>}</For>',
  '    </ul>',
  '  );',
  '}',
  '',
  'const total = todos().filter(todo => !todo.done).length; // 42 left',
];

const lines = Number(args.lines);
const code = Array.from(
  {length: lines},
  (_, i) => BLOCK[i % BLOCK.length],
).join('\n');
const document: SnapshotInput = {
  ...sampleDocument,
  scale: Number(args.scale),
  editor: {
    ...sampleDocument.editor,
    editors: [{...sampleDocument.editor.editors[0], code, tabName: 'todo.tsx'}],
  },
};

const time = async <T>(work: () => Promise<T>) => {
  const start = performance.now();
  const result = await work();
  return [performance.now() - start, result] as const;
};

function stats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    runs: samples.length,
    median: round(at(0.5)),
    min: round(sorted[0]),
    p90: round(at(0.9)),
    max: round(sorted.at(-1)!),
  };
}

function checkPng(bytes: Uint8Array | string) {
  assert.ok(bytes instanceof Uint8Array, 'renderSnapshot returned bytes');
  const png = PNG.sync.read(Buffer.from(bytes));
  const minHeight = lines * 21 * Number(args.scale);
  assert.ok(png.height > minHeight, `PNG holds ${lines} lines`);
  return png;
}

const totals: number[] = [];
const markups: number[] = [];
const rasters: number[] = [];
const rawRasters: number[] = [];
let errors = 0;
let png: PNG | undefined;

const markup = await snapshotMarkup(document);
const spans = (markup.html.match(/<span/g) ?? []).length;
const renderer = new Renderer();
for (const font of markup.fonts) {
  await renderer.registerFont({
    name: font.family,
    data: await readFile(font.path),
    weight: font.weight,
    unicodeRange: font.unicodeRange,
  });
}
const rasterOptions = {
  css: markup.css,
  format: 'png' as const,
  devicePixelRatio: Number(args.scale),
};

for (let i = 0; i < Number(args.warmup); i++) {
  checkPng(await renderSnapshot(document));
  await renderer.render(markup.html, {...rasterOptions, format: 'raw'});
}
for (let i = 0; i < Number(args.runs); i++) {
  try {
    const [total, bytes] = await time(() => renderSnapshot(document));
    png = checkPng(bytes);
    totals.push(total);
    markups.push((await time(() => snapshotMarkup(document)))[0]);
    rasters.push(
      (await time(() => renderer.render(markup.html, rasterOptions)))[0],
    );
    rawRasters.push(
      (
        await time(() =>
          renderer.render(markup.html, {...rasterOptions, format: 'raw'}),
        )
      )[0],
    );
  } catch (error) {
    errors++;
    console.error(error);
  }
}

const report = {
  snippet: {lines, scale: Number(args.scale), spans},
  output: {width: png?.width, height: png?.height},
  machine: {cores: cpus().length, loadavg: loadavg().map(n => n.toFixed(2))},
  errors,
  renderSnapshot: stats(totals),
  breakdown: {
    snapshotMarkup: stats(markups),
    takumiRasterPng: stats(rasters),
    takumiRasterRaw: stats(rawRasters),
  },
};
console.log(JSON.stringify(report, null, 2));
if (args.out) await writeFile(args.out, JSON.stringify(report, null, 2));
assert.equal(errors, 0, 'every run rendered');
