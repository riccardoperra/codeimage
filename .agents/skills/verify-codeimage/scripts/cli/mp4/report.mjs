import {results} from './common.mjs';
console.log(JSON.stringify(results, null, 2));
if (Object.values(results).some(result => result.status !== 'pass'))
  process.exitCode = 1;
