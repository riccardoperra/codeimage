import chalk from 'chalk';
import {cpSync, existsSync, mkdirSync, rmdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

function getVercelDir(): string {
  return resolve(join(process.cwd(), '.vercel'));
}

const vercelDir = getVercelDir();
if (existsSync(vercelDir)) {
  rmdirSync(vercelDir, {recursive: true});
}

const configuration = {
  version: 3,
  routes: [
    {
      handle: 'filesystem',
    },
    {
      check: true,
      src: '/(.*)',
      dest: '/',
    },
  ],
};

console.log(chalk.cyan('Building for Vercel output...'));
const outputDir = join(vercelDir, 'output');
mkdirSync(join(vercelDir, 'output'), {recursive: true});
writeFileSync(join(outputDir, 'config.json'), JSON.stringify(configuration), {
  encoding: 'utf-8',
});

const distFolder = resolve(join(process.cwd(), 'dist/public'));
cpSync(distFolder, join(outputDir, 'static'), {recursive: true});
console.log(chalk.green('Vercel output generated successfully.'));
