import {parseArgs} from '../args';
import {planImages} from '../images';
import type {CodeInput, Preset} from '../snapshot';

export async function prepare(
  argv: string[],
  inputs: CodeInput[] = [
    {
      name: 'a.ts',
      code: 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine',
    },
  ],
  preset?: Preset,
) {
  const args = parseArgs(argv);
  if (args.kind !== 'render') throw new Error('Expected render arguments');
  const outputs = await planImages(args, inputs, preset);
  return {snapshot: outputs[0].snapshot, outputs, args};
}
