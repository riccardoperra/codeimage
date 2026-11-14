import {readFile} from 'node:fs/promises';
import type {MeasuredNode} from '@takumi-rs/core';
import {Renderer} from '@takumi-rs/core';
import type {PNG} from 'pngjs';
import {describe, expect, it} from 'vitest';
import type {SnapshotInput} from './document';
import type {SnapshotMarkup} from './render';
import {renderSnapshot, snapshotMarkup} from './render';
import {sampleDocument} from './sample';
import {countPixels, decode, plainDocument} from './test-utils';

const png = async (input: SnapshotInput) => decode(await renderSnapshot(input));

const withEditor = (
  editor: Partial<(typeof sampleDocument.editor.editors)[number]>,
): SnapshotInput => ({
  ...sampleDocument,
  editor: {
    ...sampleDocument.editor,
    editors: [{...sampleDocument.editor.editors[0], ...editor}],
  },
});

const pixel = (image: PNG, x: number, y: number) => {
  const i = (y * image.width + x) * 4;
  return [...image.data.subarray(i, i + 3)];
};

async function textRuns(markup: SnapshotMarkup) {
  const renderer = new Renderer();
  for (const font of markup.fonts) {
    await renderer.registerFont({
      name: font.family,
      data: await readFile(font.path),
      weight: font.weight,
      unicodeRange: font.unicodeRange,
    });
  }
  const runs: {text: string; top: number}[] = [];
  const visit = (node: MeasuredNode) => {
    for (const run of node.runs) {
      runs.push({text: run.text, top: node.transform[5] + run.y});
    }
    node.children.forEach(visit);
  };
  visit(await renderer.measure(markup.html, {css: markup.css}));
  return (text: string) => {
    const run = runs.find(run => run.text.startsWith(text));
    if (!run) throw new Error(`No text run "${text}"`);
    return run.top;
  };
}

describe('renderSnapshot', {timeout: 30_000}, () => {
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

  describe.each([
    'macOs',
    'macOsGrayTheme',
    'macOsOutlineTheme',
    'windows',
  ] as const)('%s web export dimensions', type => {
    it.each([
      {name: 'one line', code: 'const x = 1;', scale: 2, size: [1000, 488]},
      {
        name: 'wide line',
        code: `alpha ${'wrap '.repeat(100)}\nbeta\ngamma`,
        scale: 1,
        size: [5061, 289],
      },
    ])(
      'matches the client box times scale for $name',
      async ({code, scale, size}) => {
        const image = await png({
          ...withEditor({code, tabName: 'index.ts'}),
          terminal: {...sampleDocument.terminal, type, shadow: null},
          width: 500,
          scale,
        });
        expect([image.width, image.height]).toEqual(size);
      },
    );
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

  it('keeps code and tab names that read like gradient directions', async () => {
    const {html} = await snapshotMarkup(
      withEditor({
        tabName: 'to right bottom.ts',
        code: 'const corner = "to left top";',
      }),
    );
    expect(html).toContain('to right bottom.ts');
    expect(html).toContain('"to left top"');
  });

  it('draws a corner gradient written side first', async () => {
    const image = await png({
      ...sampleDocument,
      scale: 1,
      frame: {
        ...sampleDocument.frame,
        radius: 0,
        background: 'linear-gradient(to right bottom, #ff0000, #0000ff)',
      },
    });
    const [r1, , b1] = pixel(image, 0, 0);
    const [r2, , b2] = pixel(image, image.width - 1, image.height - 1);
    expect([r1 > 240, b1 < 15]).toEqual([true, true]);
    expect([b2 > 240, r2 < 15]).toEqual([true, true]);
  });

  it('widens the frame to its longest line like the web export', async () => {
    const code = `alpha ${'wrap '.repeat(100)}\nbeta\ngamma`;
    const natural = await png({...withEditor({code}), scale: 1});
    const narrow = await png({...withEditor({code}), scale: 1, width: 500});
    expect(natural.width).toBeGreaterThan(1920);
    expect([narrow.width, narrow.height]).toEqual([
      natural.width,
      natural.height,
    ]);
  });

  it('keeps each line number beside its line', async () => {
    const markup = await snapshotMarkup({
      ...withEditor({code: `alpha ${'wrap '.repeat(100)}\nbeta\ngamma`}),
      scale: 1,
      width: 500,
    });
    const top = await textRuns(markup);
    expect(top('beta') - top('alpha')).toBeCloseTo(top('gamma') - top('beta'));
    expect(top('2')).toBeCloseTo(top('beta'), 1);
    expect(top('3')).toBeCloseTo(top('gamma'), 1);
  });

  it('colors line numbers like CodeMirror when the theme sets no color', async () => {
    const cmLightGutter = (r: number, g: number, b: number) =>
      [r, g, b].every(channel => Math.abs(channel - 0x6c) <= 1);
    const lines = '\n\n';
    const numbered = await png(
      plainDocument(lines, {themeId: 'duotoneDark', showLineNumbers: true}),
    );
    const plain = await png(
      plainDocument(lines, {themeId: 'duotoneDark', showLineNumbers: false}),
    );
    expect(countPixels(plain, cmLightGutter)).toBe(0);
    expect(countPixels(numbered, cmLightGutter)).toBeGreaterThan(10);
  });

  it('draws the watermark name on light and dark terminals', async () => {
    const watermarkPixels = async (themeId: string) => {
      const draw = (showWatermark: boolean) =>
        png({
          ...plainDocument('', {themeId}),
          terminal: {
            ...sampleDocument.terminal,
            background: '',
            textColor: '',
            showHeader: false,
            showWatermark,
          },
        });
      const [on, off] = await Promise.all([draw(true), draw(false)]);
      let changed = 0;
      for (let i = 0; i < on.data.length; i += 4) {
        const delta = [0, 1, 2].reduce(
          (sum, c) => sum + Math.abs(on.data[i + c] - off.data[i + c]),
          0,
        );
        if (delta > 30) changed++;
      }
      return changed;
    };
    const dark = await watermarkPixels('vsCodeDarkTheme');
    const light = await watermarkPixels('xCodeLight');
    expect(light).toBeGreaterThan(dark * 0.7);
  });

  it('parses a tab with the language its name selects', async () => {
    const sfc = '<template>\n  <p>{{ count }}</p>\n</template>';
    const content = async (tabName: string, languageId: string) => {
      const {html} = await snapshotMarkup(
        withEditor({tabName, languageId, code: sfc}),
      );
      return html.slice(html.indexOf('cm-content'));
    };
    const vue = await content('App.vue', 'typescript');
    expect(vue).toEqual(await content('index.html', 'html'));
    expect(vue).not.toEqual(await content('index.ts', 'typescript'));
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
