import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import {PNG} from 'pngjs';

// Allow sparse MSVC Takumi rounding while rejecting visible rendering changes.
const MAX_CHANNEL_DELTA = 2;
const MAX_DIFF_PERCENT = 0.01;

const {values: args} = parseArgs({
  options: {
    input: {type: 'string', default: 'dist/takumi-cross-os'},
    out: {type: 'string', default: 'dist/takumi-cross-os-comparison'},
  },
});

const platforms = ['Linux', 'macOS', 'Windows'];

async function readManifest(platform: string) {
  const value: unknown = JSON.parse(
    await readFile(join(args.input, platform, 'manifest.json'), 'utf8'),
  );
  assert.ok(
    Array.isArray(value) && value.length > 0,
    `${platform}: empty manifest`,
  );
  const entries = value.map((entry: unknown) => {
    assert.ok(entry && typeof entry === 'object');
    assert.ok('cell' in entry && typeof entry.cell === 'string');
    assert.ok('sha256' in entry && typeof entry.sha256 === 'string');
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    assert.ok('width' in entry && typeof entry.width === 'number');
    assert.ok('height' in entry && typeof entry.height === 'number');
    assert.ok(Number.isInteger(entry.width) && entry.width > 0);
    assert.ok(Number.isInteger(entry.height) && entry.height > 0);
    return {
      cell: entry.cell,
      sha256: entry.sha256,
      width: entry.width,
      height: entry.height,
    };
  });
  assert.equal(new Set(entries.map(entry => entry.cell)).size, entries.length);
  return entries;
}

type Manifest = Awaited<ReturnType<typeof readManifest>>;

async function readImage(
  platform: string,
  index: number,
  entry: Manifest[number],
) {
  const bytes = await readFile(join(args.input, platform, `${index}.png`));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
  const png = PNG.sync.read(bytes);
  assert.equal(png.width, entry.width);
  assert.equal(png.height, entry.height);
  return {bytes, png};
}

async function main() {
  await mkdir(args.out, {recursive: true});
  const baseline = await readManifest('Linux');
  const images = await Promise.all(
    baseline.map((entry, index) => readImage('Linux', index, entry)),
  );
  const results = [];
  const rows = [
    '| OS | Status | Byte-identical cells | Max differing pixels | Differing cells |',
    '| --- | --- | --- | --- | --- |',
  ];
  let failed = false;
  for (const platform of platforms) {
    const manifest = await readManifest(platform);
    assert.deepEqual(
      manifest.map(entry => entry.cell),
      baseline.map(entry => entry.cell),
      `${platform}: cell set/order differs from Linux`,
    );
    let byteIdentical = 0;
    let maxDiffPercent = 0;
    let platformFailed = false;
    const differing = [];
    for (const [index, entry] of manifest.entries()) {
      const {bytes, png} = await readImage(platform, index, entry);
      const base = images[index];
      if (bytes.equals(base.bytes)) {
        byteIdentical++;
        continue;
      }
      if (png.width !== base.png.width || png.height !== base.png.height) {
        differing.push({
          cell: entry.cell,
          status: 'FAIL',
          reason: `dimensions ${png.width}x${png.height} vs ${base.png.width}x${base.png.height}`,
        });
        platformFailed = true;
        continue;
      }
      const diff = new PNG({width: png.width, height: png.height});
      let pixels = 0;
      let maxChannelDelta = 0;
      for (let offset = 0; offset < png.data.length; offset += 4) {
        let delta = 0;
        for (let channel = 0; channel < 4; channel++) {
          delta = Math.max(
            delta,
            Math.abs(
              png.data[offset + channel] - base.png.data[offset + channel],
            ),
          );
        }
        maxChannelDelta = Math.max(maxChannelDelta, delta);
        if (delta > 0) {
          pixels++;
          diff.data[offset] = 255;
          diff.data[offset + 3] = 255;
        }
      }
      const percent = (pixels / (png.width * png.height)) * 100;
      maxDiffPercent = Math.max(maxDiffPercent, percent);
      const status =
        maxChannelDelta <= MAX_CHANNEL_DELTA && percent <= MAX_DIFF_PERCENT
          ? 'WARN'
          : 'FAIL';
      const file = `${platform}-${index}-diff.png`;
      if (pixels) {
        await writeFile(join(args.out, file), PNG.sync.write(diff));
      }
      differing.push({
        cell: entry.cell,
        status,
        pixels,
        percent,
        maxChannelDelta,
        file: pixels ? file : undefined,
      });
      if (status === 'WARN') {
        const message = `${platform}: ${entry.cell} not byte-identical, ${pixels} px, max delta ${maxChannelDelta}/255`;
        console.log(
          `::warning::${message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`,
        );
      } else {
        platformFailed = true;
      }
    }
    const status = platformFailed ? 'FAIL' : differing.length ? 'WARN' : 'PASS';
    failed ||= platformFailed;
    results.push({
      platform,
      status,
      total: baseline.length,
      byteIdentical,
      maxDiffPercent,
      differing,
    });
    rows.push(
      `| ${platform} | ${status} | ${byteIdentical}/${baseline.length} | ${maxDiffPercent.toFixed(6)}% | ${differing.map(entry => `${entry.status}: ${entry.cell} (${'reason' in entry ? entry.reason : `${entry.pixels} px, max delta ${entry.maxChannelDelta}/255`})`).join('<br>') || 'none'} |`,
    );
  }
  const table = `${rows.join('\n')}\n\nPASS: byte-identical. WARN: same dimensions, at most ${MAX_DIFF_PERCENT}% differing pixels and max RGBA channel delta ${MAX_CHANNEL_DELTA}/255. FAIL: anything else.\n`;
  console.log(table);
  await writeFile(join(args.out, 'table.md'), table);
  await writeFile(
    join(args.out, 'results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, table);
  if (failed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
