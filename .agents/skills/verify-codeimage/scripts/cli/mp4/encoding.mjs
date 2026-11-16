import {join} from 'node:path';
import assert from 'node:assert/strict';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {existsSync, statSync} from 'node:fs';
import {
  baseBin,
  lane,
  out,
  run,
  common,
  probe,
  quick,
  start,
  noFfmpeg,
  ffmpeg,
} from './common.mjs';
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
  const path = wrappers + ':/usr/bin:/bin';
  const flag = join(wrappers, 'flag');
  const fromEnv = join(wrappers, 'environment');
  const cases = [
    [['--ffmpeg', flag], {CODEIMAGE_FFMPEG: fromEnv}],
    [[], {CODEIMAGE_FFMPEG: fromEnv}],
    [[], {CODEIMAGE_FFMPEG: ''}],
  ];
  for (const [index, [extra, vars]] of cases.entries()) {
    const file = join(out, `resolve-${index}.mp4`);
    await run([...quick, '-o', file, ...extra], {
      env: {...process.env, PATH: path, ...vars},
    });

    probe(file);
  }
  assert.deepEqual(
    (await readFile(join(out, 'resolve-order.txt'), 'utf8')).trim().split('\n'),
    ['USED_flag', 'USED_environment', 'USED_ffmpeg'],
  );
  await rm(flag);
  const invalid = join(out, 'resolve-invalid.mp4');
  const rejected = await start([...quick, '-o', invalid, '--ffmpeg', flag], {
    env: {...process.env, PATH: path, CODEIMAGE_FFMPEG: fromEnv},
  }).done;
  assert.equal(rejected.code, 2);
  assert.ok(rejected.stderr.includes(`--ffmpeg: ${flag} is not an executable`));
  assert.ok(!existsSync(invalid));
  await rm(fromEnv);
  const fallback = join(out, 'resolve-env-fallback.mp4');
  const warned = await start([...quick, '-o', fallback], {
    env: {...process.env, PATH: path, CODEIMAGE_FFMPEG: fromEnv},
  }).done;
  assert.equal(warned.code, 0, warned.stderr);
  assert.ok(
    warned.stderr.includes(`CODEIMAGE_FFMPEG: ${fromEnv} is not an executable`),
  );
  probe(fallback);
  return {order: ['flag', 'CODEIMAGE_FFMPEG', 'PATH'], envFallback: true};
});
