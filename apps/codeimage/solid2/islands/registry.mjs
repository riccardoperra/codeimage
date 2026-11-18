import {basename, extname, resolve} from 'node:path';
import {normalizePath} from 'vite';

export function registerIslands(root, entries) {
  const islands = new Map();
  for (const {file, export: exportName = 'default'} of entries) {
    const id = normalizePath(resolve(root, file));
    if (islands.has(id))
      throw new Error(`Solid 2 island already registered: ${file}`);
    const component =
      exportName === 'default' ? basename(id, extname(id)) : exportName;
    const name = component.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
    islands.set(id, {exportName, name, mount: `mountIsland${islands.size}`});
  }
  return islands;
}

export function islandMounts(islands, mountFactory, existingEntry) {
  const lines = [
    `export * from ${JSON.stringify(existingEntry)};`,
    `import {createSolid2Mount} from ${JSON.stringify(mountFactory)};`,
  ];
  for (const [file, {exportName, mount}] of islands) {
    const component = `${mount}Component`;
    lines.push(
      `import {${JSON.stringify(exportName)} as ${component}} from ${JSON.stringify(file)};`,
      `export const ${mount} = createSolid2Mount(${component});`,
    );
  }
  return lines.join('\n');
}

export function islandWrapper(
  {exportName, name, mount},
  moduleId,
  hostFactory,
  hostStyles,
) {
  return [
    `import {createSolid2Island} from ${JSON.stringify(hostFactory)};`,
    `import {islandHost} from ${JSON.stringify(hostStyles)};`,
    `import {${mount}} from ${JSON.stringify(moduleId)};`,
    `const Island = createSolid2Island(${mount}, {name: ${JSON.stringify(name)}, class: islandHost});`,
    `export {Island as ${JSON.stringify(exportName)}};`,
  ].join('\n');
}
