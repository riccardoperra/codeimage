import {parseArgs} from 'node:util';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createWebHost} from './web-host';
import {createCases} from './cases';
import {prepareCase} from './prepare';
import {checkGeometry} from './geometry';
import {checkEndpoints} from './endpoints';
import {checkEncoded} from './encoded';
import {reportCase} from './report';
export const {values: args} = parseArgs({
  options: {
    out: {type: 'string', default: '/tmp/codeimage-parity/animation'},
    case: {type: 'string', multiple: true},
    scale: {type: 'string', default: '2'},

    encode: {type: 'boolean', default: false},

    shift: {type: 'string'},
  },
});
export const out = args.out;
export async function main() {
  const web = await createWebHost();
  const cases = createCases(Number(args.scale));
  const selected = args.case?.length
    ? cases.filter(({name}) => args.case?.includes(name))
    : cases;
  await mkdir(args.out, {recursive: true});
  const rows = [];
  for (const cell of selected) {
    const prepared = await prepareCase(cell, args, web);
    const geometry = await checkGeometry(prepared);
    const endpoints = await checkEndpoints(prepared, args.out);
    const encoded = await checkEncoded(prepared, args);
    const row = reportCase(prepared, geometry, endpoints, encoded);
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  await writeFile(
    join(args.out, 'results.json'),
    JSON.stringify(rows, null, 2),
  );
  console.table(rows);
  process.exitCode = rows.some(row => !row.pass) ? 1 : 0;
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
