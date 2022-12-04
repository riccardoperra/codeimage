import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import manifest from './dist/public/manifest.json';

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let patchedSource = htmlSource;

const entry = manifest['style.css'].file;
const source = readFileSync(join('./dist/public', entry), {
  encoding: 'utf-8',
});

patchedSource = patchedSource.replace(
  `<style id="css-critical-style"></style>`,
  `<style id="css-critical-style">${source}</style>`,
);

writeFileSync(htmlSourcePath, patchedSource);
