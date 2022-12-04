import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import manifest from './dist/public/manifest.json';

const cssEntries = [
  ...Object.entries(manifest)
    .reduce((acc, [k, v]) => {
      if (k.endsWith('.css')) {
        return [...acc, [k, v.file]];
      }
      return acc;
    }, [])
    .sort(a => (a[0].startsWith('src/') ? 1 : -1)),
];

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let criticalStyle = '';
let patchedSource = htmlSource;

cssEntries.forEach(([key, entry]) => {
  const source = readFileSync(join('./dist/public', entry), {
    encoding: 'utf-8',
  });
  criticalStyle += source;
});

patchedSource = patchedSource.replace(
  `<style id="css-critical-style"></style>`,
  `<style id="css-critical-style">${criticalStyle}</style>`,
);

writeFileSync(htmlSourcePath, patchedSource);
