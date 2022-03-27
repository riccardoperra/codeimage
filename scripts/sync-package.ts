import {join} from 'path';
import {readFileSync, writeFileSync} from 'fs';

/**
 * Synchronize @codeimage/app package.json version in root package.json
 */
function sync() {
  const appPackageJsonPath = join(
    __dirname,
    '..',
    'apps',
    'codeimage',
    'package.json',
  );

  const rootPackageJsonPath = join(__dirname, '..', 'package.json');

  const {version} = JSON.parse(readFileSync(appPackageJsonPath, 'utf8'));

  const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));

  rootPackageJson.version = version;

  console.log('Updating package version to', version);

  writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
}

sync();
