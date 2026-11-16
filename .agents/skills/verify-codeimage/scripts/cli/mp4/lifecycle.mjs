import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {
  lane,
  out,
  start,
  quick,
  run,
  probe,
  a,
  ffmpeg,
  common,
  waitFor,
  noFfmpeg,
} from './common.mjs';
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
