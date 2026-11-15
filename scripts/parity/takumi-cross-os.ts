import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import {PNG} from 'pngjs';
import {renderSnapshot} from '../../packages/render/dist/index.mjs';
import {matrix} from './takumi-cells';

const {values: args} = parseArgs({
  options: {out: {type: 'string', default: 'dist/takumi-cross-os'}},
});

async function main() {
  await mkdir(args.out, {recursive: true});
  const manifest = [];
  for (const cell of await matrix()) {
    const rendered = await renderSnapshot(cell.document);
    assert.ok(
      rendered instanceof Uint8Array,
      `${cell.name}: expected PNG bytes`,
    );
    const bytes = Buffer.from(rendered);
    const {width, height} = PNG.sync.read(bytes);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(args.out, `${manifest.length}.png`), bytes);
    manifest.push({cell: cell.name, sha256, width, height});
    console.log(`${cell.name}: ${width}x${height} ${sha256}`);
  }
  await writeFile(
    join(args.out, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const nativeBindings = Object.keys(
    createRequire(import.meta.url).cache,
  ).filter(path => path.includes('@takumi-rs') && path.endsWith('.node'));
  assert.ok(nativeBindings.length > 0, 'Expected a native Takumi binding');
  const runtime = {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    nativeBindings,
  };
  await writeFile(
    join(args.out, 'runtime.json'),
    `${JSON.stringify(runtime, null, 2)}\n`,
  );
  console.log(runtime);
  console.log(
    `Rendered ${manifest.length} cells on ${process.platform}/${process.arch}`,
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
