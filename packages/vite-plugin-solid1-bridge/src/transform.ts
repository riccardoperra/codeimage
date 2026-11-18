import {createRequire} from 'node:module';
import {parse} from '@babel/parser';
import type {
  Binding,
  Node,
  NodePath,
  Scope,
  TraverseOptions,
} from '@babel/traverse';
import type {CaptureKind, LegacyModuleRule} from './contracts.js';
import {componentsId, runtimeId, stylesId} from './ids.js';
import {renderImport} from './imports.js';

const {
  default: traverse,
}: {
  default: (node: ReturnType<typeof parse>, options: TraverseOptions) => void;
} = createRequire(import.meta.url)('@babel/traverse');

type AstNode<Type extends Node['type']> = Extract<Node, {type: Type}>;
type Identifier = AstNode<'Identifier'>;
type ImportDeclaration = AstNode<'ImportDeclaration'>;
type ImportSpecifier = AstNode<'ImportSpecifier'>;
type JSXElement = AstNode<'JSXElement'>;
type JSXExpressionContainer = AstNode<'JSXExpressionContainer'>;

type ModuleRules = ReadonlyMap<string, LegacyModuleRule>;
type ComponentName = Identifier | JSXElement['openingElement']['name'];
type LocatedNode = Pick<Node, 'start' | 'end'>;
type Span = {start: number; end: number};
type Edit = Span & {replacement: string};

interface ImportedComponent {
  declaration: ImportDeclaration;
  binding: Binding;
  source: string;
  imported: string;
}

interface CompileOptions {
  key: number;
  file: string;
  modules: ModuleRules;
  legacyComponents: readonly string[];
}

export interface CompiledBridge {
  host: string;
  legacy: string;
  exported: string[];
}

function parseJsx(code: string) {
  return parse(code, {sourceType: 'module', plugins: ['jsx', 'typescript']});
}

function span(node: LocatedNode): Span {
  const {start, end} = node;
  if (
    start === null ||
    start === undefined ||
    end === null ||
    end === undefined
  ) {
    throw new Error('Missing JSX source range');
  }
  return {start, end};
}

function importedName(specifier: ImportSpecifier): string {
  return specifier.imported.type === 'Identifier'
    ? specifier.imported.name
    : specifier.imported.value;
}

function importedComponent(
  scope: Scope,
  name: ComponentName,
): ImportedComponent | undefined {
  const root = name.type === 'JSXMemberExpression' ? name.object : name;
  if (root.type !== 'Identifier' && root.type !== 'JSXIdentifier') return;
  const binding = scope.getBinding(root.name);
  if (!binding?.path.isImportSpecifier()) return;
  const declaration = binding.path.parentPath.node;
  if (declaration.type !== 'ImportDeclaration') return;
  return {
    declaration,
    binding,
    source: declaration.source.value,
    imported: importedName(binding.path.node),
  };
}

function isCompound(path: NodePath<JSXElement>, modules: ModuleRules) {
  const {name} = path.node.openingElement;
  if (name.type !== 'JSXIdentifier') return false;
  const component = importedComponent(path.scope, name);
  return (
    component &&
    modules.get(component.source)?.compound?.includes(component.imported)
  );
}

function replaceRanges(source: string, edits: readonly Edit[], offset = 0) {
  return [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (code, {start, end, replacement}) =>
        code.slice(0, start - offset) + replacement + code.slice(end - offset),
      source,
    );
}

function compileIsland(
  path: NodePath<JSXElement>,
  code: string,
  imports: Map<string, ImportedComponent>,
  legacySources: ReadonlySet<string>,
) {
  const captures: string[] = [];
  const edits: Edit[] = [];
  const sourceOf = (node: LocatedNode) => {
    const {start, end} = span(node);
    return code.slice(start, end);
  };

  function moveComponent(name: ComponentName) {
    const component = importedComponent(path.scope, name);
    if (!component || !legacySources.has(component.source)) {
      throw new Error(`Solid 1 bridge cannot move component ${sourceOf(name)}`);
    }
    const local = component.binding.identifier.name;
    imports.set(local, component);
  }

  function capture(container: JSXExpressionContainer, kind: CaptureKind) {
    const {expression} = container;
    const index = captures.length;
    captures.push(
      `readIslandValue(${sourceOf(expression)}, ${JSON.stringify(kind)})`,
    );
    edits.push({...span(expression), replacement: `props.values[${index}]`});
  }

  function compileElement(node: JSXElement) {
    const {name, attributes} = node.openingElement;
    if (name.type !== 'JSXIdentifier' || /^[A-Z]/.test(name.name))
      moveComponent(name);

    for (const attribute of attributes) {
      if (attribute.type === 'JSXSpreadAttribute') {
        throw new Error('Solid 1 bridges require explicit props');
      }
      if (attribute.value?.type !== 'JSXExpressionContainer') continue;
      if (attribute.name.type !== 'JSXIdentifier') {
        throw new Error(
          'Solid 1 bridges require a plain name for dynamic props',
        );
      }
      const prop = attribute.name.name;
      const {expression} = attribute.value;
      if (prop === 'as' && expression.type === 'Identifier') {
        moveComponent(expression);
      } else if (prop === 'ref' || prop === 'as') {
        throw new Error(`Solid 1 bridges cannot infer a boundary for ${prop}`);
      } else {
        capture(attribute.value, /^on[A-Z]/.test(prop) ? 'callback' : 'value');
      }
    }

    for (const child of node.children) {
      switch (child.type) {
        case 'JSXText':
          break;
        case 'JSXElement':
          compileElement(child);
          break;
        case 'JSXExpressionContainer':
          if (child.expression.type !== 'JSXEmptyExpression')
            capture(child, 'text');
          break;
        default:
          throw new Error(`Unsupported Solid 1 bridge child: ${child.type}`);
      }
    }
  }

  compileElement(path.node);
  return {
    jsx: replaceRanges(sourceOf(path.node), edits, span(path.node).start),
    captures,
  };
}

