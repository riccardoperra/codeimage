import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chromium, type Browser, type Page} from 'playwright';
import {diffPng, MAX_DIFF_PERCENT, openEditor, selectTheme} from './lib';

const {values} = parseArgs({
  options: {
    'base-url': {type: 'string', default: 'http://127.0.0.1:4412'},
    'head-url': {type: 'string', default: 'http://127.0.0.1:4401'},
    out: {type: 'string', default: '/tmp/swarm-p1/cases'},
    case: {type: 'string', multiple: true},
  },
});
const out = resolve(values.out);

const typescript = (lines: number) =>
  Array.from({length: lines}, (_, i) => {
    switch (i % 6) {
      case 0:
        return `export function item${i}(value: number): string {`;
      case 1:
        return `\tconst label = \`#\${value} => \${value >= ${i} ? 'big' : "small"}\`;`;
      case 2:
        return `\treturn label !== '' ? label : String(0x${i.toString(16)}); // line ${i + 1}`;
      case 3:
        return '}';
      case 4:
        return '';
      default:
        return `const re${i} = /^item-\\d+$/u;`;
    }
  }).join('\n');

const vue = `<template>
  <button @click="count++">{{ count }}</button>
</template>

<script setup lang="ts">
import {ref} from 'vue';
const count = ref(0);
</script>`;

const angular = `<ul *ngIf="items.length > 0; else empty">
  <li *ngFor="let item of items" [class.active]="item.id === selected">
    {{ item.name | uppercase }}
  </li>
</ul>
<ng-template #empty><p>Nothing</p></ng-template>`;

async function setCode(page: Page, code: string) {
  await page.locator('.cm-content[contenteditable="true"]').first().fill(code);
  await page.waitForTimeout(400);
}

