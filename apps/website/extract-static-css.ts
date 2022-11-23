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
    .sort(a => (a[0].startsWith('src/') ? 1 : -1))
    .map(a => a[1]),
];
console.log(cssEntries);

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let style = '';
let patchedSource = htmlSource;

cssEntries.forEach(entry => {
  const source = readFileSync(join('./dist/public', entry), {
    encoding: 'utf-8',
  });

  style += source;

  writeFileSync(join('./dist/public', entry), '');

  patchedSource = patchedSource.replace(
    `<link rel='stylesheet' href='/${entry}'>`,
    `<link rel='stylesheet' href='/${entry}' media='print'>`,
  );
});

patchedSource = patchedSource.replace(
  '<style id="css-critical-style"></style>',
  `<style id='css-critical-style'>${style}</style>`,
);

writeFileSync(htmlSourcePath, patchedSource);
