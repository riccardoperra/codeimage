import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {dismissNews} from './news.mjs';

export async function auditLineMarksNews({base, out, feature, fresh}) {
  await feature('whats-new-line-marks-dot', () =>
    fresh(
      {
        name: 'whats-new-line-marks-dot',
        layout: 'inspector',
        viewport: {width: 1440, height: 900},
      },
      async ({page, settings, closeSettings}) => {
        await page.goto(base, {waitUntil: 'domcontentloaded'});
        await page.locator('.cm-content[contenteditable="true"]').waitFor();
        await dismissNews(page);
        const badge = page.locator('[data-line-marks-news]');
        await badge.waitFor();
        const measure = () =>
          page.evaluate(() => {
            const badge = document.querySelector('[data-line-marks-news]');
            const cell = document.querySelector(
              '.cm-lineMarkMarker[data-mark-line="1"]',
            )?.parentElement;
            if (!badge || !cell) return null;
            const b = badge.getBoundingClientRect();
            const c = cell.getBoundingClientRect();
            const button = badge.querySelector('button');
            const hit = button?.getBoundingClientRect();
            const top = hit
              ? document.elementFromPoint(
                  hit.left + hit.width / 2,
                  hit.top + hit.height / 2,
                )
              : null;
            return {
              offsetX: Math.round(b.left - c.right),
              offsetY: Math.round(b.top - c.top),
              cellLeft: Math.round(c.left),
              onScreen:
                b.top >= 0 &&
                b.left >= 0 &&
                b.bottom <= innerHeight &&
                b.right <= innerWidth,
              ownsItsPoint: Boolean(top && badge.contains(top)),
            };
          });
        const before = await measure();
        assert.ok(before?.onScreen, 'the line marks dot is on screen');
        assert.deepEqual([before.offsetX, before.offsetY], [-46, 0]);
        const {setLineNumbers} = await import('./line-mark-layering.mjs');
        await setLineNumbers(page, true);
        await badge.waitFor();
        await page.evaluate(
          () =>
            new Promise(done =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            ),
        );
        const numbers = await measure();
        assert.ok(
          numbers?.onScreen,
          `the dot is on screen with line numbers on (${JSON.stringify(numbers)})`,
        );
        assert.deepEqual([numbers.offsetX, numbers.offsetY], [-46, 0]);
        assert.ok(numbers.ownsItsPoint, 'the dot covers nothing but itself');
        await setLineNumbers(page, false);
        await settings('appearance');
        await page
          .locator('[data-setting=panel-side]')
          .getByRole('tab', {name: 'Left', exact: true})
          .click();
        await closeSettings();
        await page.waitForFunction(
          left =>
            Math.round(
              document
                .querySelector('.cm-lineMarkMarker[data-mark-line="1"]')
                ?.parentElement?.getBoundingClientRect().left ?? left,
            ) !== left,
          before.cellLeft,
        );
        await page.evaluate(
          () =>
            new Promise(done =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            ),
        );
        const after = await measure();
        assert.ok(
          after?.onScreen,
          'the dot is still on screen after the canvas moved',
        );
        assert.notEqual(after.cellLeft, before.cellLeft);
        assert.deepEqual([after.offsetX, after.offsetY], [-46, 0]);
        assert.ok(after.ownsItsPoint, 'the dot covers nothing but itself');
        await badge.getByRole('button').click();
        const coachmark = page.getByRole('dialog', {
          name: 'Line marks',
          exact: true,
        });
        await coachmark.waitFor();
        const row = await page
          .locator('.cm-content[contenteditable="true"] .cm-line')
          .first()
          .boundingBox();
        const point = {x: row.x + row.width - 2, y: row.y + 2};
        await page.mouse.move(point.x, point.y);
        assert.ok(
          await page.evaluate(
            point =>
              document
                .elementFromPoint(point.x, point.y)
                ?.closest('.cm-content'),
            point,
          ),
          'the pointer reaches the editor beside the coachmark',
        );
        assert.equal(
          await coachmark.isVisible(),
          true,
          'hovering the editor preserves the coachmark',
        );
        await coachmark
          .getByRole('button', {name: 'Got it', exact: true})
          .click();
        await coachmark.waitFor({state: 'hidden'});
        await page.screenshot({
          path: resolve(out, 'whats-new-line-marks-dot.png'),
        });
        return {before, numbers, after};
      },
    ),
  );
}
