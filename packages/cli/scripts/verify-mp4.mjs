// Run the built CLI in a tmux pane. Evidence stays outside the checkout.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = resolve(process.argv[2] ?? '/tmp/codeimage-a6-live');
const baseBin = process.argv[3];
const bin = join(root, 'packages/cli/dist/bin.js');
const ffmpeg = process.env.A6_FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const ffprobe = process.env.A6_FFPROBE ?? '/opt/homebrew/bin/ffprobe';
const noFfmpeg = {
  ...process.env,
  PATH: join(out, 'missing-path'),
  LOCALAPPDATA: join(out, 'empty-local'),
  CODEIMAGE_FFMPEG: '',
  CI: '1',
};
await mkdir(out, {recursive: true});
const a = join(out, 'a.ts');
const b = join(out, 'b.ts');
await writeFile(a, 'const answer = 41;\nconsole.log(answer);\n');
await writeFile(
  b,
  'const answer = 42;\nconsole.log(`The answer is ${answer}`);\n',
);
const common = [
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
const quick = [
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
const results = {};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function start(args, {env = process.env, entry = bin} = {}) {
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
async function run(args, options) {
  const result = await start(args, options).done;
  assert.equal(result.code, 0, result.stderr);
  return result;
}
function probe(file) {
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
async function waitFor(predicate, description, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`Timed out: ${description}`);
    await delay(5);
  }
}
async function lane(id, work) {
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

if (baseBin)
  await lane(1, async () => {
    const before = join(out, 'base.webp');
    const after = join(out, 'head.webp');
    await run([...common, '-o', before], {entry: baseBin});
    await run([...common, '-o', after]);
    assert.ok(
      (await readFile(before)).equals(await readFile(after)),
      'WebP bytes changed',
    );
    return {byteIdentical: true, bytes: statSync(after).size};
  });
await lane(2, async () => {
  const file = join(out, 'path.mp4');
  await run([...common, '-o', file]);
  const metadata = probe(file);
  assert.equal(Number(metadata.stream.nb_frames), 180);
  // Also prove stdout holds a faststart MP4 with no diagnostic bytes.
  const redirected = await run([...quick, '--format', 'mp4', '-o', '-']);
  const stdoutFile = join(out, 'stdout.mp4');
  await writeFile(stdoutFile, redirected.stdout);
  probe(stdoutFile);
  return metadata;
});

await lane(3, async () => {
  const file = join(out, 'missing.mp4');
  const result = await start([...quick, '--offline', '-o', file], {
    env: noFfmpeg,
  }).done;
  assert.equal(result.code, 2);
  for (const hint of [
    'ffmpeg is required',
    '--ffmpeg',
    'CODEIMAGE_FFMPEG',
    'PATH',
  ])
    assert.ok(result.stderr.includes(hint));
  assert.ok(!existsSync(file));
  return {exitCode: result.code, instructions: result.stderr};
});
await lane(4, async () => {
  const wrappers = join(out, 'wrappers');
  await mkdir(wrappers, {recursive: true});
  for (const name of ['flag', 'environment', 'ffmpeg'])
    await writeFile(
      join(wrappers, name),
      `#!/bin/sh\nif [ "$2" != "-encoders" ]; then echo USED_${name} >> '${join(out, 'resolve-order.txt')}'; fi\nexec '${ffmpeg}' "$@"\n`,
      {mode: 0o755},
    );
  const env = {
    ...process.env,
    PATH: wrappers + ':/usr/bin:/bin',
    CODEIMAGE_FFMPEG: join(wrappers, 'environment'),
  };
  for (const [index, name] of ['flag', 'environment', 'ffmpeg'].entries()) {
    const args = [
      ...quick,
      '-o',
      join(out, `resolve-${index}.mp4`),
      '--ffmpeg',
      join(wrappers, 'flag'),
    ];
    await run(args, {env});
    // ffmpeg stderr is quiet on success; wrappers leave a marker in a file too.
    probe(join(out, `resolve-${index}.mp4`));
    await rm(join(wrappers, name));
  }
  assert.deepEqual(
    (await readFile(join(out, 'resolve-order.txt'), 'utf8')).trim().split('\n'),
    ['USED_flag', 'USED_environment', 'USED_ffmpeg'],
  );
  return {order: ['flag', 'CODEIMAGE_FFMPEG', 'PATH']};
});
await lane(5, async () => {
  const unsupported = join(out, 'unsupported-ffmpeg');
  await writeFile(
    unsupported,
    '#!/bin/sh\necho " V..... libx264rgb H.264 encoder"\n',
    {mode: 0o755},
  );
  const result = await start([
    ...quick,
    '--ffmpeg',
    unsupported,
    '-o',
    join(out, 'unsupported.mp4'),
  ]).done;
  assert.equal(result.code, 2);
  assert.ok(result.stderr.includes('MP4 requires the libx264 encoder'));
  assert.ok(!existsSync(join(out, 'unsupported.mp4')));
  return {exitCode: result.code};
});
await lane(6, async () => {
  const files = [join(out, 'concurrent-a.mp4'), join(out, 'concurrent-b.mp4')];
  await Promise.all(files.map(file => run([...quick, '-o', file])));
  files.forEach(probe);
  assert.ok(!readdirSync(out).some(name => name.endsWith('.partial')));
  return {files};
});
await lane(7, async () => {
  const oddInput = join(out, 'odd.ts');
  const args = [
    a,
    oddInput,
    '--animate',
    '--hold',
    '0',
    '--transition',
    '100',
    '--fps',
    '30',
    '--scale',
    '1',
  ];
  let width;
  for (let length = 60; length <= 70; length++) {
    await writeFile(oddInput, `const wide = "${'W'.repeat(length)}";`);
    await run([...args, '-o', join(out, 'odd.apng')]);
    width = readFileSync(join(out, 'odd.apng')).readUInt32BE(16);
    if (width % 2) break;
  }
  assert.ok(width % 2, 'Expected an odd input frame at scale 1');
  await run([...args, '-o', join(out, 'odd.mp4')]);
  const metadata = probe(join(out, 'odd.mp4'));
  assert.equal(metadata.stream.width, width + 1);
  execFileSync(ffmpeg, [
    '-v',
    'error',
    '-i',
    join(out, 'odd.mp4'),
    '-frames:v',
    '1',
    '-y',
    join(out, 'odd-frame.png'),
  ]);
  return {inputWidth: width, encodedWidth: metadata.stream.width, scale: 1};
});
await lane(8, async () => {
  const file = join(out, 'abort.mp4');
  const task = start([
    ...common,
    '--hold',
    '10000',
    '--transition',
    '5000',
    '-o',
    file,
  ]);
  await waitFor(
    () =>
      readdirSync(out).some(
        name => name.startsWith('abort.mp4.') && name.endsWith('.partial'),
      ),
    'ffmpeg output',
  );
  const childPids = execFileSync('/usr/bin/pgrep', [
    '-P',
    String(task.child.pid),
  ])
    .toString()
    .trim()
    .split(/\s+/)
    .map(Number);
  const signalledAt = Date.now();
  task.child.kill('SIGINT');
  const result = await task.done;
  const exitMs = Date.now() - signalledAt;
  assert.ok(exitMs < 1000, `Ctrl+C took ${exitMs}ms`);
  assert.equal(result.signal, 'SIGINT');
  assert.ok(!existsSync(file));
  assert.ok(
    !readdirSync(out).some(
      name => name.startsWith('abort.mp4.') && name.endsWith('.partial'),
    ),
  );
  for (const pid of childPids) {
    await waitFor(
      () => {
        try {
          process.kill(pid, 0);
          return false;
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
          return true;
        }
      },
      `Encoder ${pid} termination`,
      Math.max(0, 1000 - (Date.now() - signalledAt)),
    );
  }
  return {
    exitMs,
    cleanupMs: Date.now() - signalledAt,
    encoderPids: childPids,
    signal: result.signal,
  };
});
await lane(9, async () => {
  const formats = ['png', 'gif', 'webp', 'apng'];
  for (const format of formats) {
    const file = join(out, `without-ffmpeg.${format}`);
    await run([...(format === 'png' ? [a] : quick), '--offline', '-o', file], {
      env: noFfmpeg,
    });
    assert.ok(statSync(file).size > 0);
  }
  return {formats};
});
console.log(JSON.stringify(results, null, 2));
if (Object.values(results).some(result => result.status !== 'pass'))
  process.exitCode = 1;
