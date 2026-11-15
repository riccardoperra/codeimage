// GIF playback decoder from #762, checked pixel-for-pixel against libwebp gif2webp.
function lzwDecode(data: Uint8Array, minCodeSize: number, length: number) {
  const output = new Uint8Array(length);
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  const prefix = new Uint16Array(4096);
  const suffix = new Uint8Array(4096);
  const first = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let code = 0; code < clear; code++) {
    suffix[code] = code;
    first[code] = code;
  }
  let size = minCodeSize + 1;
  let next = end + 1;
  let previous = -1;
  let written = 0;
  let bits = 0;
  let buffer = 0;
  for (const byte of data) {
    buffer |= byte << bits;
    bits += 8;
    while (bits >= size) {
      const code = buffer & ((1 << size) - 1);
      buffer >>>= size;
      bits -= size;
      if (code === clear) {
        size = minCodeSize + 1;
        next = end + 1;
        previous = -1;
        continue;
      }
      if (code === end) return output;
      if (previous === -1) {
        if (written < length) output[written++] = code;
        previous = code;
        continue;
      }
      let depth = 0;
      let walk = code;
      if (code >= next) {
        stack[depth++] = first[previous];
        walk = previous;
      }
      while (walk >= clear) {
        stack[depth++] = suffix[walk];
        walk = prefix[walk];
      }
      stack[depth++] = walk;
      if (next < 4096) {
        prefix[next] = previous;
        suffix[next] = walk;
        first[next] = first[previous];
        next++;
        if (next === 1 << size && size < 12) size++;
      }
      while (depth && written < length) output[written++] = stack[--depth];
      previous = code;
    }
  }
  return output;
}

interface ShownFrame {
  rgba: Uint8Array;
  startMs: number;
  delayMs: number;
  disposal: number;
  localPalette: boolean;
}

// Composes each frame as Chrome does: disposal 2 clears the frame's rectangle
// to transparent, and a delay under 2 hundredths plays as 10.
export function* decodeGif(bytes: Uint8Array): Generator<ShownFrame> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  const tableSize = (packed: number) => 3 * (1 << ((packed & 7) + 1));
  let offset = 13;
  let globalTable: Uint8Array | undefined;
  if (bytes[10] & 0x80) {
    globalTable = bytes.subarray(offset, offset + tableSize(bytes[10]));
    offset += globalTable.length;
  }
  let canvas = new Uint8Array(width * height * 4);
  let control = {disposal: 0, delayCs: 0, transparent: -1};
  let pending:
    | {
        x: number;
        y: number;
        w: number;
        h: number;
        disposal: number;
        saved?: Uint8Array;
      }
    | undefined;
  let startMs = 0;
  const subBlocks = () => {
    const parts: Uint8Array[] = [];
    while (bytes[offset]) {
      parts.push(bytes.subarray(offset + 1, offset + 1 + bytes[offset]));
      offset += bytes[offset] + 1;
    }
    offset++;
    return parts;
  };
  while (offset < bytes.length) {
    const block = bytes[offset++];
    if (block === 0x3b) return;
    if (block === 0x21) {
      const label = bytes[offset++];
      if (label === 0xf9) {
        const packed = bytes[offset + 1];
        control = {
          disposal: (packed >> 2) & 7,
          delayCs: view.getUint16(offset + 2, true),
          transparent: packed & 1 ? bytes[offset + 4] : -1,
        };
        offset += bytes[offset] + 1;
      }
      subBlocks();
      continue;
    }
    if (block !== 0x2c) throw new Error(`Unknown GIF block ${block}`);
    const x = view.getUint16(offset, true);
    const y = view.getUint16(offset + 2, true);
    const w = view.getUint16(offset + 4, true);
    const h = view.getUint16(offset + 6, true);
    const packed = bytes[offset + 8];
    offset += 9;
    let table = globalTable;
    if (packed & 0x80) {
      table = bytes.subarray(offset, offset + tableSize(packed));
      offset += table.length;
    }
    const minCodeSize = bytes[offset++];
    const parts = subBlocks();
    const data = new Uint8Array(
      parts.reduce((sum, part) => sum + part.length, 0),
    );
    let at = 0;
    for (const part of parts) {
      data.set(part, at);
      at += part.length;
    }
    const indexes = lzwDecode(data, minCodeSize, w * h);
    if (pending?.disposal === 2) {
      for (let row = pending.y; row < pending.y + pending.h; row++)
        canvas.fill(
          0,
          (row * width + pending.x) * 4,
          (row * width + pending.x + pending.w) * 4,
        );
    } else if (pending?.disposal === 3 && pending.saved) {
      canvas = pending.saved;
    }
    const saved = control.disposal === 3 ? canvas.slice() : undefined;
    const rows = Array.from({length: h}, (_, row) => row);
    if (packed & 0x40) {
      rows.length = 0;
      for (const [start, step] of [
        [0, 8],
        [4, 8],
        [2, 4],
        [1, 2],
      ])
        for (let row = start; row < h; row += step) rows.push(row);
    }
    for (const [line, row] of rows.entries()) {
      for (let col = 0; col < w; col++) {
        const index = indexes[line * w + col];
        if (index === control.transparent) continue;
        const target = ((y + row) * width + x + col) * 4;
        canvas[target] = table![index * 3];
        canvas[target + 1] = table![index * 3 + 1];
        canvas[target + 2] = table![index * 3 + 2];
        canvas[target + 3] = 255;
      }
    }
    const delayMs = (control.delayCs < 2 ? 10 : control.delayCs) * 10;
    yield {
      rgba: canvas.slice(),
      startMs,
      delayMs,
      disposal: control.disposal,
      localPalette: Boolean(packed & 0x80),
    };
    startMs += delayMs;
    pending = {x, y, w, h, disposal: control.disposal, saved};
    control = {disposal: 0, delayCs: 0, transparent: -1};
  }
}
