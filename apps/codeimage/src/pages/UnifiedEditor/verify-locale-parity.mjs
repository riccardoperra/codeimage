// node apps/codeimage/src/pages/UnifiedEditor/verify-locale-parity.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const modules = new Map();
function readModule(path) {
  if (modules.has(path)) return modules.get(path);
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const bindings = new Map();
  modules.set(path, bindings);
  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      const imported = readModule(
        fileURLToPath(
          new URL(`${statement.moduleSpecifier.text}.ts`, `file://${path}`),
        ),
      );
      for (const entry of statement.importClause?.namedBindings?.elements ??
        []) {
        bindings.set(entry.name.text, () =>
          imported.get(entry.propertyName?.text ?? entry.name.text)(),
        );
      }
      if (statement.importClause?.name)
        bindings.set(statement.importClause.name.text, () =>
          imported.get('default')(),
        );
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations)
        bindings.set(declaration.name.text, () =>
          evaluate(declaration.initializer, bindings),
        );
    }
    if (ts.isExportAssignment(statement))
      bindings.set('default', () => evaluate(statement.expression, bindings));
  }
  return bindings;
}
function evaluate(node, bindings) {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    return evaluate(node.expression, bindings);
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map(entry => evaluate(entry, bindings));
  if (ts.isIdentifier(node)) return bindings.get(node.text)();
  if (ts.isPropertyAccessExpression(node))
    return evaluate(node.expression, bindings)[node.name.text];
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const entry of node.properties) {
      if (ts.isSpreadAssignment(entry))
        Object.assign(value, evaluate(entry.expression, bindings));
      else if (ts.isShorthandPropertyAssignment(entry))
        value[entry.name.text] = bindings.get(entry.name.text)();
      else value[entry.name.text] = evaluate(entry.initializer, bindings);
    }
    return value;
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  // Interpolated limit messages are strings too; their runtime values do not affect key parity.
  if (ts.isTemplateExpression(node)) return node.getText();
  throw new Error(`Unsupported locale value: ${node.getText()}`);
}
export function flatten(value, prefix = '') {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof entry === 'string'
        ? [[path, entry]]
        : Object.entries(flatten(entry, path));
    }),
  );
}
export function assertLocaleParity(dictionaries) {
  const entries = Object.entries(dictionaries).map(([name, messages]) => [
    name,
    flatten(messages),
  ]);
  const union = [
    ...new Set(entries.flatMap(([, messages]) => Object.keys(messages))),
  ].sort();
  for (const [name, messages] of entries)
    assert.deepEqual(
      union.filter(key => !(key in messages)),
      [],
      `${name}: missing or extra locale keys`,
    );
  for (const [name, messages] of entries)
    for (const [key, value] of Object.entries(messages))
      assert(value.trim(), `${name}: empty translation at ${key}`);
  for (const key of union) {
    const placeholders = value =>
      [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(match => match[1]).sort();
    for (const [name, messages] of entries)
      assert.deepEqual(
        placeholders(messages[key]),
        placeholders(entries[0][1][key]),
        `${name}: inconsistent placeholders at ${key}`,
      );
  }
  return union.length;
}
const locale = readModule(
  fileURLToPath(new URL('../../i18n/index.ts', import.meta.url)),
).get('locale')();
const supported = readModule(
  fileURLToPath(
    new URL(
      '../../../../../packages/config/src/lib/base/locales.ts',
      import.meta.url,
    ),
  ),
).get('SUPPORTED_LOCALES')();
assert.deepEqual(
  Object.keys(locale).sort(),
  [...supported].sort(),
  'Every shipped locale has a dictionary',
);
const count = assertLocaleParity(locale);
// Prove the check rejects a missing key instead of accepting the current shape by accident.
assert.throws(
  () => assertLocaleParity({en: {a: 'A'}, it: {}}),
  /missing or extra/,
);
console.log(
  `PASS: ${count} keys and matching placeholders in ${Object.keys(locale).join(', ')}; missing-key negative control passed.`,
);
export {locale as dictionaries};

const invariantNames = new Set([
  'A',
  'a',
  'x',
  'Aa',
  'CodeImage',
  'GitHub',
  'X',
  'Bluesky',
  'Mastodon',
  'LinkedIn',
  'PNG',
  'SVG',
  'JPEG',
  'Better Comments for GitHub',
  'Local Font Access API',
]);
function hardcodedMessages(source) {
  const found = [];
  const record = node => {
    const value = node.text.trim();
    if (/^[\w-]+(?:\.[\w-]+)+$/.test(value))
      assert(
        value in flatten(locale.en),
        `${source.fileName}: unknown locale key ${value}`,
      );
    if (
      /[a-z]/i.test(value) &&
      !invariantNames.has(value) &&
      !/^[\w-]+(?:\.[\w-]+)+$/.test(value)
    )
      found.push(value);
  };
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['t', 'tUnsafe'].includes(node.expression.text) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      assert(
        node.arguments[0].text in flatten(locale.en),
        `${source.fileName}: unknown locale key ${node.arguments[0].text}`,
      );
    }

    if (ts.isJsxText(node)) record(node);
    if (
      ts.isJsxAttribute(node) &&
      ['aria-label', 'placeholder', 'title', 'label'].includes(node.name.text)
    ) {
      const value = node.initializer;
      if (value && ts.isStringLiteral(value)) record(value);
      if (
        value &&
        ts.isJsxExpression(value) &&
        value.expression &&
        ts.isStringLiteral(value.expression)
      )
        record(value.expression);
    }
    if (
      ts.isPropertyAssignment(node) &&
      ['name', 'label', 'title', 'description', 'hint'].includes(node.name.text)
    ) {
      const value = node.initializer;
      if (ts.isStringLiteral(value)) record(value);
      if (ts.isArrowFunction(value) && ts.isStringLiteral(value.body))
        record(value.body);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}
const {readdirSync} = await import('node:fs');
const editorDirectory = fileURLToPath(new URL('./', import.meta.url));
for (const directory of [
  editorDirectory,
  fileURLToPath(new URL('../../components/Animation/', import.meta.url)),
])
  for (const entry of readdirSync(directory, {recursive: true})) {
    if (!/\.tsx?$/.test(entry) || entry.endsWith('.css.ts')) continue;
    const path = `${directory}/${entry}`;
    const contents = readFileSync(path, 'utf8');
    assert(!contents.includes('// i18n'), `${entry}: unresolved i18n marker`);
    assert.deepEqual(
      hardcodedMessages(
        ts.createSourceFile(
          path,
          contents,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        ),
      ),
      [],
      `${entry}: hard-coded user-facing messages`,
    );
  }
assert.deepEqual(
  hardcodedMessages(
    ts.createSourceFile(
      'negative.tsx',
      '<button aria-label="Settings">Settings</button>',
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
  ),
  ['Settings', 'Settings'],
);
console.log(
  'PASS: unified editor text, labels, hints and accessible names use locale keys; hard-coded-message negative control passed.',
);
