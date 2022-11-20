import {readFileSync, writeFileSync} from 'node:fs';
import {relative, join} from 'node:path';
import {parse} from 'node-html-parser';

import manifest from './dist/public/manifest.json';

const cssEntries = manifest['src/entry-client.tsx'].css;

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

const document = parse(htmlSource);

let style = '';

cssEntries.forEach(entry => {
  const stylesheets = document.querySelectorAll(`link[rel="stylesheet"]`);
  stylesheets.forEach(stylesheet => {
    const href = stylesheet.getAttribute('href');
    if (href === `/${entry}`) {
      console.log('reading source');
      const source = readFileSync(join('./dist/public', entry), {
        encoding: 'utf-8',
      });

      style += source;

      stylesheet.remove();
    }
  });
});

const styleTag = parse(`<style>${style}</style>`);
document.querySelector('head').appendChild(styleTag);

writeFileSync(htmlSourcePath, document.toString());
