import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import manifest from './dist/public/manifest.json';

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let patchedSource = htmlSource;

const entry = manifest['style.css'].file;

patchedSource = patchedSource.replace(
  `</head>`,
  `<link rel='stylesheet' href='${entry}'></head>`,
);

writeFileSync(htmlSourcePath, patchedSource);
