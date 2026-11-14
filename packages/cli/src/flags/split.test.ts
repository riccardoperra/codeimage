import {describe, expect, it} from 'vitest';
import {prepare} from './test-utils';
import {parseArgs} from '../args';

describe('split flag', () => {
  const inputs = [
    {name: 'path/a.ts', code: 'const a = 1;'},
    {name: 'path with spaces/b.py', code: 'print(2)'},
    {name: 'c.rs', code: 'fn main() {}'},
  ];
  it('writes numbered paths with exactly one active input tab per image', async () => {
    const {outputs} = await prepare(
      ['--split-tabs', '-o', '/tmp/out.png'],
      inputs,
    );
    expect(outputs.map(output => output.path)).toEqual([
      '/tmp/out-01.png',
      '/tmp/out-02.png',
      '/tmp/out-03.png',
    ]);
    expect(
      outputs.map(output =>
        output.snapshot.editor.editors.map(tab => tab.code),
      ),
    ).toEqual(inputs.map(input => [input.code]));
  });
  it('supports other formats, extensionless paths, and more than nine tabs', async () => {
    const {outputs} = await prepare(
      ['--split-tabs', '--format', 'svg', '-o', 'out'],
      Array.from({length: 12}, () => inputs[0]),
    );
    expect(outputs[0].path).toBe('out-01.svg');
    expect(outputs[11].path).toBe('out-12.svg');
  });
  it('keeps a single combined output without the flag', async () => {
    const {outputs} = await prepare([], inputs);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].snapshot.editor.editors).toHaveLength(3);
  });
  it('rejects stdout before reading inputs', () => {
    expect(() => parseArgs(['--split-tabs', '-o', '-'])).toThrow(
      '--split-tabs',
    );
  });
});
