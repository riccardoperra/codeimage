import {readdir, rename, rm} from 'node:fs/promises';
import type {Page} from 'playwright';
import {launch, open, pick, segment} from './lib.ts';

// Screenshots every variant of one prototype at 1440x900 and records one
// video that switches between them with the pill.
// node scripts/prototypes/capture.ts <edit-mode|easing|header|duration> [url]
const key = process.argv[2];
const base = process.argv[3] ?? 'http://localhost:4377/';
const out = 'docs/prototypes/animate';

const total = async (page: Page) =>
  Number(
    (await page.locator('[class*="time"]').first().innerText())
      .split('/')[1]
      .replace(/[^\d.]/g, ''),
  ) *
  (/ms\s*$/.test(await page.locator('[class*="time"]').first().innerText())
    ? 1
    : 1000);

async function scrubTo(page: Page, ms: number) {
  const ruler = page.locator('[class*="ruler"]').first();
  const box = (await ruler.boundingBox())!;
  const all = await total(page);
  await page.mouse.click(
    box.x + (box.width * ms) / all,
    box.y + box.height / 2,
  );
  await page.waitForTimeout(700);
}

const play = (page: Page) =>
  page.getByRole('button', {name: 'Play', exact: true}).click();

async function openEasing(page: Page) {
  await segment(page, /^Transition from step 1/).click();
  await page.getByRole('button', {name: /^Easing:/}).click();
  await page.waitForTimeout(400);
}

async function typeCurve(page: Page, text: string) {
  const field = page.locator('[role=dialog] input').first();
  await field.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text, {delay: 25});
}

type Spec = {
  route: string;
  variants: [string, string][];
  shot: (page: Page, slug: string) => Promise<void>;
  clip: (page: Page, slug: string) => Promise<void>;
};

const specs: Record<string, Spec> = {
  'edit-mode': {
    route: 'prototypes/animate-edit-mode',
    variants: [
      ['Pill', 'pill'],
      ['Pause on a hold', 'auto'],
      ['Preview ↔ Edit', 'explicit'],
    ],
    async shot(page, slug) {
      if (slug === 'explicit')
        await page.getByRole('tab', {name: 'Preview'}).click();
      await scrubTo(page, 2100);
    },
    async clip(page, slug) {
      await play(page);
      await page.waitForTimeout(1400);
      await page.getByRole('button', {name: 'Pause', exact: true}).click();
      await page.waitForTimeout(900);
      await scrubTo(page, 2100);
      await page.waitForTimeout(900);
      if (slug === 'explicit') {
        await page.getByRole('tab', {name: 'Edit'}).click();
      } else if (slug === 'pill') {
        // Typing on the preview leaves it and types into the step's tab.
        await page.locator('[data-animation-stage]').focus();
        await page.keyboard.type('a');
      } else {
        await page.locator('.cm-content[contenteditable]').first().click();
        await page.keyboard.type('a');
      }
      await page.waitForTimeout(1500);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(600);
    },
  },
  easing: {
    route: 'prototypes/animate-easing',
    variants: [
      ['Curve', 'static'],
      ['Curve + playhead', 'dot'],
      ['Curve + token', 'chip'],
    ],
    async shot(page, slug) {
      await openEasing(page);
      if (slug === 'dot') {
        await page.getByRole('button', {name: 'Play transition'}).click();
        await page.waitForTimeout(560);
      }
      if (slug === 'chip') await page.waitForTimeout(1200);
    },
    async clip(page, slug) {
      await openEasing(page);
      await page.waitForTimeout(800);
      for (const preset of ['Snappy', 'Strong', 'Smooth']) {
        await page.getByRole('tab', {name: preset}).click();
        await page.waitForTimeout(slug === 'chip' ? 1300 : 700);
        if (slug === 'dot') {
          await page.getByRole('button', {name: 'Play transition'}).click();
          await page.waitForTimeout(1400);
        }
      }
      await page.getByRole('tab', {name: 'Custom'}).click();
      await typeCurve(page, 'cubic-bezier(0.5, 0, 0.1, 1)');
      await page.waitForTimeout(slug === 'chip' ? 1400 : 700);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    },
  },
  header: {
    route: 'prototypes/animate-header',
    variants: [
      ['Current tab', 'active'],
      ['Dots + title', 'none'],
      ['All tabs', 'all'],
    ],
    async shot(page) {
      await scrubTo(page, 3200);
    },
    async clip(page) {
      await play(page);
      await page.waitForTimeout(5200);
    },
  },
  duration: {
    route: 'prototypes/animate-duration',
    variants: [
      ['700 ms', '700'],
      ['900 ms', '900'],
    ],
    async shot(page) {
      await page.waitForTimeout(5500);
      await scrubTo(page, 1150);
    },
    async clip(page) {
      await page.waitForTimeout(5200);
      await page.keyboard.press('r');
      await page.waitForTimeout(5200);
    },
  },
};

const spec = specs[key];
if (!spec) throw new Error(`unknown prototype ${key}`);

{
  const {browser, page} = await launch();
  await open(page, base, spec.route);
  for (const [name, slug] of spec.variants) {
    await pick(page, name);
    await spec.shot(page, slug);
    await page.screenshot({path: `${out}/${key}-${slug}.png`});
    await page.keyboard.press('Escape').catch(() => {});
  }
  await browser.close();
}

{
  const dir = `${out}/.video-${key}`;
  const {browser, context, page} = await launch({video: dir});
  await open(page, base, spec.route);
  for (const [name, slug] of spec.variants) {
    await page.mouse.click(10, 300);
    await pick(page, name);
    await page.waitForTimeout(500);
    await spec.clip(page, slug);
  }
  const video = page.video()!;
  await context.close();
  await browser.close();
  await rename(await video.path(), `${out}/${key}.webm`);
  await rm(dir, {recursive: true, force: true});
  console.log((await readdir(out)).filter(f => f.startsWith(key)));
}
