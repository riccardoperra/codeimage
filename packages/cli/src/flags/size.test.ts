import {describe, expect, it} from 'vitest';
import {renderSnapshot, snapshotMarkup} from '@codeimage/render';
import {prepare} from './test-utils';
import {parseArgs} from '../args';

describe('size flag', () => {
  it.each([
    ['x-landscape', 1600, 900],
    ['square', 1080, 1080],
    ['linkedin-portrait', 1080, 1350],
    ['og', 1200, 630],
  ] as const)(
    'renders %s at its exact pixel size',
    async (target, width, height) => {
      const {snapshot} = await prepare(['--size', target, '--scale', '2']);
      const image = await renderSnapshot(snapshot);
      if (typeof image === 'string') throw new Error('Expected PNG');
      const bytes = Buffer.from(image);
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
        width,
        height,
      ]);
    },
  );
  it.each(['bottom-left', 'bottom-right'])(
    'draws the signature at %s and fits a long snippet',
    async position => {
      const {snapshot} = await prepare(
        [
          '--size',
          'og',
          '--signature',
          '@me',
          '--signature-position',
          position,
        ],
        [{name: 'a.ts', code: 'const value = 1;\n'.repeat(60)}],
      );
      const markup = await snapshotMarkup(snapshot);
      expect(markup.html).toContain(`data-frame-signature="${position}"`);
      expect(markup.html).toContain('@me');
      expect(markup.css.join('')).toMatch(/transform:scale\(0\./);
    },
  );
  it('names invalid size and signature options', () => {
    for (const argv of [
      ['--size', 'nope'],
      ['--signature', ''],
      ['--signature-position', 'top-left'],
    ]) {
      expect(() => parseArgs(argv)).toThrow(argv[0]);
    }
  });
});
