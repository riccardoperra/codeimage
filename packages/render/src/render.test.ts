import {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';
import type {SnapshotInput} from './document';
import {renderSnapshot, snapshotMarkup} from './render';
import {sampleDocument} from './sample';

const png = async (input: SnapshotInput) =>
  PNG.sync.read(Buffer.from((await renderSnapshot(input)) as Uint8Array));

const withEditor = (
  editor: Partial<(typeof sampleDocument.editor.editors)[number]>,
): SnapshotInput => ({
  ...sampleDocument,
  editor: {
    ...sampleDocument.editor,
    editors: [{...sampleDocument.editor.editors[0], ...editor}],
  },
});

describe('renderSnapshot', () => {
  it('scales the frame by whole multiples', async () => {
    const [one, two, three] = await Promise.all(
      [1, 2, 3].map(scale => png({...sampleDocument, scale})),
    );
    expect(one.width).toBeGreaterThan(0);
    expect([two.width, two.height]).toEqual([one.width * 2, one.height * 2]);
    expect([three.width, three.height]).toEqual([
      one.width * 3,
      one.height * 3,
    ]);
  });

  it('sizes the frame to the requested width', async () => {
    const image = await png({...sampleDocument, scale: 1, width: 1200});
    expect(image.width).toBe(1200);
  });

  it('grows with the code', async () => {
    const short = await png({...sampleDocument, scale: 1});
    const long = await png({
      ...withEditor({code: 'const x = 1;\n'.repeat(40)}),
      scale: 1,
    });
    expect(long.height).toBeGreaterThan(short.height);
  });

  it('encodes each raster format', async () => {
    const signatures = {
      png: [0x89, 0x50, 0x4e, 0x47],
      jpeg: [0xff, 0xd8, 0xff],
      webp: [0x52, 0x49, 0x46, 0x46],
    } as const;
    for (const [format, signature] of Object.entries(signatures)) {
      const bytes = (await renderSnapshot({
        ...sampleDocument,
        format: format as keyof typeof signatures,
      })) as Uint8Array;
      expect([...bytes.subarray(0, signature.length)]).toEqual(signature);
    }
  });

  it('returns SVG markup without foreignObject', async () => {
    const svg = await renderSnapshot({...sampleDocument, format: 'svg'});
    expect(typeof svg).toBe('string');
    expect(svg).toMatch(/^<svg/);
    expect(svg).not.toContain('foreignObject');
  });

  it('keeps every render independent of the previous one', async () => {
    const first = withEditor({tabName: 'first.ts', code: 'const a = 1;'});
    const second = withEditor({tabName: 'second.py', code: 'b = [1, 2]'});
    const before = await renderSnapshot(first);
    const other = await renderSnapshot(second);
    const after = await renderSnapshot(first);
    const concurrent = await Promise.all([
      renderSnapshot(second),
      renderSnapshot(first),
    ]);
    expect(other).not.toEqual(before);
    expect(after).toEqual(before);
    expect(concurrent).toEqual([other, before]);
  });

  it('draws the tab title and its TypeScript icon', async () => {
    const {html} = await snapshotMarkup(withEditor({tabName: 'hello.ts'}));
    expect(html).toContain('hello.ts');
    expect(html).not.toContain('<script');
    expect(html).toMatch(/viewBox="0 0 16 16"[^>]*><path fill="#0288d1"/);
  });

  it('hides an untitled tab like the web export', async () => {
    const {html, css} = await snapshotMarkup(withEditor({tabName: ''}));
    expect(html).toContain('data-export-exclude="true"');
    expect(css.join('\n')).toContain('[data-export-exclude="true"]');
  });

  it.each([
    [{themeId: 'nope'}, 'Unknown theme "nope"'],
    [{fontId: 'comic-sans'}, 'Unknown font "comic-sans"'],
  ])('names an unknown option %o', async (options, message) => {
    await expect(
      renderSnapshot({
        ...sampleDocument,
        editor: {
          ...sampleDocument.editor,
          options: {...sampleDocument.editor.options, ...options},
        },
      }),
    ).rejects.toThrow(message);
  });

  it('rejects a background that lives in the browser', async () => {
    await expect(
      renderSnapshot({
        ...sampleDocument,
        frame: {...sampleDocument.frame, background: 'asset:123'},
      }),
    ).rejects.toThrow('asset:123');
  });
});
