import {parseArgs} from '../args';
import {FLAGS} from './index';
import {buildSnapshot} from '../snapshot';
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
  for (const flag of FLAGS) {
    if (flag.prepareInputs)
      inputs = await flag.prepareInputs(inputs, args.values);
  }
  const snapshot = FLAGS.reduce(
    (snapshot, flag) => flag.apply(snapshot, args.values),
    await buildSnapshot({args, inputs}),
  );
  let outputs = [{path: args.output, snapshot}];
  for (const flag of FLAGS) {
    const expand = flag.outputs;
    if (expand)
      outputs = outputs.flatMap(output => expand(output, args.values));
  }
  return {snapshot, outputs, args};
}
