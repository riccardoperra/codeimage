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
let criticalStylePath = '';

cssEntries.forEach(([key, entry]) => {
  const source = readFileSync(join('./dist/public', entry), {
    encoding: 'utf-8',
  });
  console.log(key);
  if (key === 'src/entry-client.css') {
    criticalStylePath = entry;
  }
  criticalStyle += source;
});

patchedSource = patchedSource.replace(
  `</head>`,
  `<link rel='preload stylesheet' as='style' href='/${criticalStylePath}'></head>`,
);

console.log(criticalStylePath);
writeFileSync(`./dist/public/${criticalStylePath}`, criticalStyle, {
  encoding: 'utf-8',
});

writeFileSync(htmlSourcePath, patchedSource);
