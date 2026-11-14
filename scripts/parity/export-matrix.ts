import assert from 'node:assert/strict';
import {spawn, execFileSync, type ChildProcess} from 'node:child_process';
import {
  cp,
  mkdir,
  readdir,
  realpath,
  symlink,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium} from 'playwright';
import {
  openEditor,
  selectTheme,
  exportPng,
  diffPng,
  PIXELMATCH_THRESHOLD,
  MAX_DIFF_PERCENT,
} from './lib';

const {values} = parseArgs({
  options: {
    base: {type: 'string', default: 'main'},
    head: {type: 'string', default: 'HEAD'},
    'base-url': {type: 'string'},
    'head-url': {type: 'string'},
    out: {type: 'string', default: '/tmp/swarm-p1/matrix'},
    theme: {type: 'string'},
  },
});
const root = resolve(__dirname, '../..');
// Line numbers start at 42 so CodeMirror's gutter widens to three digits for an 11-line snippet.
const snippet = `// keywords, strings, numbers, regex, ligatures
import {readFile} from 'node:fs/promises';

export async function load<T extends object>(path: string): Promise<T | null> {
\tconst raw = await readFile(path, 'utf8'); // tab-indented
\tif (raw.length === 0 || raw !== raw.trim()) return null;
\tconst pattern = /^[a-z]+\\d{2,}$/gi;
\treturn JSON.parse(raw) as T; /* 42, 0xff, 1e3, true */
}

const greeting = \`héllo \${'wörld'} 你好 👋\`;`;
const servers: ChildProcess[] = [];
const out = resolve(values.out);

async function server(ref: string, port: number) {
  const scratch = join(tmpdir(), `codeimage-parity-${process.pid}-${port}`);
  await mkdir(scratch, {recursive: true});
  const dir = await realpath(scratch);
  const archive = execFileSync('git', ['archive', ref], {
    cwd: root,
    maxBuffer: 100 * 1024 * 1024,
  });
  execFileSync('tar', ['-x', '-C', dir], {input: archive});
  // P1 changes only app sources. Both refs use the same installed libraries.
  for (const parent of ['', 'apps', 'packages']) {
    const children = parent
      ? (await readdir(join(root, parent))).map(name => join(parent, name))
      : [''];
    for (const child of children) {
      for (const name of ['node_modules', 'dist']) {
        const source = join(root, child, name);
        try {
          if (name === 'node_modules' && child === 'apps/codeimage') {
            const dest = join(dir, child, name);
            await mkdir(dest, {recursive: true});
            for (const entry of await readdir(source)) {
              if (entry !== '.vite')
                await symlink(join(source, entry), join(dest, entry));
            }
          } else await symlink(source, join(dir, child, name));
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !('code' in error) ||
            !['ENOENT', 'EEXIST'].includes(String(error.code))
          )
            throw error;
        }
      }
    }
  }
  await cp(
    join(root, 'apps/codeimage/.env.local'),
    join(dir, 'apps/codeimage/.env.local'),
  );
  await cp(
    join(root, 'apps/codeimage/node_modules/msw/lib/mockServiceWorker.js'),
    join(dir, 'apps/codeimage/public/mockServiceWorker.js'),
  );
  const child = spawn(
    'pnpm',
    [
      'exec',
      'vite',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {cwd: join(dir, 'apps/codeimage'), stdio: 'ignore'},
  );
  servers.push(child);
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(url)).ok) return url;
    } catch {}
    if (child.exitCode !== null) throw new Error(`Vite exited for ${ref}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Vite did not start for ${ref}`);
}

async function main() {
  await mkdir(out, {recursive: true});
  const baseUrl = values['base-url'] ?? (await server(values.base, 4412));
  const headUrl = values['head-url'] ?? (await server(values.head, 4401));
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  try {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
    });
    const base = await context.newPage();
    const head = await context.newPage();
    await openEditor(base, baseUrl);
    await openEditor(head, headUrl);
    for (const page of [base, head]) {
      await page.locator('.cm-content[contenteditable="true"]').fill(snippet);
      await page
        .locator('label[for="frameLineNumbersField"]')
        .locator('..')
        .getByText('Show', {exact: true})
        .click();
      await page.locator('#frameLineNumberStartField-input').fill('42');
      await page.locator('#frameLineNumberStartField-input').press('Tab');
    }
    await base.locator('button[aria-label="Syntax highlight"]').click();
    const themes = await base.getByRole('option').allTextContents();
    await base.keyboard.press('Escape');
    const terminals = [
      'windows',
      'macOs',
      'macOsGrayTheme',
      'macOsOutlineTheme',
    ];
    const rows: {
      theme: string;
      terminal: string;
      lineNumbers: boolean;
      diffPercent: number;
    }[] = [];
    for (const theme of themes.filter(
      theme => !values.theme || theme === values.theme,
    )) {
      for (const [page, url] of [
        [base, baseUrl],
        [head, headUrl],
      ] as const) {
        await openEditor(page, url);
        await selectTheme(page, theme);
      }
      for (const terminal of terminals) {
        for (const page of [base, head]) {
          await page
            .locator('label[for="frameTerminalTypeField"]')
            .locator('..')
            .locator('[aria-haspopup]')
            .click();
          await page
            .locator('[class*="RadioBlock_radioBlock"]')
            .nth(terminals.indexOf(terminal))
            .click();
          await page.keyboard.press('Escape');
        }
        for (const lineNumbers of [false, true]) {
          for (const page of [base, head]) {
            await page
              .locator('label[for="frameLineNumbersField"]')
              .locator('..')
              .getByText(lineNumbers ? 'Show' : 'Hide', {exact: true})
              .click();
          }
          const slug = `${theme.replace(/[^a-z0-9]/gi, '-')}-${terminal}-${lineNumbers ? 'numbers' : 'plain'}`;
          const basePath = join(out, `${slug}-base.png`);
          const headPath = join(out, `${slug}-head.png`);
          await exportPng(base, basePath);
          await exportPng(head, headPath);
          const diffPercent = await diffPng(
            basePath,
            headPath,
            join(out, `${slug}-diff.png`),
          );
          rows.push({theme, terminal, lineNumbers, diffPercent});
          console.log(`${slug}\t${diffPercent.toFixed(4)}%`);
        }
      }
    }
    await writeFile(
      join(out, 'results.json'),
      JSON.stringify(
        {
          base: values.base,
          head: values.head,
          threshold: PIXELMATCH_THRESHOLD,
          maxDiffPercent: MAX_DIFF_PERCENT,
          rows,
        },
        null,
        2,
      ),
    );
    await writeFile(
      join(out, 'results.md'),
      '| Theme | Terminal | Line numbers | Diff % |\n| --- | --- | --- | --- |\n' +
        rows
          .map(
            row =>
              `| ${row.theme} | ${row.terminal} | ${row.lineNumbers} | ${row.diffPercent.toFixed(4)} |`,
          )
          .join('\n') +
        '\n',
    );
    assert.ok(rows.length > 0, 'matrix must contain images');
    assert.ok(
      rows.every(row => row.diffPercent <= MAX_DIFF_PERCENT),
      'pixel parity exceeds 0.5%',
    );
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === __filename) {
  main()
    .finally(() => {
      for (const server of servers) server.kill();
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
