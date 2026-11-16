import {fileURLToPath} from 'node:url';
import {join, resolve} from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {spawn, execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export const root = fileURLToPath(
  new URL('../../../../../../', import.meta.url),
);
export const out = resolve(process.argv[2] ?? '/tmp/codeimage-a6-live');
export const baseBin = process.argv[3];
export const bin = join(root, 'packages/cli/dist/bin.js');
export const ffmpeg = process.env.A6_FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
export const ffprobe = process.env.A6_FFPROBE ?? '/opt/homebrew/bin/ffprobe';
export const noFfmpeg = {
  ...process.env,
  PATH: join(out, 'missing-path'),
  LOCALAPPDATA: join(out, 'empty-local'),
  CODEIMAGE_FFMPEG: '',
  CI: '1',
};
await mkdir(out, {recursive: true});
export const a = join(out, 'a.ts');
export const b = join(out, 'b.ts');
await writeFile(a, 'const answer = 41;\nconsole.log(answer);\n');
await writeFile(
  b,
  'const answer = 42;\nconsole.log(`The answer is ${answer}`);\n',
);
export const common = [
  a,
  b,
  '--animate',
  '--hold',
  '1000',
  '--transition',
  '1000',
  '--fps',
  '60',
];
export const quick = [
  a,
  b,
  '--animate',
  '--hold',
  '0',
  '--transition',
  '100',
  '--fps',
  '30',
];
export const results = {};
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export function start(args, {env = process.env, entry = bin} = {}) {
  console.log(`$ codeimage ${args.join(' ')}`);
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout = [];
  let stderr = '';
  child.stdout.on('data', chunk => stdout.push(chunk));
  child.stderr.on('data', chunk => {
    stderr += chunk;
    process.stdout.write(chunk);
  });
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) =>
      resolve({code, signal, stdout: Buffer.concat(stdout), stderr}),
    );
  });
  return {child, done, stderr: () => stderr};
}
export async function run(args, options) {
  const result = await start(args, options).done;
  assert.equal(result.code, 0, result.stderr);
  return result;
}
export function probe(file) {
  const data = JSON.parse(
    execFileSync(ffprobe, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,profile,pix_fmt,color_range,color_space,color_transfer,color_primaries,width,height,nb_frames:frame=key_frame,pts_time',
      '-of',
      'json',
      file,
    ]),
  );
  const stream = data.streams[0];
  for (const [key, value] of Object.entries({
    codec_name: 'h264',
    profile: 'High',
    pix_fmt: 'yuv420p',
    color_range: 'tv',
    color_space: 'bt709',
    color_transfer: 'bt709',
    color_primaries: 'bt709',
  }))
    assert.equal(stream[key], value, key);
  assert.equal(stream.width % 2, 0);
  assert.equal(stream.height % 2, 0);
  const keys = data.frames
    .filter(frame => frame.key_frame)
    .map(frame => Number(frame.pts_time));
  for (let index = 1; index < keys.length; index++)
    assert.ok(Math.abs(keys[index] - keys[index - 1] - 2) < 0.002);
  const bytes = readFileSync(file);
  const boxes = [];
  for (let offset = 0; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32BE(offset);
    boxes.push(bytes.toString('ascii', offset + 4, offset + 8));
    if (size < 8) break;
    offset += size;
  }
  assert.ok(
    boxes.indexOf('moov') >= 0 && boxes.indexOf('moov') < boxes.indexOf('mdat'),
  );
  console.log(JSON.stringify({stream, keyframes: keys, boxes}));
  return {stream, keyframes: keys, boxes};
}
export async function waitFor(predicate, description, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`Timed out: ${description}`);
    await delay(5);
  }
}
export async function lane(id, work) {
  console.log(`\nLANE ${id}`);
  const started = Date.now();
  try {
    results[id] = {
      status: 'pass',
      ...(await work()),
      wallMs: Date.now() - started,
    };
  } catch (error) {
    results[id] = {
      status: 'fail',
      error: String(error),
      wallMs: Date.now() - started,
    };
    console.error(error);
  }
  await writeFile(join(out, 'results.json'), JSON.stringify(results, null, 2));
}