async function setTabName(page: Page, name: string) {
  await page.locator('[aria-label="Tab name"] input').last().fill(name);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

async function setLanguage(page: Page, name: string) {
  await page.locator('button[aria-label="Language"]').click();
  await page.getByRole('option', {name, exact: true}).click();
}

async function choose(page: Page, field: string, option: string) {
  await page
    .locator(`label[for="${field}"]`)
    .locator('..')
    .getByText(option, {exact: true})
    .click();
}

async function showLineNumbers(page: Page, start?: number) {
  await choose(page, 'frameLineNumbersField', 'Show');
  if (start === undefined) return;
  await page.locator('#frameLineNumberStartField-input').fill(String(start));
  await page.locator('#frameLineNumberStartField-input').press('Tab');
}

const cases: Record<string, (page: Page) => Promise<void>> = {
  default: async () => {},
  'long-300-numbered': async page => {
    await setCode(page, typescript(300));
    await showLineNumbers(page);
  },
  'gutter-from-998': async page => {
    await setCode(page, typescript(5));
    await showLineNumbers(page, 998);
  },
  'light-theme-gutter-from-9': async page => {
    await selectTheme(page, 'XCode Light');
    await setCode(page, typescript(12));
    await showLineNumbers(page, 9);
  },
  'ligatures-off': async page => {
    await setCode(
      page,
      'const ready = a !== b && c >= d;\nconst arrow = (x: number) => x <= 42;',
    );
    await page
      .locator('label')
      .filter({hasText: 'Ligatures'})
      .locator('..')
      .getByRole('tab', {name: 'No', exact: true})
      .click();
  },
  'three-tabs': async page => {
    await setCode(page, typescript(6));
    await setTabName(page, 'main.ts');
    for (const tab of [
      {
        name: 'hello.py',
        language: 'Python',
        code: 'def hello(name):\n    return f"Hi {name}"',
      },
      {
        name: 'config.json',
        language: 'JSON',
        code: '{\n  "ready": true,\n  "count": 42\n}',
      },
    ]) {
      await page.locator('button[class*="TabAddButton_button"]').click();
      await setTabName(page, tab.name);
      await setLanguage(page, tab.language);
      await setCode(page, tab.code);
    }
    await page.getByText('hello.py', {exact: true}).first().click();
  },
  'vue-tab': async page => {
    await setLanguage(page, 'Typescript');
    await setCode(page, vue);
    await setTabName(page, 'App.vue');
  },
  'angular-tab': async page => {
    await setLanguage(page, 'Html');
    await setCode(page, angular);
    await setTabName(page, 'app.component.html');
  },
  'windows-glass': async page => {
    await setCode(page, typescript(8));
    await page
      .locator('label[for="frameTerminalTypeField"]')
      .locator('..')
      .locator('[aria-haspopup]')
      .click();
    await page.locator('[class*="RadioBlock_radioBlock"]').first().click();
    await page.keyboard.press('Escape');
    await choose(page, 'frameTabReflectionField', 'Show');
  },
};

type Output = 'PNG' | 'SVG' | 'clipboard';

async function render(page: Page, output: Output, path: string) {
  if (output === 'clipboard') {
    await page
      .getByRole('button', {name: 'Copy to clipboard', exact: true})
      .click();
    await page
      .getByText('Snippet copied to clipboard', {exact: true})
      .waitFor();
    const bytes: number[] = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      const blob = await item.getType('image/png');
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    await writeFile(path, Buffer.from(bytes));
    return;
  }
  await page.getByRole('button', {name: 'Export', exact: true}).click();
  await page.getByRole('tab', {name: output, exact: true}).click();
  const download = page.waitForEvent('download', {timeout: 300_000});
  await page.getByRole('button', {name: 'Confirm', exact: true}).click();
  if (output === 'PNG') return (await download).saveAs(path);
  const svg = await readFile(await (await download).path());
  const viewer = await page.context().newPage();
  await viewer.setContent(
    `<body style="margin:0"><img src="data:image/svg+xml;base64,${svg.toString('base64')}"></body>`,
  );
  await viewer
    .locator('img')
    .evaluate(img => (img as HTMLImageElement).decode());
  await viewer.locator('img').screenshot({path});
  await viewer.close();
}

async function runCase(
  browser: Browser,
  name: string,
  setup: (page: Page) => Promise<void>,
  output: Output = 'PNG',
) {
  const paths: string[] = [];
  for (const [side, url] of [
    ['base', values['base-url']],
    ['head', values['head-url']],
  ] as const) {
    const context = await browser.newContext({
      viewport: {width: 1440, height: 1000},
      deviceScaleFactor: 1,
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    await openEditor(page, url);
    await setup(page);
    await page.waitForTimeout(500);
    const path = join(out, `${name}-${side}.png`);
    await render(page, output, path);
    paths.push(path);
    await context.close();
  }
  const diffPercent = await diffPng(
    paths[0],
    paths[1],
    join(out, `${name}-diff.png`),
  );
  console.log(`${name}\t${diffPercent.toFixed(4)}%`);
  return {name, output, diffPercent};
}

async function main() {
  await mkdir(out, {recursive: true});
  const browser = await chromium.launch();
  const selected = (name: string) => !values.case || values.case.includes(name);
  const rows = [];
  try {
    for (const [name, setup] of Object.entries(cases))
      if (selected(name)) rows.push(await runCase(browser, name, setup));
    const numbered = async (page: Page) => {
      await setCode(page, typescript(8));
      await showLineNumbers(page);
    };
    if (selected('svg'))
      rows.push(await runCase(browser, 'svg', numbered, 'SVG'));
    if (selected('clipboard'))
      rows.push(await runCase(browser, 'clipboard', numbered, 'clipboard'));
  } finally {
    await browser.close();
  }
  await writeFile(join(out, 'results.json'), JSON.stringify(rows, null, 2));
  assert.ok(rows.length > 0, 'ran at least one case');
  assert.ok(
    rows.every(row => row.diffPercent <= MAX_DIFF_PERCENT),
    'pixel parity exceeds 0.5%',
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