export function compileBridge(
  code: string,
  {key, file, modules, legacyComponents}: CompileOptions,
): CompiledBridge | undefined {
  const legacySources = new Set([...modules.keys(), ...legacyComponents]);
  const ast = parseJsx(code);
  const islands: ReturnType<typeof compileIsland>[] = [];
  const imports = new Map<string, ImportedComponent>();
  const standalone = new Map<string, string>();
  const ranges: Edit[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const rule = modules.get(path.node.source.value);
      if (!rule) return;
      for (const specifier of path.node.specifiers) {
        if (
          specifier.type !== 'ImportSpecifier' ||
          !rule.standalone?.includes(importedName(specifier))
        )
          continue;
        const name = specifier.local.name;
        const component = importedComponent(path.scope, specifier.local);
        if (!component) continue;
        imports.set(name, component);
        standalone.set(name, `mount${key}Component${standalone.size}`);
      }
    },
    JSXElement(path) {
      if (!isCompound(path, modules)) return;
      const island = compileIsland(path, code, imports, legacySources);
      const index = islands.push(island) - 1;
      ranges.push({
        ...span(path.node),
        replacement: `<BridgedFamily${index} values={[${island.captures.join(', ')}]} />`,
      });
      path.skip();
    },
  });

  const declarations = new Set<ImportDeclaration>();
  for (const {binding, declaration} of imports.values()) {
    const staysInHost =
      !standalone.has(binding.identifier.name) &&
      binding.referencePaths.some(({node}) => {
        const reference = span(node);
        return !ranges.some(
          ({start, end}) => reference.start >= start && reference.end <= end,
        );
      });
    if (staysInHost)
      throw new Error(
        `Legacy import ${binding.identifier.name} is used outside a bridge`,
      );
    declarations.add(declaration);
  }
  const moved = new Set(imports.keys());

  const exported = [
    ...standalone.values(),
    ...islands.map((_, index) => `mount${key}Family${index}`),
  ];
  if (!exported.length) return;
  const familyMounts = exported.slice(standalone.size);
  const legacy = [
    "import {createLegacyMount} from './mount.js';",
    ...[...declarations].map(node => renderImport(node, moved, code, file)),
    ...Array.from(
      standalone,
      ([name, mount]) => `export const ${mount} = createLegacyMount(${name});`,
    ),
    ...islands.map(
      ({jsx}, index) =>
        `export const ${familyMounts[index]} = createLegacyMount(props => (${jsx}));`,
    ),
  ].join('\n');
  const hostImports = [
    `import {createSolid1Bridge, readIslandValue, readWidgetProps} from '${runtimeId}';`,
    `import {${exported.join(', ')}} from '${componentsId}';`,
    `import '${stylesId}';`,
    ...Array.from(standalone, ([name, mount]) => {
      const component = imports.get(name);
      const passesDom =
        component &&
        modules.get(component.source)?.domProps?.includes(component.imported);
      return `const ${name} = createSolid1Bridge(${mount}${passesDom ? ', readWidgetProps' : ''});`;
    }),
    ...familyMounts.map(
      (mount, index) =>
        `const BridgedFamily${index} = createSolid1Bridge(${mount}, props => ({values: props.values}));`,
    ),
  ].join('\n');
  const edits = [
    ...ranges,
    ...[...declarations].map(node => ({
      ...span(node),
      replacement: renderImport(
        node,
        new Set(
          node.specifiers
            .map(s => s.local.name)
            .filter(name => !moved.has(name)),
        ),
        code,
      ),
    })),
  ];
  return {
    host: hostImports + '\n' + replaceRanges(code, edits),
    legacy,
    exported,
  };
}
