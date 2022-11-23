import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import manifest from './dist/public/manifest.json';

const cssEntries = [manifest['style.css'].file];

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let style = '';
let patchedSource = htmlSource;

cssEntries.forEach(entry => {
  const script = `<link rel="stylesheet" href="/${entry}">`;
  patchedSource = patchedSource.replace(`</head>`, `${script}</head>`);
});

writeFileSync(htmlSourcePath, patchedSource);
