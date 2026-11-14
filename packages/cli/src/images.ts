import type {RenderArgs} from './args';
import {FLAGS} from './flags';
import type {ImageOutput} from './flags';
import {buildSnapshot} from './snapshot';
import type {CodeInput, Preset} from './snapshot';

// Every flag sees the inputs, then the snapshot, then the output list, in
// FLAGS order. Redaction is first, so no later step sees a secret.
export async function planImages(
  args: RenderArgs,
  inputs: CodeInput[],
  preset?: Preset,
): Promise<ImageOutput[]> {
  for (const flag of FLAGS) {
    if (flag.prepareInputs)
      inputs = await flag.prepareInputs(inputs, args.values);
  }
  let snapshot = await buildSnapshot({args, inputs, preset});
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
