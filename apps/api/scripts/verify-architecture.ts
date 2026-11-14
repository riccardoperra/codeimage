import {spawnSync} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
interface Violation {
  rule: string;
  path: string;
  change: (source: string) => string;
}
const append = (code: string) => (source: string) => `${source}\n${code}\n`;
const cases: Violation[] = [
  {
    rule: 'module internals are private',
    path: 'src/plugins/cors.ts',
    change: append(
      "import type {Preset} from '../modules/preset/preset.model.js';",
    ),
  },
  {
    rule: 'the domain is framework-free',
    path: 'src/modules/preset/preset.model.ts',
    change: append("import type {FastifyInstance} from 'fastify';"),
  },
  ...['commands/create-preset.ts', 'queries/get-preset.ts'].flatMap(path => [
    {
      rule: 'the domain is framework-free',
      path: `src/modules/preset/${path}`,
      change: append("import type {PrismaClient} from '@prisma/client';"),
    },
    {
      rule: 'the domain is framework-free',
      path: `src/modules/preset/${path}`,
      change: append("import appApi from '../../../http/app-api.js';"),
    },
  ]),
  {
    rule: 'routes dispatch use cases',
    path: 'src/modules/preset/routes/create.ts',
    change: append(
      "import {createPresetRepository} from '../preset.repository.js';",
    ),
  },
  ...[
    'fastify.db',
    "fastify['db']",
    'const {db} = fastify',
    "const {'db': database} = fastify",
  ].map(code => ({
    rule: 'the db decorator stays in composition',
    path: 'src/modules/preset/routes/create.ts',
    change: append(`${code};`),
  })),
  {
    rule: 'contracts stay a small, framework-free type closure',
    path: 'src/modules/preset/preset.contract.ts',
    change: append("import type {FastifyInstance} from 'fastify';"),
  },
  {
    rule: 'shared is mechanism only',
    path: 'src/shared/principal.ts',
    change: append(
      "import type {presetContract} from '../modules/preset/preset.contract.js';",
    ),
  },
  {
    rule: 'only repositories touch Prisma',
    path: 'src/plugins/cors.ts',
    change: append(
      "import type {PrismaClient} from '@codeimage/prisma-models';",
    ),
  },
  ...[
    "import sensible from '@fastify/sensible';",
    'fastify.httpErrors.notFound();',
    "new AppError({code: 'BAD', kind: 'invalid', message: 'bad'});",
  ].map(code => ({
    rule: 'one error model',
    path: 'src/plugins/cors.ts',
    change: append(code),
  })),
  {
    rule: 'user ids are minted from rows',
    path: 'src/modules/preset/preset.model.ts',
    change: append("asUserId('untrusted');"),
  },
  {
    rule: 'one module layout',
    path: 'src/modules/preset/utils.ts',
    change: append('export {};'),
  },
  {
    rule: 'module directories contain only allowed entries',
    path: 'src/modules/preset/utils.js',
    change: append('export {};'),
  },
  {
    rule: 'every module folder is registered in app.ts',
    path: 'src/app.ts',
    change: source => source.replace('await fastify.register(identity);', ''),
  },
  {
    rule: 'every module contract feeds api-types.ts',
    path: 'src/api-types.ts',
    change: source =>
      source.replace(/import type \{presetContract\} from '[^']+';/, ''),
  },
  {
    rule: 'every module routes directory is autoloaded in http/app-api.ts',
    path: 'src/http/app-api.ts',
    change: source => source.replace("['preset', 'project']", "['project']"),
  },
  {
    rule: 'each endpoint file registers exactly one contract operation',
    path: 'src/modules/preset/routes/create.ts',
    change: source =>
      source.replace(
        '  fastify.route({',
        '  fastify.route({...op.list, handler: async () => []});\n  fastify.route({',
      ),
  },
  {
    rule: 'each contract operation has exactly one endpoint file',
    path: 'src/modules/preset/routes/extra.ts',
    change: append('export {};'),
  },
  {
    rule: 'each contract operation has exactly one endpoint file',
    path: 'src/modules/preset/preset.contract.ts',
    change: source => source.replace('  create: {', '  missing: {'),
  },
];

for (const violation of cases) {
  const file = resolve(root, violation.path);
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null;
  const after = violation.change(before ?? '');
  if (after === before)
    throw new Error(`Mutation did not apply: ${violation.rule}`);
  mkdirSync(dirname(file), {recursive: true});
  try {
    writeFileSync(file, after);
    const pattern = violation.rule.replaceAll('.', '\\.');
    const run = spawnSync(
      'pnpm',
      ['exec', 'vitest', 'run', 'test/architecture.test.ts', '-t', pattern],
      {
        cwd: root,
        encoding: 'utf8',
        env: {...process.env, RUN_TEST: 'unit'},
      },
    );
    const output = `${run.stdout}\n${run.stderr}`;
    if (
      run.status !== 1 ||
      !output.includes(`FAIL  test/architecture.test.ts > `) ||
      !output.includes(violation.rule)
    ) {
      throw new Error(
        `${violation.rule} did not reject ${violation.path}\n${output}`,
      );
    }
    console.log(`Rejected ${violation.path}: ${violation.rule}`);
  } finally {
    if (before === null) rmSync(file);
    else writeFileSync(file, before);
  }
}
console.log(`${cases.length} injected violations rejected; all files restored`);
