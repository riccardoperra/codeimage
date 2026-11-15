import type {Browser, BrowserContext, Page} from 'playwright';
import {chromium} from 'playwright';

export const WORKER =
  'node_modules/.pnpm/msw@2.12.14_@types+node@25.9.9_typescript@6.0.3/node_modules/msw/lib/mockServiceWorker.js';

export async function launch(
  opts: {
    width?: number;
    height?: number;
    video?: string;
  } = {},
): Promise<{browser: Browser; context: BrowserContext; page: Page}> {
  const browser = await chromium.launch({channel: 'chrome'});
  const size = {width: opts.width ?? 1440, height: opts.height ?? 900};
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
    recordVideo: opts.video ? {dir: opts.video, size} : undefined,
  });
  await context.route('**/mockServiceWorker.js', route =>
    route.fulfill({path: WORKER, contentType: 'text/javascript'}),
  );
  const page = await context.newPage();
  page.on('console', m => {
    if (m.type() === 'error') console.log('console:', m.text());
  });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  return {browser, context, page};
}

export async function open(page: Page, base: string, route: string) {
  await page.goto(new URL(route, base).href);
  await page
    .locator('.cm-content[contenteditable]')
    .first()
    .waitFor({state: 'attached', timeout: 300_000});
  await page.waitForTimeout(600);
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'hidden'});
  }
  await page.waitForTimeout(300);
}

// Picks a variant with the pill, as a user would.
export async function pick(page: Page, name: string) {
  await page
    .getByRole('navigation', {name: 'Prototype variants'})
    .getByRole('button', {name, exact: true})
    .click();
  await page.waitForTimeout(400);
}

export const segment = (page: Page, label: RegExp | string) =>
  page.getByRole('slider', {name: label});
