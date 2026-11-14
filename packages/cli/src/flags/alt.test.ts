import {describe, expect, it, vi} from 'vitest';
import {altText} from '../../../../apps/codeimage/src/core/altText';
import {prepare} from './test-utils';
import {alt} from './alt';
import {parseArgs} from '../args';

describe('alt flag', () => {
  it('writes the shared web alt text with the selected line range', async () => {
    const {outputs, args} = await prepare([
      '--alt',
      '--lines',
      '5-8',
      '-o',
      'foo.png',
    ]);
    const tab = outputs[0].snapshot.editor.editors[0];
    expect(alt.sidecars?.(outputs[0], args.values)).toEqual([
      {
        path: 'foo.png.alt.txt',
        text: altText({...tab, tab: {tabName: tab.tabName}}),
      },
    ]);
    expect(alt.sidecars?.(outputs[0], args.values)?.[0].text).toContain(
      'TypeScript code, a.ts, lines 5 to 8',
    );
  });
  it('generates a separate sidecar for each split image with redacted text', async () => {
    const token = 'ghp_aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0iL3oP6';
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      const {outputs, args} = await prepare(
        ['--alt', '--split-tabs', '-o', 'out.png'],
        [
          {name: 'a.ts', code: token},
          {name: 'b.py', code: 'print(2)'},
        ],
      );
      const sidecars = outputs.flatMap(
        output => alt.sidecars?.(output, args.values) ?? [],
      );
      expect(sidecars.map(file => file.path)).toEqual([
        'out-01.png.alt.txt',
        'out-02.png.alt.txt',
      ]);
      expect(sidecars[0].text).not.toContain(token);
      expect(sidecars[0].text).toContain('ghp_••');
      expect(sidecars[1].text).toContain('Python code, b.py');
    } finally {
      stderr.mockRestore();
    }
  });
  it('uses only the visible active tab for a combined image', async () => {
    const {outputs, args} = await prepare(
      ['--alt'],
      [
        {name: 'a.ts', code: 'one'},
        {name: 'b.ts', code: 'two'},
      ],
    );
    expect(alt.sidecars?.(outputs[0], args.values)?.[0].text).toBe(
      'TypeScript code, a.ts, line 1\n\none',
    );
  });
  it('does not write a sidecar unless requested and rejects stdout', async () => {
    const {outputs, args} = await prepare([]);
    expect(alt.sidecars?.(outputs[0], args.values)).toEqual([]);
    expect(() => parseArgs(['--alt', '-o', '-'])).toThrow('--alt');
  });
});
