// Builds dist/api-bundle, the directory uploaded to Railway. Railway installs it with npm,
// since the bundle has no lockfile, so it must be a valid standalone npm package.
import {execFileSync} from 'node:child_process';
import {copyFileSync, readFileSync, rmSync, writeFileSync} from 'node:fs';

const outDir = 'dist/api-bundle';
const prismaModels = `${outDir}/workspace-dependencies/prisma-models`;

execFileSync(
  'pnpm-bundle-workspace-package',
  ['@codeimage/api', `--outDir=${outDir}`],
  {stdio: 'inherit'},
);

// Its "generated" entry would make Railway skip the Prisma client.
rmSync(`${prismaModels}/.gitignore`, {force: true});

// The bundler skips every package.json below the package root. The generated Prisma client needs
// its own to stay CommonJS inside the "type": "module" prisma-models package.
const generatedClientManifest = 'generated/client/package.json';
copyFileSync(
  `packages/prisma-models/${generatedClientManifest}`,
  `${prismaModels}/${generatedClientManifest}`,
);

// npm cannot resolve pnpm "catalog:" versions and installs nothing when it meets one.
// Runtime needs dependencies only.
const manifestPath = `${outDir}/package.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
delete manifest.devDependencies;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
