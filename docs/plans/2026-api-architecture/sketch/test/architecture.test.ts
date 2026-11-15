/**
 * Boundary enforcement. Runs in `test:unit` (so in CI's existing be-test job), needs no new dependency,
 * and reads source with TypeScript's own parser, not regexes over text. It never imports src/, so it
 * runs without a database, config or any implemented body.
 *
 * Each rule carries the lesson it encodes. When it fails, the message tells the contributor (or agent)
 * what to do instead, so "the shortest path that compiles" and "the right path" stay the same path.
 *
 * Role patterns accept a split suffix (`preset.service.limits.ts` is a service file), so splitting a large
 * file never moves it out from under its rules.
 *
 * Shrinking allowlist: during the migration `legacy` lists the not-yet-migrated folders. The last
 * migration step deletes it; adding to it is a review red flag.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import ts from 'typescript';
import {describe, expect, test} from 'vitest';

const SRC = resolve(import.meta.dirname, '../src');
const legacy: readonly string[] = [];

interface SourceFile {
  /** Posix path relative to src, e.g. 'modules/preset/preset.routes.ts'. */
  readonly path: string;
  readonly ast: ts.SourceFile;
  /** Emitted JavaScript without comments: text rules look at code, not at doc comments that name the rule. */
  readonly code: string;
  /** Raw specifiers plus, for relative ones, the resolved src-relative target ('.js' to '.ts'). */
  readonly imports: readonly {specifier: string; target: string | null}[];
}

function loadSources(): SourceFile[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap(name => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
    });
  return walk(SRC).map(full => {
    const text = readFileSync(full, 'utf8');
    const imports = ts.preProcessFile(text, true, true).importedFiles.map(({fileName}) => ({
      specifier: fileName,
      target: fileName.startsWith('.')
        ? relative(SRC, resolve(dirname(full), fileName)).replace(/\.js$/, '.ts')
        : null,
    }));
    const code = ts.transpileModule(text, {
      compilerOptions: {removeComments: true, target: ts.ScriptTarget.ESNext},
    }).outputText;
    const ast = ts.createSourceFile(full, text, ts.ScriptTarget.ESNext, true);
    return {path: relative(SRC, full), ast, code, imports};
  });
}

/** 'modules/preset/preset.routes.ts' gives 'preset'; anything outside modules gives null. */
const moduleOf = (path: string) => /^modules\/([^/]+)\//.exec(path)?.[1] ?? null;
const isPublicEntry = (target: string) =>
  /^modules\/([^/]+)\/(index|\1\.contract)\.ts$/.test(target);
const role = (name: string) => new RegExp(`\\.${name}(\\.[a-z][a-z-]*)?\\.ts$`);

interface Rule {
  readonly name: string;
  /** The lesson, shown on failure. */
  readonly why: string;
  readonly violations: (file: SourceFile) => string[];
}

const importsOf = (file: SourceFile, pattern: RegExp) =>
  file.imports.filter(i => pattern.test(i.target ?? i.specifier)).map(i => i.specifier);

