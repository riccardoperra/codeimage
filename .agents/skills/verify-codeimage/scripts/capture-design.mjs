#!/usr/bin/env node
// node .agents/skills/verify-codeimage/scripts/capture-design.mjs <base URL> [output directory] [name filter]
// Captures the six reference views that DESIGN.md shows, from a dev server you started.
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
process.chdir(fileURLToPath(new URL('../../../..', import.meta.url)));
const base = process.argv[2];
if (!base) throw new Error('Pass the base URL of a dev server you started');
const out = process.argv[3] ?? 'docs/design/screenshots';
mkdirSync(out, {recursive: true});
const browser = await chromium.launch();
const sizes = {1440: 900, 1024: 768, 390: 844};
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

async function open(prefs, width) {
  const ctx = await browser.newContext({
    viewport: {width, height: sizes[width]},
    deviceScaleFactor: width === 390 ? 2 : 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript(prefs => {
    localStorage.setItem('codeimage:editor-settings', JSON.stringify(prefs));
    localStorage.setItem(
      '@store/ui',
      JSON.stringify({themeMode: 'dark', locale: 'en'}),
    );
  }, prefs);
  await page.goto(`${base}/`);
  await page.reload();
  await page.waitForSelector('[data-fit-scale] .cm-content');
  const nudge = page.locator('[data-whats-new=nudge]');
  await nudge.waitFor({timeout: 8000}).catch(() => {});
  await nudge
    .getByRole('button', {name: "Dismiss what's new"})
    .click()
    .catch(() => {});
  await nudge.waitFor({state: 'hidden'}).catch(() => {});
  // The nudge sits over the Studio theme list: leaving the pointer there previews a theme.
  await page.mouse.move(width / 2, 4);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  return {ctx, page};
}
const shot = async (page, name) => {
  await page.waitForTimeout(450);
  await page.screenshot({path: `${out}/${name}.png`});
  console.log('saved', name);
};
const only = process.argv[4];
const view = async (name, prefs, width, act) => {
  if (only && !new RegExp(only).test(name)) return;
  const {ctx, page} = await open(prefs, width);
  try {
    if (act) await act(page);
    await shot(page, name);
  } catch (error) {
    console.log('FAILED', name, error.message.split('\n')[0]);
  }
  await ctx.close();
};
const settings = section => async page => {
  await page.keyboard.press(`${mod}+k`);
  await page.keyboard.type(`Settings: ${section}`);
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
  await page.getByRole('alertdialog').waitFor();
};

const I = {layout: 'inspector'},
  D = {layout: 'dock'},
  St = {layout: 'studio'};
await view('01-inspector-1440', I, 1440);
await view('06-settings-experiments-1440', I, 1440, settings('Experiments'));
await view('07-command-menu-1440', I, 1440, async page => {
  await page.keyboard.press(`${mod}+k`);
  await page.keyboard.type('dracula');
});
await view('09-dock-1440', D, 1440);
await view('12-studio-themes-1440', St, 1440);
await view('30-inspector-390', I, 390);
await browser.close();
