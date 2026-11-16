import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = join(root, 'lint-baseline.json');
const mode = process.argv[2] ?? '--check';
const SIZE_RULES = new Set(['eslint(max-lines)']);
const UNUSED_DIRECTIVE = 'unused-disable-directive';

if (!['--check', '--tighten', '--accept'].includes(mode)) {
  console.error('Usage: node scripts/lint.mjs [--check|--tighten|--accept]');
  process.exit(2);
}

function runOxlint() {
  const result = spawnSync(
    join(root, 'node_modules', '.bin', 'oxlint'),
    ['--report-unused-disable-directives', '--format=json'],
    {cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024},
  );
  try {
    return JSON.parse(result.stdout).diagnostics;
  } catch {
    console.error(result.stdout || result.stderr || result.error);
    process.exit(2);
  }
}

function measure(diagnostic) {
  const size = /\((\d+)\)/.exec(diagnostic.message);
  return size ? Number(size[1]) : 1;
}

function collect(diagnostics) {
  const found = new Map();
  for (const diagnostic of diagnostics) {
    const rule = diagnostic.code ?? UNUSED_DIRECTIVE;
    const key = `${diagnostic.filename}\n${rule}`;
    const entry = found.get(key) ?? {
      file: diagnostic.filename,
      rule,
      amount: 0,
      diagnostics: [],
    };
    entry.amount = SIZE_RULES.has(rule)
      ? measure(diagnostic)
      : entry.amount + 1;
    entry.diagnostics.push(diagnostic);
    found.set(key, entry);
  }
  return found;
}

function readBaseline() {
  try {
    return JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeBaseline(baseline) {
  const sorted = {};
  for (const file of Object.keys(baseline).sort()) {
    const rules = {};
    for (const rule of Object.keys(baseline[file]).sort()) {
      if (baseline[file][rule] > 0) rules[rule] = baseline[file][rule];
    }
    if (Object.keys(rules).length > 0) sorted[file] = rules;
  }
  writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
}

function describe(entry, allowed) {
  if (SIZE_RULES.has(entry.rule)) {
    return allowed
      ? `${entry.amount} lines, ${allowed} recorded: move code out before adding more`
      : `${entry.amount} lines`;
  }
  return allowed
    ? `${entry.amount} found, ${allowed} recorded`
    : `${entry.amount} found`;
}

function git(args) {
  const result = spawnSync('git', args, {cwd: root, encoding: 'utf8'});
  return result.status === 0 ? result.stdout : '';
}

function changedLines(file) {
  const base = git(['merge-base', 'HEAD', 'origin/main']).trim() || 'HEAD';
  const lines = new Set();
  const hunks = git(['diff', '-U0', base, '--', file]).matchAll(
    /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm,
  );
  for (const [, start, length = '1'] of hunks) {
    for (let line = 0; line < Number(length); line += 1) {
      lines.add(Number(start) + line);
    }
  }
  return lines;
}

function print(entry, allowed) {
  console.error(
    `\n${entry.file}  ${entry.rule}  (${describe(entry, allowed)})`,
  );
  const changed = allowed > 0 ? changedLines(entry.file) : new Set();
  const onChangedLines = entry.diagnostics.filter(diagnostic =>
    changed.has(diagnostic.labels?.[0]?.span?.line),
  );
  const shown = onChangedLines.length > 0 ? onChangedLines : entry.diagnostics;
  for (const diagnostic of shown) {
    const span = diagnostic.labels?.[0]?.span;
    const position = span ? `${span.line}:${span.column}` : '';
    const help = diagnostic.help ? ` ${diagnostic.help}` : '';
    console.error(`  ${position}  ${diagnostic.message}${help}`);
  }
}

const found = collect(runOxlint());
const baseline = readBaseline();

if (mode === '--accept') {
  const accepted = {};
  for (const entry of found.values()) {
    (accepted[entry.file] ??= {})[entry.rule] = entry.amount;
  }
  writeBaseline(accepted);
  console.log(`Recorded ${found.size} entries in lint-baseline.json.`);
  process.exit(0);
}

if (mode === '--tighten') {
  let lowered = 0;
  for (const [file, rules] of Object.entries(baseline)) {
    for (const rule of Object.keys(rules)) {
      const amount = found.get(`${file}\n${rule}`)?.amount ?? 0;
      if (amount < rules[rule]) {
        rules[rule] = amount;
        lowered += 1;
      }
    }
  }
  writeBaseline(baseline);
  console.log(`Lowered ${lowered} entries in lint-baseline.json.`);
  process.exit(0);
}

const scope = relative(root, process.cwd()).split(sep).join('/');
const inScope = file => scope === '' || file.startsWith(`${scope}/`);

let failures = 0;
for (const entry of found.values()) {
  if (!inScope(entry.file)) continue;
  const allowed = baseline[entry.file]?.[entry.rule] ?? 0;
  if (entry.amount > allowed) {
    failures += 1;
    print(entry, allowed);
  }
}

let stale = 0;
for (const [file, rules] of Object.entries(baseline)) {
  if (!inScope(file)) continue;
  for (const [rule, allowed] of Object.entries(rules)) {
    if ((found.get(`${file}\n${rule}`)?.amount ?? 0) < allowed) stale += 1;
  }
}

if (failures > 0) {
  console.error(
    `\n${failures} lint ${failures === 1 ? 'entry exceeds' : 'entries exceed'} lint-baseline.json. Fix the code. The baseline only records debt that existed before a rule was added; AGENTS.md says how to request an exception.`,
  );
  process.exit(1);
}

console.log(
  stale > 0
    ? `Lint passed. ${stale} baseline entries can be lowered: run pnpm lint:tighten.`
    : 'Lint passed.',
);
