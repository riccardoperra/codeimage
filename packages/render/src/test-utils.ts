import {PNG} from 'pngjs';
import type {SnapshotInput} from './document';
import {sampleDocument} from './sample';

export const decode = (bytes: Uint8Array | string) =>
  PNG.sync.read(Buffer.from(bytes as Uint8Array));

// Flat gray frame and terminal with no header, watermark, border or shadow,
// so only the code and the gutter put color in the image.
export const plainDocument = (
  code: string,
  options: Partial<typeof sampleDocument.editor.options> = {},
): SnapshotInput => ({
  ...sampleDocument,
  scale: 2,
  frame: {...sampleDocument.frame, background: '#808080'},
  terminal: {
    ...sampleDocument.terminal,
    background: '#808080',
    showHeader: false,
    showWatermark: false,
    shadow: null,
    borderType: null,
  },
  editor: {
    options: {...sampleDocument.editor.options, ...options},
    editors: [{...sampleDocument.editor.editors[0], code}],
  },
});

export const countPixels = (
  image: PNG,
  matches: (r: number, g: number, b: number) => boolean,
) => {
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) {
    if (matches(image.data[i], image.data[i + 1], image.data[i + 2])) count++;
  }
  return count;
};

export interface AnimationFile {
  width: number;
  height: number;
  durationsMs: number[];
}

// The canvas and the frame times of an animated WebP, from its RIFF chunks.
export function readWebpAnimation(bytes: Uint8Array): AnimationFile {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const uint24 = (offset: number) =>
    view.getUint16(offset, true) | (view.getUint8(offset + 2) << 16);
  const file: AnimationFile = {width: 0, height: 0, durationsMs: []};
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const size = view.getUint32(offset + 4, true);
    const data = offset + 8;
    if (type === 'VP8X') {
      file.width = uint24(data + 4) + 1;
      file.height = uint24(data + 7) + 1;
    }
    if (type === 'ANMF') file.durationsMs.push(uint24(data + 12));
    offset = data + size + (size % 2);
  }
  return file;
}

// The canvas and the frame times of an animated PNG, from its chunks.
export function readApngAnimation(bytes: Uint8Array): AnimationFile {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const file: AnimationFile = {width: 0, height: 0, durationsMs: []};
  for (let offset = 8; offset + 8 <= bytes.length;) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = offset + 8;
    if (type === 'IHDR') {
      file.width = view.getUint32(data);
      file.height = view.getUint32(data + 4);
    }
    if (type === 'fcTL') {
      const denominator = view.getUint16(data + 22) || 100;
      file.durationsMs.push((view.getUint16(data + 20) / denominator) * 1000);
    }
    offset = data + size + 4;
  }
  return file;
}

function decodeLzw(minCodeSize: number, data: Uint8Array, pixels: number) {
  const out = new Uint8Array(pixels);
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  const prefix = new Int32Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let code = 0; code < clear; code++) suffix[code] = code;
  let [codeSize, next, previous, first] = [minCodeSize + 1, end + 1, -1, 0];
  let [bits, buffer, read, written] = [0, 0, 0, 0];
  while (written < pixels) {
    while (bits < codeSize && read < data.length) {
      buffer |= data[read++] << bits;
      bits += 8;
    }
    if (bits < codeSize) break;
    const code = buffer & ((1 << codeSize) - 1);
    buffer >>= codeSize;
    bits -= codeSize;
    if (code === end) break;
    if (code === clear) {
      [codeSize, next, previous] = [minCodeSize + 1, end + 1, -1];
      continue;
    }
    if (previous === -1) {
      out[written++] = first = suffix[code];
      previous = code;
      continue;
    }
    let [entry, depth] = [code, 0];
    if (code >= next) {
      stack[depth++] = first;
      entry = previous;
    }
    while (entry > clear) {
      stack[depth++] = suffix[entry];
      entry = prefix[entry];
    }
    stack[depth++] = first = suffix[entry];
    if (next < 4096) {
      prefix[next] = previous;
      suffix[next++] = first;
      if ((next & (next - 1)) === 0 && next < 4096) codeSize++;
    }
    previous = code;
    while (depth) out[written++] = stack[--depth];
  }
  return out;
}

// Each frame of a GIF as a viewer shows it: drawn over what the frames
// before it left on the canvas.
export function decodeGif(bytes: Uint8Array): AnimationFile & {frames: PNG[]} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const colorTable = (packed: number) =>
    packed & 0x80 ? 3 * (1 << ((packed & 7) + 1)) : 0;
  const [width, height] = [view.getUint16(6, true), view.getUint16(8, true)];
  const globalPalette = bytes.subarray(13, 13 + colorTable(bytes[10]));
  let offset = 13 + globalPalette.length;
  const subBlocks = () => {
    const blocks: Uint8Array[] = [];
    while (bytes[offset]) {
      blocks.push(bytes.subarray(offset + 1, offset + 1 + bytes[offset]));
      offset += bytes[offset] + 1;
    }
    offset++;
    return Buffer.concat(blocks);
  };
  let canvas = Buffer.alloc(width * height * 4);
  let control = {disposal: 0, transparent: -1, delayMs: 0};
  const file = {width, height, durationsMs: [], frames: []} as AnimationFile & {
    frames: PNG[];
  };
  while (offset < bytes.length) {
    const block = bytes[offset++];
    if (block === 0x21) {
      if (bytes[offset++] === 0xf9) {
        const packed = bytes[offset + 1];
        control = {
          disposal: (packed >> 2) & 7,
          transparent: packed & 1 ? bytes[offset + 4] : -1,
          delayMs: view.getUint16(offset + 2, true) * 10,
        };
      }
      subBlocks();
    } else if (block === 0x2c) {
      const [left, top] = [
        view.getUint16(offset, true),
        view.getUint16(offset + 2, true),
      ];
      const [frameWidth, frameHeight] = [
        view.getUint16(offset + 4, true),
        view.getUint16(offset + 6, true),
      ];
      const localSize = colorTable(bytes[offset + 8]);
      const palette = localSize
        ? bytes.subarray(offset + 9, offset + 9 + localSize)
        : globalPalette;
      offset += 9 + localSize;
      const minCodeSize = bytes[offset++];
      const indexes = decodeLzw(
        minCodeSize,
        subBlocks(),
        frameWidth * frameHeight,
      );
      const before = Buffer.from(canvas);
      for (let row = 0; row < frameHeight; row++) {
        for (let column = 0; column < frameWidth; column++) {
          const index = indexes[row * frameWidth + column];
          if (index === control.transparent) continue;
          const target = ((top + row) * width + left + column) * 4;
          canvas.set(palette.subarray(index * 3, index * 3 + 3), target);
          canvas[target + 3] = 255;
        }
      }
      const frame = new PNG({width, height});
      canvas.copy(frame.data);
      file.frames.push(frame);
      file.durationsMs.push(control.delayMs);
      if (control.disposal === 2) {
        for (let row = 0; row < frameHeight; row++) {
          const start = ((top + row) * width + left) * 4;
          canvas.fill(0, start, start + frameWidth * 4);
        }
      }
      if (control.disposal === 3) canvas = before;
      control = {disposal: 0, transparent: -1, delayMs: 0};
    } else {
      break;
    }
  }
  return file;
}
