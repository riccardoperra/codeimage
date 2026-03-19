const {execSync} = require('node:child_process');
const fs = require('node:fs');

const generatedTypes = fs.existsSync('./generated');

if (!generatedTypes) {
  console.warn('Prisma types has not been generated. Skipping build');
  process.exit(0);
}

execSync('pnpm run build:ts', {stdio: 'inherit'});
