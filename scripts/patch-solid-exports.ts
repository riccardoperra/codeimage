import {resolve} from 'path';
import {readFileSync, writeFileSync} from 'fs';

const rootLib = resolve(
  __dirname,
  '..',
  'apps',
  'codeimage',
  'node_modules',
  '@thisbeyond',
  'solid-dnd',
);

const solidJsPackageDef = `${rootLib}/package.json`;
const file = JSON.parse(readFileSync(solidJsPackageDef, 'utf8'));

const applyPatch = process.env.APPLY_PATCH === 'true';

if (applyPatch) {
  console.log('Apply patch');
  file.exports = {
    '.': {
      default: './dist/esm/index.js',
      solid: './dist/source/index.jsx',
    },
  };
} else {
  console.log('Remove patch');
  file.exports = {
    '.': {
      solid: './dist/source/index.jsx',
      default: './dist/esm/index.js',
    },
  };
}

writeFileSync(solidJsPackageDef, JSON.stringify(file, null, 2));
