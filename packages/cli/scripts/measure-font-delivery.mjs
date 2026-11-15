import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {sampleDocument} from '../../render/src/sample.ts';

const directory = await mkdtemp(join(tmpdir(), 'codeimage-cold-'));
try {
  const source = join(directory, 'example.ts');
  const preset = join(directory, 'preset.json');
  const output = join(directory, 'out.png');
  await writeFile(
    source,
    Array.from(
      {length: 50},
      (_, index) => `const value${index} = ${index};`,
    ).join('\n'),
  );
  await writeFile(
    preset,
    JSON.stringify({
      frame: sampleDocument.frame,
      terminal: sampleDocument.terminal,
      editor: {...sampleDocument.editor.options, fontId: 'fira-code'},
    }),
  );
  const results = {P10: [], P11: []};
  // Each build must repeat its own image. The builds may differ: the adaptive
  // watermark moves off code that an older baseline draws it over.
  const expected = {};
  for (let iteration = 0; iteration < 7; iteration++) {
    for (const [name, binary] of [
      ['P10', process.argv[2]],
      ['P11', resolve('packages/cli/publish/dist/bin.js')],
    ]) {
      const started = performance.now();
      const result = spawnSync(
        process.execPath,
        [binary, source, '--preset', preset, '-o', output, '--no-redact'],
        {env: process.env, encoding: 'utf8'},
      );
      const elapsed = performance.now() - started;
      assert.equal(result.status, 0, result.stderr);
      const image = await readFile(output);
      expected[name] ??= image;
      assert.deepEqual(image, expected[name], `${name} image differs`);
      assert.deepEqual(
        image.subarray(0, 8),
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      results[name].push(elapsed);
    }
  }
  for (const [name, samples] of Object.entries(results)) {
    const sorted = samples.toSorted((a, b) => a - b);
    console.error(
      `${name}: median ${sorted[3].toFixed(1)} ms; range ${sorted[0].toFixed(1)}–${sorted[6].toFixed(1)} ms; n=7; errors=0`,
    );
  }
  console.error(JSON.stringify(results));
} finally {
  await rm(directory, {recursive: true, force: true});
}
