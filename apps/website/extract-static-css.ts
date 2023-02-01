import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PurgeCSS} from 'purgecss';

import manifest from './dist/public/manifest.json';

const cssEntries = [
  ...Object.entries(manifest).reduce((acc, [k, v]) => {
    if (k.endsWith('.css')) {
      acc.push([k, v.file]);
    }
    return acc;
  }, []),
];

const htmlSourcePath = join('./dist/public/index.html');

const htmlSource = readFileSync(join('./dist/public/index.html'), {
  encoding: 'utf-8',
});

let criticalStyle = '';
let patchedSource = htmlSource;

cssEntries
  .reverse()
  .sort(a => (a[0] === 'src/entry-client.css' ? -1 : 1))
  .forEach(([key, entry]) => {
    const source = readFileSync(join('./dist/public', entry), {
      encoding: 'utf-8',
    });
    criticalStyle += source;
    console.log(key);
  });

// const [resultPurge] = await new PurgeCSS().purge({
//   css: [
//     {
//       raw: criticalStyle,
//     },
//   ],
//   content: ['dist/public/index.html', 'dist/public/**.js'],
// });

patchedSource = patchedSource.replace(
  // prettier-ignore
  `<style id="css-critical-style"></style>`,
  // prettier-ignore
  `<style id="css-critical-style">${criticalStyle}</style>`,
);

writeFileSync(htmlSourcePath, patchedSource);
