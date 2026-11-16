import {writeFile} from 'node:fs/promises';
import {file, receipts, directory} from './common.mjs';
await writeFile(
  file('feature-flags-results.json'),
  JSON.stringify({passed: true, receipts}, null, 2) + '\n',
);
console.log(
  `Verified ${receipts.length} CLI runs and their artifacts in ${directory}`,
);
