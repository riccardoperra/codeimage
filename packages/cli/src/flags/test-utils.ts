import {parseArgs} from '../args';
import {planImages} from '../images';
import type {CodeInput} from '../snapshot';

export async function prepare(
  argv: string[],
  inputs: CodeInput[] = [
    {
      name: 'a.ts',
      code: 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine',
    },
  ],
) {
  const args = parseArgs(argv);
  if (args.kind !== 'render') throw new Error('Expected render arguments');
  const outputs = await planImages(args, inputs);
  return {snapshot: outputs[0].snapshot, outputs, args};
}
