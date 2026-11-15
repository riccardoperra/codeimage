import {planImages} from '../images';
import {parsePreset} from '../snapshot';
import {sampleDocument} from '../../../render/src/sample';
import {createSignature} from '../../../../apps/codeimage/src/state/frame/model';
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
      const {snapshot} = await prepare(['--size', target]);
      const image = await renderSnapshot({...snapshot, scale: 2});
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
  it.each([
    {argv: []},
    {argv: ['--size', 'square']},
    {argv: ['--signature', '@new']},
    {argv: ['--signature-position', 'bottom-left']},
  ])(
    'preserves preset signature through planImages with %j',
    async ({argv: flags}) => {
      const args = parseArgs(flags);
      if (args.kind !== 'render') throw new Error('Expected render arguments');
      const signature = {
        ...createSignature('@me'),
        style: 'card',
        platform: 'github',
        name: 'The Octocat',
        avatar: 'profile',
        profile: 'github.com/octocat',
        savedId: 'saved',
        position: 'bottom-center',
      };
      const preset = parsePreset(
        JSON.stringify({
          frame: {...sampleDocument.frame, signature},
          terminal: {...sampleDocument.terminal, type: 'card', surface: 'wash'},
          editor: sampleDocument.editor.options,
        }),
      );
      const [output] = await planImages(
        args,
        [{name: 'index.ts', code: 'const x = 1;'}],
        preset,
      );
      expect(output.snapshot.frame.signature).toEqual({
        ...signature,
        ...(flags.includes('--signature') && {handle: '@new'}),
        ...(flags.includes('--signature-position') && {
          position: 'bottom-left',
        }),
      });
    },
  );
  it('names invalid size and signature options', () => {
    for (const argv of [
      ['--size', 'nope'],
      ['--signature', ''],
      ['--signature-position', 'top-left'],
      ['--scale', '2', '--size', 'og'],
    ]) {
      expect(() => parseArgs(argv)).toThrow(argv[0]);
    }
  });
  it('rejects a signature position without a signature', async () => {
    await expect(
      prepare(['--signature-position', 'bottom-left']),
    ).rejects.toThrow('--signature-position: needs --signature');
  });
});
