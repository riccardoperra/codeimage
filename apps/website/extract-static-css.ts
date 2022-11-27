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

  criticalStyle += source;

  if (key === 'src/entry-client.css') {
    criticalStylePath = entry;
  }
  // else if (!key.startsWith('src')) {
  //   criticalStyle += source;
  // } else {
  //   criticalStyle += source;
  // }
});

// patchedSource = patchedSource.replace(
//   '<style id="css-critical-style"></style>',
//   `<style id="css-critical-style">${criticalStyle}</style>`,
// );

patchedSource = patchedSource.replace(
  `</head>`,
  `<link rel='preload stylesheet' as='style' href='/${criticalStylePath}'></head>`,
);

writeFileSync(`./dist/public/${criticalStylePath}`, criticalStyle, {
  encoding: 'utf-8',
});
writeFileSync(htmlSourcePath, patchedSource);
