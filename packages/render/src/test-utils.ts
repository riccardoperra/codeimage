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
