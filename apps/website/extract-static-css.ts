import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PurgeCSS} from 'purgecss';

import manifest from './dist/public/manifest.json';

const [criticalEntries, indexEntries] = [
  ...Object.entries(manifest).reduce(
    (acc, [k, v]) => {
      if (k.endsWith('.css')) {
        const array = k.startsWith('src/') ? acc[1] : acc[0];
        array.push([k, v.file]);
      }
      return acc;
    },
    [[], []],
  ),
];

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let criticalStyle = '';
let patchedSource = htmlSource;

[...indexEntries, ...criticalEntries].forEach(([key, entry]) => {
  const source = readFileSync(join('./dist/public', entry), {
    encoding: 'utf-8',
  });
  criticalStyle += source;
  console.log(key);
});

const [resultPurge] = await new PurgeCSS().purge({
  css: [
    {
      raw: criticalStyle,
    },
  ],
  content: ['dist/public/index.html', 'dist/public/**.js'],
});

patchedSource = patchedSource.replace(
  // prettier-ignore
  `<style id="css-critical-style"></style>`,
  // prettier-ignore
  `<style id="css-critical-style">${resultPurge.css}</style>`,
);

writeFileSync(htmlSourcePath, patchedSource);
