import {dirname, resolve} from 'node:path';
import type {Node} from '@babel/traverse';

type ImportDeclaration = Extract<Node, {type: 'ImportDeclaration'}>;

export function renderImport(
  declaration: ImportDeclaration,
  names: ReadonlySet<string>,
  source: string,
  originalFile?: string,
) {
  const defaultOrNamespace: string[] = [];
  const named: string[] = [];
  for (const specifier of declaration.specifiers) {
    if (!names.has(specifier.local.name)) continue;
    const {start, end} = specifier;
    if (typeof start !== 'number' || typeof end !== 'number')
      throw new Error('Missing import range');
    const fragment = source.slice(start, end);
    if (specifier.type === 'ImportSpecifier') named.push(fragment);
    else defaultOrNamespace.push(fragment);
  }
  if (named.length) defaultOrNamespace.push(`{${named.join(', ')}}`);
  if (!defaultOrNamespace.length) return '';
  const raw = declaration.source.value;
  const specifier =
    originalFile && raw.startsWith('.')
      ? resolve(dirname(originalFile), raw)
      : raw;
  const kind = declaration.importKind === 'type' ? 'type ' : '';
  return `import ${kind}${defaultOrNamespace.join(', ')} from ${JSON.stringify(specifier)};`;
}
