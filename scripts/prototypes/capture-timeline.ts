import {rename, readdir, rm} from 'node:fs/promises';
import type {Page} from 'playwright';
import {launch, open, pick, segment} from './lib.ts';

const base = process.argv[2] ?? 'http://localhost:4377/';
const out = 'docs/prototypes/animate';
const route = 'prototypes/animate-timeline';
const variants = [
  ['Strip', 'strip'],
  ['Two rails', 'rails'],
  ['Step blocks', 'blocks'],
] as const;

// Drags the right edge of a segment by `dx` pixels, holding Alt when asked.
async function dragEdge(page: Page, label: RegExp, dx: number, alt = false) {
  const box = (await segment(page, label).boundingBox())!;
  const x = box.x + box.width - 4;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  if (alt) await page.keyboard.down('Alt');
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(x + (dx * i) / 12, y);
    await page.waitForTimeout(30);
  }
  await page.mouse.up();
  if (alt) await page.keyboard.up('Alt');
}

async function scrubTo(page: Page, ms: number, total: number) {
  const ruler = page.locator('[class*="ruler"]').first();
  const box = (await ruler.boundingBox())!;
  await page.mouse.click(box.x + (box.width * ms) / total, box.y + box.height / 2);
}

const total = async (page: Page) =>
  Number(
    (await page.locator('[class*="time"]').first().innerText())
      .split('/')[1]
      .replace(/[^\d.]/g, '') ,
  ) * 1000;

{
  const {browser, page} = await launch();
  await open(page, base, route);
  for (const [name, slug] of variants) {
    await pick(page, name);
    await segment(page, /^Transition from step 1/).click();
    await scrubTo(page, 1250, await total(page));
    await page.waitForTimeout(900);
    await page.screenshot({path: `${out}/timeline-${slug}.png`});
  }
  await browser.close();
}

{
  const {browser, page} = await launch({width: 390, height: 844});
  await open(page, base, `${route}?v=1`);
  await segment(page, /^Transition from step 1/).click();
  await page.waitForTimeout(400);
  await page.screenshot({path: `${out}/timeline-strip-390.png`});
  await browser.close();
}

{
  const dir = `${out}/.video-tmp`;
  const {browser, context, page} = await launch({video: dir});
  await open(page, base, route);
  for (const [name] of variants) {
    await pick(page, name);
    await page.waitForTimeout(700);
    await segment(page, /^Hold of step 1/).click();
    await page.waitForTimeout(500);
    await dragEdge(page, /^Hold of step 1/, 90);
    await page.waitForTimeout(500);
    await dragEdge(page, /^Transition from step 1/, -60, true);
    await page.waitForTimeout(500);
    await scrubTo(page, 1300, await total(page));
    await page.waitForTimeout(600);
    await page.getByRole('button', {name: 'Play', exact: true}).click();
    await page.waitForTimeout(4200);
    await page.getByRole('button', {name: /edit step/}).click().catch(() => {});
    await page.waitForTimeout(500);
  }
  const video = page.video()!;
  await context.close();
  await browser.close();
  await rename(await video.path(), `${out}/timeline.webm`);
  await rm(dir, {recursive: true, force: true});
  console.log(await readdir(out));
}
