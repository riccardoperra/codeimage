import {mkdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {out} from './helpers';
import {lane0, lane1, lane2} from './appearance';
import {lane3, lane4, lane5} from './formats';
import {lane6, lane7, lane8} from './limits';
export async function main() {
  await rm(out, {recursive: true, force: true});
  await mkdir(out, {recursive: true});
  const results = [];

  results.push(await lane0());

  results.push(await lane1());

  results.push(await lane2());

  results.push(await lane3());

  results.push(await lane4());

  results.push(await lane5());

  results.push(await lane6());

  results.push(await lane7());

  results.push(await lane8());

  await writeFile(join(out, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Results in ${join(out, 'results.json')}`);
}
main().catch(error => {
  console.error(error);
  process.exit(1);
});
