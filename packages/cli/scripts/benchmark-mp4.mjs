// Fresh-process export timings. Run only while the one-minute load is below 8.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {cpus, loadavg} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = resolve(process.argv[2] ?? '/tmp/codeimage-a6-perf');
const baseline = process.argv[3];
assert.ok(baseline, 'Pass the built base CLI path as the third argument');
const head = join(root, 'packages/cli/dist/bin.js');
const ffprobe = process.env.A6_FFPROBE ?? 'ffprobe';
await mkdir(out, {recursive: true});
const a = join(out, 'perf-a.ts');
const b = join(out, 'perf-b.ts');
const codes = ['a', 'b'].map(
  value => `const answer = "${value.repeat(82)}";\nconsole.log(answer);\n`,
);
await writeFile(a, codes[0]);
await writeFile(b, codes[1]);
const preset = {
  frame: {
    background: '#18181b',
    padding: 458.75,
    radius: 8,
    visible: true,
    opacity: 100,
    signature: null,
    aspectRatio: null,
    exportTarget: null,
  },
  terminal: {
    showHeader: true,
    type: 'macOs',
    surface: 'solid',
    accentVisible: true,
    shadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: 'glass',
    background: '#18181b',
    textColor: '#ffffff',
  },
  editor: {
    fontId: 'jetbrains-mono',
    fontWeight: 400,
    enableLigatures: true,
    showLineNumbers: false,
    themeId: 'fleetDark',
  },
};
// The fixture renders 1920x1079; MP4 repeats the final row to reach 1080.
const configPath = join(out, 'preset.json');
await writeFile(configPath, JSON.stringify(preset, null, 2));
const common = [
  a,
  b,
  '--animate',
  '--preset',
  configPath,
  '--scale',
  '1',
  '--hold',
  '1000',
  '--transition',
  '1000',
  '--fps',
  '60',
  '--offline',
];
const deadline = Date.now() + 15 * 60_000;
const runs = [];
const median = values =>
  [...values]
    .sort((a, b) => a - b)
    .slice(4, 6)
    .reduce((sum, value) => sum + value, 0) / 2;
async function idle() {
  while (loadavg()[0] >= 8) {
    if (Date.now() > deadline)
      throw new Error(`Perf blocked: load ${loadavg()[0]} remains above 8`);
    console.log(`Waiting for load <8; current ${loadavg()[0].toFixed(2)}`);
    await new Promise(resolve => setTimeout(resolve, 15_000));
  }
}
async function run(kind, entry, index, extension) {
  await idle();
  const output = join(out, `${kind}-${index}.${extension}`);
  const startLoad = loadavg()[0];
  const started = performance.now();
  const child = spawn(process.execPath, [entry, ...common, '-o', output], {
    cwd: root,
    env: {...process.env, CODEIMAGE_FFMPEG: ''},
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', data => (stderr += data));
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  const ms = performance.now() - started;
  assert.equal(code, 0, stderr);
  const bytes = await readFile(output);
  if (extension === 'webp') assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  else {
    const probe = JSON.parse(
      execFileSync(ffprobe, [
        '-v',
        'error',
        '-show_entries',
        'stream=width,height,nb_frames',
        '-of',
        'json',
        output,
      ]),
    );
    assert.equal(probe.streams[0].width, 1920);
    assert.equal(probe.streams[0].height, 1080);
    assert.equal(Number(probe.streams[0].nb_frames), 180);
  }
  const row = {kind, index, ms, startLoad, bytes: bytes.length};
  runs.push(row);
  console.log(JSON.stringify(row));
  await writeFile(join(out, 'runs.json'), JSON.stringify(runs, null, 2));
  return bytes;
}
for (let index = 0; index < 10; index++) {
  const order =
    index % 2 ? ['head-webp', 'base-webp'] : ['base-webp', 'head-webp'];
  const pair = [];
  for (const kind of order)
    pair.push(
      await run(kind, kind === 'base-webp' ? baseline : head, index, 'webp'),
    );
  assert.ok(pair[0].equals(pair[1]), 'WebP bytes differ');
}
const baseMedian = median(
  runs.filter(run => run.kind === 'base-webp').map(run => run.ms),
);
console.log(`Base WebP median first: ${baseMedian.toFixed(1)} ms`);
for (let index = 0; index < 10; index++)
  await run('head-mp4', head, index, 'mp4');
const headMedian = median(
  runs.filter(run => run.kind === 'head-webp').map(run => run.ms),
);
const mp4Median = median(
  runs.filter(run => run.kind === 'head-mp4').map(run => run.ms),
);
const result = {
  node: process.version,
  cores: cpus().length,
  baseMedian,
  headMedian,
  webpRatio: headMedian / baseMedian,
  mp4Median,
  runs,
};
await writeFile(join(out, 'results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({...result, runs: undefined}, null, 2));
assert.ok(headMedian / baseMedian <= 1.05, 'WebP regressed by more than 5%');
assert.ok(mp4Median <= 6000, 'MP4 median exceeded 6 seconds');
