const EXTENSION = 0x21;
const GRAPHIC_CONTROL = 0xf9;
const IMAGE = 0x2c;
const DISPOSAL_BITS = 0b11100;
const RESTORE_TO_BACKGROUND = 2 << 2;

// Takumi 2.19 and 2.20 write every GIF frame as a whole canvas with the
// disposal "do not dispose", so the next frame is drawn over it. A pixel that
// turns transparent then keeps showing the frame before, and a frame that
// shrinks leaves its old edges behind. This marks each whole-canvas frame to
// be cleared after it is shown, in place.
export function clearGifFrames(gif: Uint8Array): void {
  const view = new DataView(gif.buffer, gif.byteOffset, gif.byteLength);
  const colorTable = (packed: number) =>
    packed & 0x80 ? 3 * (1 << ((packed & 7) + 1)) : 0;
  const [width, height] = [view.getUint16(6, true), view.getUint16(8, true)];
  let offset = 13 + colorTable(gif[10]);
  const skipSubBlocks = () => {
    while (gif[offset]) offset += gif[offset] + 1;
    offset++;
  };
  let control: number | undefined;
  while (offset < gif.length) {
    const block = gif[offset++];
    if (block === EXTENSION) {
      if (gif[offset++] === GRAPHIC_CONTROL) control = offset + 1;
      skipSubBlocks();
    } else if (block === IMAGE) {
      const wholeCanvas =
        view.getUint16(offset, true) === 0 &&
        view.getUint16(offset + 2, true) === 0 &&
        view.getUint16(offset + 4, true) === width &&
        view.getUint16(offset + 6, true) === height;
      if (control !== undefined && wholeCanvas) {
        gif[control] = (gif[control] & ~DISPOSAL_BITS) | RESTORE_TO_BACKGROUND;
      }
      control = undefined;
      // The descriptor, its color table, and the LZW code size.
      offset += 9 + colorTable(gif[offset + 8]) + 1;
      skipSubBlocks();
    } else {
      return;
    }
  }
}