/** Every read of a `db` member: `x.db`, `x['db']`, and destructuring such as `const {db} = fastify`. */
function dbAccesses(ast: ts.SourceFile): string[] {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    const line = () => `line ${ast.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'db') {
      found.push(`${line()}: ${node.getText()}`);
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === 'db'
    ) {
      found.push(`${line()}: ${node.getText()}`);
    } else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
      const key = node.propertyName ?? node.name;
      if ((ts.isIdentifier(key) || ts.isStringLiteralLike(key)) && key.text === 'db') {
        found.push(`${line()}: {${node.getText()}} destructuring`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return found;
}

const rules: readonly Rule[] = [
  {
    name: 'module internals are private',
    why: 'Reach another module through its index.ts (fastify.<module>, its routes plugin, exported types) or its *.contract.ts. Everything else in a module folder is private.',
    violations: file =>
      file.imports
        .filter(i => i.target && moduleOf(i.target) && moduleOf(i.target) !== moduleOf(file.path))
        .filter(i => !isPublicEntry(i.target ?? ''))
        .map(i => i.specifier),
  },
  {
    name: 'the domain is framework-free',
    why: 'Models and services take an Actor and domain types, never a request, a Fastify instance or a Prisma type. Do the HTTP part in *.routes.ts and the database part in *.repository.ts.',
    violations: file =>
      role('model').test(file.path) || role('service').test(file.path)
        ? importsOf(
            file,
            /^fastify|^@fastify\/|^@codeimage\/prisma-models|^@prisma\/|^plugins\/|^http\/|^shared\/(http|db)\.ts$/,
          )
        : [],
  },
  {
    name: 'routes call services',
    why: 'A route calls fastify.<module>.<useCase>(actorOf(request), ...). Data access belongs in the repository, behind the service.',
    violations: file => (role('routes').test(file.path) ? importsOf(file, role('repository')) : []),
  },
  {
    name: 'the db decorator stays in composition',
    why: 'Only module index.ts files pass fastify.db to a repository factory. A route or service holding the db can write without an owner scope.',
    violations: file =>
      /^modules\/[^/]+\/index\.ts$|^plugins\//.test(file.path) ? [] : dbAccesses(file.ast),
  },
  {
    name: 'contracts stay a small, framework-free type closure',
    why: 'apps/codeimage compiles every file api-types.ts reaches. Contracts import only @sinclair/typebox, other contracts and shared/contract.ts.',
    violations: file =>
      role('contract').test(file.path) || /^(shared\/contract|api-types)\.ts$/.test(file.path)
        ? file.imports
            .filter(
              i =>
                !/^@sinclair\/typebox(\/|$)/.test(i.specifier) &&
                !(role('contract').test(i.target ?? '') || i.target === 'shared/contract.ts'),
            )
            .map(i => i.specifier)
        : [],
  },
  {
    name: 'shared is mechanism only',
    why: 'shared/ must not know any module or the HTTP API. Move the code into the module that owns the concept.',
    violations: file =>
      file.path.startsWith('shared/') ? importsOf(file, /^(modules|http)\//) : [],
  },
  {
    name: 'only repositories touch Prisma',
    why: 'The Prisma client stays in *.repository.ts, plugins/db.ts and shared/db.ts. Add a repository method that returns a domain type.',
    violations: file =>
      role('repository').test(file.path) || /^(plugins|shared)\/db\.ts$/.test(file.path)
        ? []
        : importsOf(file, /^@codeimage\/prisma-models|^@prisma\//),
  },
  {
    name: 'one error model',
    why: 'Throw a factory from a defineErrors catalog (<module>.model.ts or CommonErrors). Never an HTTP error, never `new AppError`.',
    violations: file => [
      ...importsOf(file, /^@fastify\/sensible/),
      ...(/\.httpErrors\b/.test(file.code) ? ['.httpErrors'] : []),
      ...(file.path !== 'shared/errors.ts' && /new AppError\(/.test(file.code) ? ['new AppError('] : []),
    ],
  },
  {
    name: 'user ids are minted from rows',
    why: 'A UserId comes from an authenticated Actor or a database row. Take actor.userId instead of branding a string.',
    violations: file =>
      role('repository').test(file.path) || file.path === 'shared/principal.ts' || !/\basUserId\(/.test(file.code)
        ? []
        : ['asUserId('],
  },
  {
    name: 'one module layout',
    why: 'A module folder holds index.ts and <name>.<role>.ts with role in contract | model | service | repository | routes. A logic file past ~300 lines splits into <name>.<role>.<part>.ts.',
    violations: file => {
      const name = moduleOf(file.path);
      if (!name) return [];
      const ok = new RegExp(
        `^modules/${name}/(index|${name}\\.(contract|model|service|repository|routes)(\\.[a-z][a-z-]*)?)\\.ts$`,
      );
      return ok.test(file.path) ? [] : [file.path];
    },
  },
];

const sources = loadSources().filter(f => !legacy.some(prefix => f.path.startsWith(prefix)));
const fileAt = (path: string) => {
  const file = sources.find(f => f.path === path);
  if (!file) throw new Error(`src/${path} is missing`);
  return file;
};

const moduleFolders = readdirSync(join(SRC, 'modules')).filter(
  name =>
    statSync(join(SRC, 'modules', name)).isDirectory() &&
    !legacy.some(prefix => `modules/${name}/`.startsWith(prefix)),
);
const hasRole = (name: string, r: string) =>
  existsSync(join(SRC, 'modules', name, `${name}.${r}.ts`));

/**
 * Modules whose `exportName` (imported from their index.ts) is passed as the first argument of a
 * `.register(...)` call in `file`. 'default' means the default import.
 */
function registeredModules(file: SourceFile, exportName: (module: string) => string): string[] {
  const bindings = new Map<string, string>();
  for (const statement of file.ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const target = relative(SRC, resolve(SRC, dirname(file.path), statement.moduleSpecifier.text));
    const module = /^modules\/([^/]+)\/index\.js$/.exec(target)?.[1];
    const clause = statement.importClause;
    if (!module || !clause) continue;
    const wanted = exportName(module);
    if (wanted === 'default' && clause.name) bindings.set(clause.name.text, module);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        if ((element.propertyName ?? element.name).text === wanted) {
          bindings.set(element.name.text, module);
        }
      }
    }
  }
  const registered = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'register'
    ) {
      const [first] = node.arguments;
      const module = first && ts.isIdentifier(first) ? bindings.get(first.text) : undefined;
      if (module) registered.add(module);
    }
    ts.forEachChild(node, visit);
  };
  visit(file.ast);
  return [...registered];
}

describe('architecture', () => {
  test.each(rules)('$name', rule => {
    const found = sources.flatMap(file => rule.violations(file).map(v => `${file.path}: ${v}`));
    expect(found, rule.why).toEqual([]);
  });

  // The three remaining hand-written lists. These checks are what make them safe to keep by hand.

  test('every module folder is registered in app.ts', () => {
    const registered = registeredModules(fileAt('app.ts'), () => 'default');
    const missing = moduleFolders.filter(name => !registered.includes(name));
    expect(
      missing,
      'Import the module in src/app.ts and add `await fastify.register(<module>)` in dependency order.',
    ).toEqual([]);
  });

  test('every module contract feeds api-types.ts', () => {
    const apiTypes = fileAt('api-types.ts');
    const missing = moduleFolders
      .filter(name => hasRole(name, 'contract'))
      .filter(name => !apiTypes.imports.some(i => i.target === `modules/${name}/${name}.contract.ts`));
    expect(
      missing,
      'Add `export type <Name>Api = ApiTypesOf<typeof <name>Contract>` to src/api-types.ts.',
    ).toEqual([]);
  });

  test('every module routes file is registered in http/app-api.ts', () => {
    const registered = registeredModules(fileAt('http/app-api.ts'), name => `${name}Routes`);
    const missing = moduleFolders
      .filter(name => hasRole(name, 'routes'))
      .filter(name => !registered.includes(name));
    expect(
      missing,
      "Export `<name>Routes` from the module's index.ts and add `await api.register(<name>Routes, {prefix: '/<name>'})` in src/http/app-api.ts.",
    ).toEqual([]);
  });
});
