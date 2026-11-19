import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const checks = [
  {
    name: 'verification script outside the verify-codeimage skill',
    matches: file =>
      /(^|\/)(verify|capture)[^/]*\.(mjs|cjs|js|ts|tsx)$/.test(file) &&
      !file.startsWith('.agents/skills/verify-codeimage/'),
    fix: 'Add the check as a case in .agents/skills/verify-codeimage/scripts/audit.mjs and describe it in the matching page under .agents/skills/verify-codeimage/features/.',
    recorded: [
      'apps/api/scripts/verify-architecture.ts',
      'apps/codeimage/src/pages/UnifiedEditor/verify-i18n.mjs',
      'apps/codeimage/src/pages/UnifiedEditor/verify-locale-parity.mjs',
      'apps/codeimage/src/pages/UnifiedEditor/verify-review.mjs',
      'scripts/verify-p5-exports.cjs',
      'scripts/verify-p5-focus.cjs',
      'scripts/verify-p5-gutter.cjs',
      'scripts/verify-p5-import-undo.cjs',
      'scripts/verify-p5-layout.cjs',
    ],
  },
  {
    name: 'plain stylesheet in the app or the UI kit',
    matches: file =>
      /^(apps\/codeimage|packages\/ui)\/.*\.(css|scss|sass|less)$/.test(file),
    fix: 'Write the styles in a vanilla-extract .css.ts file beside the component, with tokens from @codeimage/ui.',
    recorded: [
      'apps/codeimage/src/assets/styles/_reset.scss',
      'apps/codeimage/src/assets/styles/app.scss',
      'apps/codeimage/src/components/CustomEditor/plugins/lineMarks/gutter.css',
      'apps/codeimage/src/components/CustomEditor/plugins/lineMarks/marks.css',
      'packages/ui/dev/reset.scss',
    ],
  },
  {
    name: 'backup or leftover file',
    matches: file => /\.(bak|orig|rej|tmp)$|(^|\/)\.DS_Store$/.test(file),
    fix: 'Delete it. Scratch files stay outside the checkout.',
    recorded: [],
  },
];

const listed = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  {cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
);
if (listed.status !== 0) {
  console.error(listed.stderr);
  process.exit(2);
}

let failures = 0;
for (const file of listed.stdout.split('\n').filter(Boolean)) {
  for (const check of checks) {
    if (!check.matches(file) || check.recorded.includes(file)) continue;
    failures += 1;
    console.error(`${file}\n  ${check.name}. ${check.fix}\n`);
  }
}

if (failures > 0) {
  console.error(
    `${failures} ${failures === 1 ? 'file breaks' : 'files break'} the repository structure rules in scripts/check-structure.mjs.`,
  );
  process.exit(1);
}

console.log('Structure passed.');
