import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
const root = fileURLToPath(new URL('../../../../..', import.meta.url));
const ffmpeg = process.env.A6_FFMPEG ?? 'ffmpeg';
const ffprobe = process.env.A6_FFPROBE ?? 'ffprobe';
export async function compareExports({
  page,
  out,
  project,
  scenario,
  requestedFps,
  errors,
}) {
  const projectPath = join(out, 'project.json');
  await writeFile(projectPath, JSON.stringify(project, null, 2));
  const child = spawn(
    process.execPath,
    [
      join(root, 'packages/cli/dist/bin.js'),
      projectPath,
      '--animate',
      '--scale',
      '1',
      '-o',
      join(out, 'cli.mp4'),
    ],
    {cwd: root, stdio: ['ignore', 'pipe', 'pipe']},
  );
  let stderr = '';
  child.stderr.on('data', data => (stderr += data));
  const status = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  assert.equal(status, 0, stderr);
  await writeFile(join(out, 'cli.log'), stderr);
  const probe = file =>
    JSON.parse(
      execFileSync(ffprobe, [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_name,profile,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,nb_frames,r_frame_rate:format=duration',
        '-of',
        'json',
        file,
      ]),
    );
  const web = probe(join(out, 'web.mp4'));
  const cli = probe(join(out, 'cli.mp4'));
  await writeFile(
    join(out, 'metadata.json'),
    JSON.stringify({web, cli}, null, 2),
  );
  const ws = web.streams[0],
    cs = cli.streams[0];
  const metadataDifferences = [];
  for (const key of [
    'codec_name',
    'width',
    'height',
    'nb_frames',
    'r_frame_rate',
    'profile',
    'pix_fmt',
    'color_range',
    'color_space',
    'color_transfer',
    'color_primaries',
  ]) {
    if (cs[key] !== ws[key])
      metadataDifferences.push({key, web: ws[key], cli: cs[key]});
  }
  if (cli.format.duration !== web.format.duration)
    metadataDifferences.push({
      key: 'duration',
      web: web.format.duration,
      cli: cli.format.duration,
    });
  const fps =
    Number(ws.r_frame_rate.split('/')[0]) /
    Number(ws.r_frame_rate.split('/')[1]);
  const count = Number(ws.nb_frames);
  const indices = [
    ...new Set([
      0,
      Math.floor(count * 0.2),
      Math.floor(count * 0.4),
      Math.floor(count * 0.5),
      Math.floor(count * 0.6),
      Math.floor(count * 0.8),
      count - 1,
    ]),
  ];
  const diffs = [];
  for (const index of indices) {
    const images = [];
    for (const kind of ['web', 'cli']) {
      const path = join(out, `${kind}-${index}.png`);
      execFileSync(ffmpeg, [
        '-v',
        'error',
        '-i',
        join(out, `${kind}.mp4`),
        '-vf',
        `select='eq(n,${index})'`,
        '-frames:v',
        '1',
        '-y',
        path,
      ]);
      images.push(PNG.sync.read(await readFile(path)));
    }
    const [a, b] = images;
    const diff = new PNG({width: a.width, height: a.height});
    const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
      threshold: 0.1,
    });
    await writeFile(join(out, `diff-${index}.png`), PNG.sync.write(diff));
    const percent = (changed / (a.width * a.height)) * 100;
    diffs.push({index, time: index / fps, percent});
  }
  const result = {
    status:
      metadataDifferences.length === 0 && diffs.every(diff => diff.percent <= 2)
        ? 'pass'
        : 'fail',
    scenario,
    requestedFps,
    webHead: process.env.A6_WEB_HEAD ?? null,
    metadataDifferences,
    backend: 'MSW',
    browser: page.context().browser().version(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root})
      .toString()
      .trim(),
    web,
    cli,
    diffs,
    errors,
  };
  await writeFile(
    join(out, 'web-cli-mp4.json'),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  assert.deepEqual(metadataDifferences, [], 'Web/CLI metadata matches');
  assert.deepEqual(errors, []);
  assert.ok(
    diffs.every(diff => diff.percent <= 2),
    'Web/CLI frames differ by more than 2%',
  );
  return result;
}
