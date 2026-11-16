// Run the built CLI in a tmux pane. Evidence stays outside the checkout.
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = resolve(process.argv[2] ?? '/tmp/codeimage-a6-live');
const baseBin = process.argv[3];
const bin = join(root, 'packages/cli/dist/bin.js');
const ffmpeg = process.env.A6_FFMPEG ?? '/opt/homebrew/bin/ffmpeg';
const ffprobe = process.env.A6_FFPROBE ?? '/opt/homebrew/bin/ffprobe';
const cacheRoot =
  process.platform === 'darwin'
    ? join(homedir(), 'Library/Caches')
    : process.platform === 'win32'
      ? process.env.LOCALAPPDATA
      : (process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'));
const cache = join(
  cacheRoot,
  'codeimage/ffmpeg/b6.1.1',
  `${process.platform}-${process.arch}`,
);
const noFfmpeg = {...process.env, PATH: '/usr/bin:/bin', CODEIMAGE_FFMPEG: ''};
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

function start(args, {env = process.env, entry = bin, proxy = false} = {}) {
  console.log(`$ codeimage ${args.join(' ')}`);
  const child = spawn(
    process.execPath,
    [...(proxy ? ['--use-env-proxy'] : []), entry, ...args],
    {cwd: root, env, stdio: ['ignore', 'pipe', 'pipe']},
  );
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
async function waitFor(predicate, description) {
  const deadline = Date.now() + 45_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`Timed out: ${description}`);
    await delay(5);
  }
}
function partials() {
  return existsSync(cache)
    ? readdirSync(cache).filter(name => name.endsWith('.partial'))
    : [];
}
async function emptyCache(label) {
  if (existsSync(cache))
    await rename(cache, join(out, `cache-${label}-${Date.now()}`));
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

const originalCache = existsSync(cache)
  ? `${cache}.a6-original-${process.pid}`
  : undefined;
if (originalCache) await rename(cache, originalCache);
try {
  await lane(3, async () => {
    const first = await run([...quick, '-o', join(out, 'download-first.mp4')], {
      env: noFfmpeg,
    });
    assert.equal(first.stderr.match(/Downloading ffmpeg b6.1.1/g)?.length, 1);
    probe(join(out, 'download-first.mp4'));
    const second = await run(
      [...quick, '-o', join(out, 'download-second.mp4')],
      {env: noFfmpeg},
    );
    assert.ok(!second.stderr.includes('Downloading ffmpeg'));
    await emptyCache('online');
    const offline = await start([...quick, '-o', join(out, 'offline.mp4')], {
      env: {
        ...noFfmpeg,
        HTTPS_PROXY: 'http://127.0.0.1:9',
        HTTP_PROXY: 'http://127.0.0.1:9',
        NO_PROXY: '',
      },
      proxy: true,
    }).done;
    assert.equal(offline.code, 2);
    for (const hint of [
      '--ffmpeg',
      'CODEIMAGE_FFMPEG',
      'PATH',
      'install-ffmpeg',
    ])
      assert.ok(offline.stderr.includes(hint));
    assert.ok(!existsSync(join(out, 'offline.mp4')));
    assert.deepEqual(partials(), []);
    return {firstDownloads: 1, secondDownloads: 0, offlineCode: offline.code};
  });
  await lane(4, async () => {
    const wrappers = join(out, 'wrappers');
    await mkdir(wrappers, {recursive: true});
    for (const name of ['flag', 'environment', 'ffmpeg'])
      await writeFile(
        join(wrappers, name),
        `#!/bin/sh\necho USED_${name} >> '${join(out, 'resolve-order.txt')}'\nexec '${ffmpeg}' "$@"\n`,
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
      (await readFile(join(out, 'resolve-order.txt'), 'utf8'))
        .trim()
        .split('\n'),
      ['USED_flag', 'USED_environment', 'USED_ffmpeg'],
    );
    return {order: ['flag', 'CODEIMAGE_FFMPEG', 'PATH']};
  });
  await lane(5, async () => {
    await emptyCache('install');
    const first = await run(['install-ffmpeg']);
    const second = await run(['install-ffmpeg']);
    assert.equal(first.stdout.toString(), second.stdout.toString());
    assert.equal(first.stderr.match(/Downloading ffmpeg b6.1.1/g)?.length, 1);
    assert.ok(!second.stderr.includes('Downloading ffmpeg'));
    assert.equal(
      first.stdout.toString().trim(),
      join(cache, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
    );
    return {
      binary: first.stdout.toString().trim(),
      firstDownloads: 1,
      secondDownloads: 0,
    };
  });
  await lane(6, async () => {
    await emptyCache('concurrent');
    const files = [
      join(out, 'concurrent-a.mp4'),
      join(out, 'concurrent-b.mp4'),
    ];
    await Promise.all(
      files.map(file => run([...quick, '-o', file], {env: noFfmpeg})),
    );
    files.forEach(probe);
    assert.deepEqual(readdirSync(cache).sort(), [
      'LICENSE',
      'README',
      'ffmpeg',
    ]);
    return {files, partials: partials()};
  });
  await lane(7, async () => {
    let scale;
    let width;
    for (const candidate of ['1', '1.01', '1.02', '1.03', '1.04']) {
      await run([...quick, '--scale', candidate, '-o', join(out, 'odd.apng')]);
      width = readFileSync(join(out, 'odd.apng')).readUInt32BE(16);
      if (width % 2) {
        scale = candidate;
        break;
      }
    }
    assert.ok(scale, 'Expected an odd input frame');
    await run([...quick, '--scale', scale, '-o', join(out, 'odd.mp4')]);
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
    return {inputWidth: width, encodedWidth: metadata.stream.width, scale};
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
      let alive = false;
      try {
        process.kill(pid, 0);
        alive = true;
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
      assert.ok(!alive, `Encoder ${pid} survived Ctrl+C`);
    }
    return {exitMs, encoderPids: childPids, signal: result.signal};
  });
  await lane(9, async () => {
    await emptyCache('abort');
    const task = start(['install-ffmpeg']);
    await waitFor(
      () =>
        partials().some(
          name =>
            name.startsWith('ffmpeg.') && statSync(join(cache, name)).size > 0,
        ),
      'streaming binary download',
    );
    const signalledAt = Date.now();
    task.child.kill('SIGINT');
    const result = await task.done;
    const exitMs = Date.now() - signalledAt;
    assert.equal(result.signal, 'SIGINT');
    assert.ok(exitMs < 1000);
    assert.deepEqual(readdirSync(cache), []);
    const retry = await run(['install-ffmpeg']);
    assert.equal(retry.stderr.match(/Downloading ffmpeg b6.1.1/g)?.length, 1);
    return {exitMs, partialsAfterAbort: [], retryDownloads: 1};
  });
} finally {
  if (originalCache) {
    await rm(cache, {recursive: true, force: true});
    await rename(originalCache, cache);
  }
}
console.log(JSON.stringify(results, null, 2));
if (Object.values(results).some(result => result.status !== 'pass'))
  process.exitCode = 1;
