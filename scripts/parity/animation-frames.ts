import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, extname, join} from 'node:path';
import {parseArgs, promisify} from 'node:util';
import {crc32} from 'node:zlib';
import {PNG} from 'pngjs';

const run = promisify(execFile);

export interface Animation {
  width: number;
  height: number;
  frames: {png: PNG; startMs: number; durationMs: number}[];
}

interface Patch {
  rgba: Buffer;
  width: number;
  height: number;
  x: number;
  y: number;
  durationMs: number;

  blend: 'over' | 'source';

  dispose: 'none' | 'background' | 'previous';
}

function compose(width: number, height: number, patches: Patch[]): Animation {
  let canvas = Buffer.alloc(width * height * 4);
  let startMs = 0;
  const frames: Animation['frames'] = [];
  for (const patch of patches) {
    const before = Buffer.from(canvas);
    for (let row = 0; row < patch.height; row++) {
      for (let col = 0; col < patch.width; col++) {
        const source = (row * patch.width + col) * 4;
        const target = ((patch.y + row) * width + patch.x + col) * 4;
        const alpha = patch.rgba[source + 3] / 255;
        if (patch.blend === 'source' || alpha === 1) {
          patch.rgba.copy(canvas, target, source, source + 4);
          continue;
        }
        const below = canvas[target + 3] / 255;
        const out = alpha + below * (1 - alpha);
        for (let channel = 0; channel < 3; channel++) {
          canvas[target + channel] = out
            ? Math.round(
                (patch.rgba[source + channel] * alpha +
                  canvas[target + channel] * below * (1 - alpha)) /
                  out,
              )
            : 0;
        }
        canvas[target + 3] = Math.round(out * 255);
      }
    }
    const png = new PNG({width, height});
    canvas.copy(png.data);
    frames.push({png, startMs, durationMs: patch.durationMs});
    startMs += patch.durationMs;
    if (patch.dispose === 'previous') canvas = before;
    if (patch.dispose === 'background') {
      for (let row = 0; row < patch.height; row++) {
        const start = ((patch.y + row) * width + patch.x) * 4;
        canvas.fill(0, start, start + patch.width * 4);
      }
    }
  }
  return {width, height, frames};
}

function chunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0);
  return Buffer.concat([head, data, crc]);
}

