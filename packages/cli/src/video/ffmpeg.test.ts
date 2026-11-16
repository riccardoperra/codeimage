import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRenderer} from '@codeimage/render';
import {parseArgs} from '../args';
import {buildSnapshot} from '../snapshot';
import {planAnimation} from '../flags/animate';
import {decodeApng} from '../../../render/src/test-utils';
import {ffmpegCacheFolder} from './download';
import {exportMp4, ffmpegArgs, padFrame, resolveFfmpeg} from './ffmpeg';

let folder: string;
beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'codeimage-video-'));
});
afterEach(() => rm(folder, {recursive: true, force: true}));
async function wrapper(name: string, script = '#!/bin/sh\nexit 0\n') {
  const path = join(folder, name);
  await writeFile(path, script);
  await chmod(path, 0o755);
  return path;
}

it('matches the web MP4 profile, bitrate cap, GOP, colour conversion/tags and faststart', () => {
  const args = ffmpegArgs({
    width: 1919,
    height: 1079,
    fps: 60,
    output: 'video.mp4',
  });
  const value = (flag: string) => args[args.indexOf(flag) + 1];
  expect(value('-f')).toBe('rawvideo');
  expect(value('-pix_fmt')).toBe('rgba');
  expect(value('-s:v')).toBe('1920x1080');
  expect(value('-c:v')).toBe('libx264');
  expect(value('-profile:v')).toBe('high');
  expect(value('-level:v')).toBe('4.2');
  expect(
    args.slice(args.lastIndexOf('-pix_fmt'), args.lastIndexOf('-pix_fmt') + 2),
  ).toEqual(['-pix_fmt', 'yuv420p']);
  expect(value('-g')).toBe('120');
  expect(value('-keyint_min')).toBe('120');
  expect(value('-sc_threshold')).toBe('0');
  expect(value('-b:v')).toBe('9331200');
  expect(value('-vf')).toBe(
    'scale=out_color_matrix=bt709:out_range=tv,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=limited',
  );
  for (const flag of ['-colorspace', '-color_primaries', '-color_trc'])
    expect(value(flag)).toBe('bt709');
  expect(value('-color_range')).toBe('tv');
  expect(value('-movflags')).toBe('+faststart');
  expect(args.at(-1)).toBe('video.mp4');
});

it('extends the right and bottom edge when padding odd dimensions', () => {
  const rgba = new Uint8Array([10, 20, 30, 40]);
  expect(padFrame({width: 1, height: 1, rgba})).toEqual(
    Buffer.from([...rgba, ...rgba, ...rgba, ...rgba]),
  );
  const even = new Uint8Array(16);
  expect(padFrame({width: 2, height: 2, rgba: even})).toBe(even);
  expect(() => padFrame({width: 2, height: 2, rgba})).toThrow('RGBA');
});

it('resolves flag, environment, PATH, cache, then download, skipping missing files', async () => {
  const flag = await wrapper('flag');
  const envPath = await wrapper('environment');
  const onPath = await wrapper('ffmpeg');
  const env = {CODEIMAGE_FFMPEG: envPath, PATH: folder};
  let downloads = 0;
  const download = async () => {
    downloads++;
    return '/download/ffmpeg';
  };
  expect(await resolveFfmpeg({path: flag, env, download})).toBe(flag);
  await rm(flag);
  expect(await resolveFfmpeg({path: flag, env, download})).toBe(envPath);
  await rm(envPath);
  expect(await resolveFfmpeg({path: flag, env, download})).toBe(onPath);
  expect(downloads).toBe(0);
  await rm(onPath);
  const cache = ffmpegCacheFolder({cacheRoot: folder});
  await mkdir(cache, {recursive: true});
  await writeFile(join(cache, 'ffmpeg'), 'cached', {mode: 0o755});
  await writeFile(join(cache, 'LICENSE'), 'license');
  await writeFile(join(cache, 'README'), 'readme');
  expect(await resolveFfmpeg({env, cacheRoot: folder})).toBe(
    join(cache, 'ffmpeg'),
  );
  await rm(cache, {recursive: true});
  expect(await resolveFfmpeg({env, download})).toBe('/download/ffmpeg');
  expect(downloads).toBe(1);
});

it('accepts MP4 only with --animate, keeps its default extension and parses install-ffmpeg', () => {
  expect(
    parseArgs(['a.ts', 'b.ts', '--animate', '--format', 'mp4']),
  ).toMatchObject({
    mp4: true,
    output: 'codeimage.mp4',
    animation: {format: 'webp'},
  });
  expect(
    parseArgs(['--animate', '-o', 'demo.MP4', '--ffmpeg', '/bin/ffmpeg']),
  ).toMatchObject({mp4: true, ffmpeg: '/bin/ffmpeg'});
  expect(parseArgs(['install-ffmpeg'])).toEqual({kind: 'install-ffmpeg'});
  expect(() => parseArgs(['--format', 'mp4'])).toThrow('--format');
  expect(() => parseArgs(['--ffmpeg', '/bin/ffmpeg'])).toThrow('--ffmpeg');
  expect(() => parseArgs(['install-ffmpeg', 'unexpected'])).toThrow('Usage');
});

it('reports encoder failure and removes only its own partial MP4', async () => {
  const ffmpeg = await wrapper(
    'fail',
    '#!/bin/sh\ncat >/dev/null\necho encoder-failed >&2\nexit 1\n',
  );
  const output = join(folder, 'out.mp4');
  await writeFile(output, 'previous');
  await expect(
    exportMp4({
      ffmpeg,
      output,
      animation: {
        width: 2,
        height: 2,
        fps: 30,
        durationMs: 33,
        frames: (async function* () {
          yield {width: 2, height: 2, rgba: new Uint8Array(16)};
        })(),
      },
    }),
  ).rejects.toThrow('encoder-failed');
  expect(await readFile(output, 'utf8')).toBe('previous');
  expect(await readdir(folder)).toEqual(['fail', 'out.mp4']);
});

describe('raw A2 animation frames', () => {
  it('matches every native APNG frame, including fractional scene boundaries', async () => {
    const args = parseArgs([
      'a.ts',
      'b.ts',
      '--animate',
      '--hold',
      '137',
      '--transition',
      '101',
      '--fps',
      '30',
      '-o',
      'a.mp4',
    ]);
    if (args.kind !== 'render' || !args.animation)
      throw new Error('Expected animation');
    const snapshot = await buildSnapshot({
      args,
      inputs: [
        {name: 'a.ts', code: 'const a = 1;'},
        {name: 'b.ts', code: 'const answer = 42;\nconsole.log(answer);'},
      ],
    });
    const {document} = planAnimation(snapshot, args.animation);
    const renderer = createRenderer({offline: true});
    const raw = await renderer.animationFrames(document);
    const frames = [];
    for await (const frame of raw.frames) frames.push(frame);
    const encoded = decodeApng(
      await renderer.renderAnimation({...document, format: 'apng'}),
    );
    expect(raw.durationMs).toBe(400);
    expect(raw.fps).toBe(30);
    expect(frames).toHaveLength(encoded.length);
    for (const [index, frame] of frames.entries()) {
      expect(frame.width).toBe(encoded[index].width);
      expect(frame.height).toBe(encoded[index].height);
      expect(
        Buffer.from(frame.rgba).equals(encoded[index].data),
        `frame ${index}`,
      ).toBe(true);
    }
  });
});
