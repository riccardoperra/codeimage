import {cpSync} from 'fs';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const pkgDir = join(__dirname, '..');
const vercelOutputDir = join(pkgDir, '.vercel/output');

mkdirSync(vercelOutputDir, {recursive: true});

const configuration = {
  version: 3,
  routes: [
    {
      handle: 'filesystem'
    },
    {
      check: true,
      src: '/(.*)',
      dest: '/'
    }
  ]
};

writeFileSync(
  join(vercelOutputDir, 'config.json'),
  JSON.stringify(configuration),
  {encoding: 'utf-8'}
);

cpSync(join(pkgDir, 'dist'), join(vercelOutputDir, 'static'), {recursive: true});