function decodeApng(bytes: Buffer): Animation {
  const signature = bytes.subarray(0, 8);
  let ihdr = Buffer.alloc(0);
  const shared: Buffer[] = [];
  const frames: {control: Buffer; data: Buffer[]}[] = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === 'IHDR') ihdr = Buffer.from(data);
    else if (type === 'fcTL') frames.push({control: data, data: []});
    else if (type === 'IDAT') frames.at(-1)?.data.push(data);
    else if (type === 'fdAT') {
      const frame = frames.at(-1);
      assert.ok(frame);
      frame.data.push(data.subarray(4));
    } else if (!['acTL', 'IEND'].includes(type) && !frames.length) {
      shared.push(chunk(type, data));
    }
  }
  const dispose = ['none', 'background', 'previous'] as const;
  const patches = frames.map(({control, data}): Patch => {
    const width = control.readUInt32BE(4);
    const height = control.readUInt32BE(8);
    const header = Buffer.from(ihdr);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    const still = Buffer.concat([
      signature,
      chunk('IHDR', header),
      ...shared,
      chunk('IDAT', Buffer.concat(data)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    const denominator = control.readUInt16BE(22) || 100;
    return {
      rgba: PNG.sync.read(still).data,
      width,
      height,
      x: control.readUInt32BE(12),
      y: control.readUInt32BE(16),
      durationMs: (control.readUInt16BE(20) / denominator) * 1000,
      dispose: dispose[control[24]],
      blend: control[25] === 1 ? 'over' : 'source',
    };
  });
  return compose(ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), patches);
}

function readPam(bytes: Buffer) {
  const end = bytes.indexOf('ENDHDR\n') + 'ENDHDR\n'.length;
  const header = bytes.toString('ascii', 0, end);
  const field = (name: string) => {
    const match = new RegExp(`${name} (\\d+)`).exec(header);
    assert.ok(match);
    return Number(match[1]);
  };
  return {
    width: field('WIDTH'),
    height: field('HEIGHT'),
    rgba: bytes.subarray(end),
  };
}

async function decodeWebp(path: string, scratch: string): Promise<Animation> {
  const {stdout} = await run('webpmux', ['-info', path]);
  const canvas = /Canvas size: (\d+) x (\d+)/.exec(stdout);
  assert.ok(canvas, 'libwebp reported a canvas size');
  const rows = [
    ...stdout.matchAll(
      /^\s*(\d+):\s+(\d+)\s+(\d+)\s+(?:yes|no)\s+(\d+)\s+(\d+)\s+(\d+)\s+(none|background)\s+(yes|no)/gm,
    ),
  ];
  const patches: Patch[] = [];
  for (const [, index, , , x, y, duration, dispose, blend] of rows) {
    const frame = join(scratch, `frame-${index}.webp`);
    const pam = join(scratch, `frame-${index}.pam`);
    await run('webpmux', ['-get', 'frame', index, path, '-o', frame]);
    await run('dwebp', [frame, '-pam', '-o', pam]);
    const decoded = readPam(await readFile(pam));
    patches.push({
      ...decoded,
      x: Number(x),
      y: Number(y),
      durationMs: Number(duration),
      dispose: dispose as Patch['dispose'],
      blend: blend === 'yes' ? 'over' : 'source',
    });
  }
  return compose(Number(canvas[1]), Number(canvas[2]), patches);
}

export async function decodeAnimation(path: string): Promise<Animation> {
  const scratch = await mkdtemp(join(tmpdir(), 'animation-frames-'));
  try {
    const bytes = await readFile(path);
    if (bytes.toString('ascii', 0, 4) === 'RIFF') {
      return await decodeWebp(path, scratch);
    }
    if (bytes.toString('ascii', 0, 3) === 'GIF') {
      const webp = join(scratch, 'animation.webp');
      await run('gif2webp', [path, '-o', webp]);
      return await decodeWebp(webp, scratch);
    }
    if (bytes.subarray(1, 4).toString('ascii') === 'PNG')
      return decodeApng(bytes);
    throw new Error(`${path} is not a WebP, GIF or PNG file`);
  } finally {
    await rm(scratch, {recursive: true, force: true});
  }
}

async function main() {
  const {values, positionals} = parseArgs({
    allowPositionals: true,
    options: {
      frame: {type: 'string', multiple: true},
      time: {type: 'string', multiple: true},
      out: {type: 'string', default: '/tmp/codeimage-parity/frames'},
    },
  });
  const [path] = positionals;
  if (!path) {
    console.error(
      'Usage: tsx scripts/parity/animation-frames.ts <file> [--frame <n>]... [--time <ms>]... [--out <dir>]',
    );
    process.exitCode = 2;
    return;
  }
  const animation = await decodeAnimation(path);
  const totalMs = animation.frames.reduce(
    (sum, {durationMs}) => sum + durationMs,
    0,
  );
  console.log(
    `${path}: ${animation.width}x${animation.height}, ${animation.frames.length} frames, ${totalMs} ms`,
  );
  const atTime = (ms: number) =>
    animation.frames.findLastIndex(({startMs}) => startMs <= ms);
  const selected = [
    ...(values.frame ?? []).map(Number),
    ...(values.time ?? []).map(ms => atTime(Number(ms))),
  ];
  const indexes = selected.length
    ? selected
    : animation.frames.map((_, index) => index);
  await mkdir(values.out, {recursive: true});
  const name = basename(path, extname(path));
  for (const index of indexes) {
    const frame = animation.frames[index];
    if (!frame) throw new Error(`No frame ${index}`);
    const file = join(values.out, `${name}-${index}.png`);
    await writeFile(file, PNG.sync.write(frame.png));
    console.log(
      `frame ${index} at ${frame.startMs} ms for ${frame.durationMs} ms: ${file}`,
    );
  }
}

if (process.argv[1] && process.argv[1].endsWith('animation-frames.ts')) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
