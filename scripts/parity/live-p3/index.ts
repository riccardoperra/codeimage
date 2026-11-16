import {mkdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {out} from './helpers';
import {themes, backgroundImage, emojiAndCjk} from './appearance';
import {svg, opacityAndRadius, fonts} from './formats';
import {scale, badVersion, hugeDocument} from './limits';
export async function main() {
  await rm(out, {recursive: true, force: true});
  await mkdir(out, {recursive: true});
  const results = [];

  results.push(await themes());

  results.push(await backgroundImage());

  results.push(await emojiAndCjk());

  results.push(await svg());

  results.push(await opacityAndRadius());

  results.push(await fonts());

  results.push(await scale());

  results.push(await badVersion());

  results.push(await hugeDocument());

  await writeFile(join(out, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Results in ${join(out, 'results.json')}`);
}
main().catch(error => {
  console.error(error);
  process.exit(1);
});
