import assert from 'node:assert/strict';
import {launch, open, segment} from './lib.ts';

// Exercises the panel actions the videos do not show.
const {browser, page} = await launch();
await open(
  page,
  process.argv[2] ?? 'http://localhost:4377/',
  'prototypes/animate-timeline',
);
const holds = () => page.getByRole('slider', {name: /^Hold of step/}).count();
const tabs = () => page.locator('.cm-editor').count();

assert.equal(await holds(), 3, 'three demo steps');
await segment(page, /^Hold of step 1/).click();
await page.getByRole('button', {name: 'Duplicate as next step'}).click();
await page.waitForTimeout(300);
assert.equal(await holds(), 4, 'duplicate adds a step');
assert.match(
  (await segment(page, /^Hold of step 2/).getAttribute('aria-label')) ?? '',
  /user\.ts/,
  'the copy follows its source',
);

await page.getByRole('button', {name: 'Add to animation'}).click();
await page.getByRole('menuitem', {name: /^user\.test\.ts/}).click();
await page.waitForTimeout(300);
assert.equal(await holds(), 5, 'a tab can join twice');

const t1 = segment(page, /^Transition from step 1/);
await t1.focus();
await page.keyboard.press('ArrowRight');
await page.keyboard.press('Alt+ArrowLeft');
assert.equal(
  await t1.getAttribute('aria-valuenow'),
  '990',
  'arrows nudge 100 ms, Alt 10 ms',
);

await page.getByRole('button', {name: /^Easing:/}).click();
await page.getByRole('tab', {name: 'Custom'}).click();
const field = page.locator('[role=dialog] input').first();
await field.click();
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.type('cubic-bezier(2, 0, 1, 1)');
assert.match(
  await page.locator('[role=dialog]').innerText(),
  /x between 0 and 1/,
  'x outside [0, 1] is refused',
);
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.type('cubic-bezier(0.3, -0.5, 0.2, 1.4)');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
assert.equal(
  await page.getByRole('button', {name: 'Easing: Custom'}).count(),
  1,
  'a valid curve applies',
);

await page.getByRole('button', {name: 'Apply to all'}).click();
await page.waitForTimeout(200);
const values = await page
  .getByRole('slider', {name: /^Transition/})
  .evaluateAll(els => els.map(el => el.getAttribute('aria-valuenow')));
assert.deepEqual(
  new Set(values),
  new Set(['990']),
  'apply to all copies the duration',
);

await page.getByRole('button', {name: 'Play', exact: true}).click();
await page.waitForTimeout(800);
assert.equal(
  await page.locator('[data-animation-stage]').isVisible(),
  true,
  'the duplicated, repeated steps play',
);
console.log('behaviour ok', values);
await browser.close();
