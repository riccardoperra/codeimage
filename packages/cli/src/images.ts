import type {RenderArgs} from './args';
import {FLAGS} from './flags';
import type {ImageOutput} from './flags';
import {buildSnapshot} from './snapshot';
import type {CodeInput, Preset} from './snapshot';

export async function planImages(
  args: RenderArgs,
  inputs: CodeInput[],
  preset?: Preset,
): Promise<ImageOutput[]> {
  let preparedInputs = inputs;
  for (const flag of FLAGS) {
    if (flag.prepareInputs)
      preparedInputs = await flag.prepareInputs(preparedInputs, args.values);
  }
  let snapshot = await buildSnapshot({args, inputs: preparedInputs, preset});
  for (const flag of FLAGS) {
    if (flag.apply) snapshot = flag.apply(snapshot, args.values);
  }
  let outputs = [{path: args.output, snapshot}];
  for (const flag of FLAGS) {
    const expand = flag.outputs;
    if (expand)
      outputs = outputs.flatMap(output => expand(output, args.values));
  }
  return outputs;
}
