import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const renderer = new URL('../../render/', import.meta.url);
const cli = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const render = JSON.parse(
  await readFile(new URL('package.json', renderer), 'utf8'),
);
const {scripts, devDependencies, publishConfig, files, ...manifest} = cli;
const {'@codeimage/render': bundledRenderer, ...dependencies} =
  cli.dependencies;

await rm(new URL('publish', root), {recursive: true, force: true});
await mkdir(new URL('publish', root));
await Promise.all([
  ...['fonts', 'ssr'].map(directory =>
    cp(
      new URL(`dist/${directory}`, renderer),
      new URL(`dist/${directory}`, root),
      {recursive: true},
    ),
  ),
  cp(new URL('README.md', root), new URL('publish/README.md', root)),
  cp(new URL('../../LICENSE', root), new URL('publish/LICENSE', root)),
]);
await cp(new URL('dist', root), new URL('publish/dist', root), {
  recursive: true,
});
await writeFile(
  new URL('publish/package.json', root),
  JSON.stringify(
    {
      ...manifest,
      dependencies: {...dependencies, ...render.dependencies},
      publishConfig: {access: publishConfig.access},
    },
    null,
    2,
  ) + '\n',
);
