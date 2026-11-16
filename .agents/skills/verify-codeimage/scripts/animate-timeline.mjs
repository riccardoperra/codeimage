import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decodeGif} from '../../../../apps/codeimage/src/core/gif/decode.test-utils.ts';
import {PNG} from 'pngjs';

export function animateTimelineCases({fresh, out}) {
  const journey =
    (name, run, viewport = {width: 1440, height: 1000}) =>
    () =>
      fresh({name, layout: 'inspector', viewport}, async api => {
        const {page, doctor, editor, section} = api;
        page.setDefaultTimeout(15000);
        if (viewport.width < 769)
          await page.setViewportSize({width: 1440, height: 1000});
        await doctor('/', 'editor', 'inspector');
        await section('window');
        await page
          .locator('[data-control="window.style"]')
          .getByRole('button')
          .click();
        await page
          .getByRole('radio', {name: 'Editor', exact: true})
          .press('Space');
        await page
          .getByRole('dialog', {name: 'Window', exact: true})
          .getByRole('button', {name: 'Close', exact: true})
          .click();
        await editor().fill(
          'const first = 1;\nconst added = 2;\nconst total = first + added;\nconsole.log(total);',
        );
        if (viewport.width < 769) await page.setViewportSize(viewport);
        await page.locator('[data-animate-toggle]').click();
        await page.locator('[data-animate-panel]').waitFor();
        const holds = () =>
          page.locator(
            '[data-timeline] [data-animation-segment][data-kind="hold"]',
          );
        const chips = () =>
          page.locator(
            '[data-timeline] [data-animation-segment][data-kind="transition"]',
          );
        const count = async n => {
          await page.waitForFunction(
            n =>
              document.querySelectorAll(
                '[data-timeline] [data-animation-segment][data-kind="hold"]',
              ).length === n,
            n,
          );
          assert.equal(await holds().count(), n);
        };
        const addStep = async () =>
          page
            .locator('[data-tab-group]')
            .first()
            .locator('[data-add-script-step]')
            .click();
        const screenshot = suffix =>
          page.screenshot({
            path: resolve(out, `${name}-${suffix}.png`),
            fullPage: true,
          });
        const result = await run({
          ...api,
          holds,
          chips,
          count,
          addStep,
          screenshot,
        });
        await screenshot('final');
        return result;
      });
  const tabs = journey(
    'animate-tabs-timeline',
    async ({page, holds, count, editor, screenshot}) => {
      await count(1);
      assert.equal(
        await page.locator('[data-bar-mode="transport"]').count(),
        1,
      );
      assert.equal(
        await page
          .locator('[data-animate-toggle]')
          .getAttribute('aria-pressed'),
        'true',
      );
      const counts = [];
      for (let n = 1; n <= 3; n++) {
        if (n > 1) {
          await page
            .locator('[data-timeline] [data-animation-add-tab]')
            .click();
          await editor().fill(`const tab${n} = ${n};`);
        }
        await count(n);
        counts.push(await holds().count());
        await screenshot(`${n}-tabs`);
        await page.locator('[data-animate-toggle]').click();
        await page.locator('[data-animate-toggle]').click();
        await count(n);
      }
      await page
        .locator('[data-timeline-layout-toggle]')
        .getByRole('tab')
        .nth(1)
        .click();
      await page.locator('[data-timeline="outline"]').waitFor();
      await count(3);
      await page
        .locator('[data-timeline-layout-toggle]')
        .getByRole('tab')
        .first()
        .click();
      await page.locator('[data-timeline="filmstrip"]').waitFor();
      return {counts, layouts: ['filmstrip', 'outline']};
    },
  );
  const script = journey(
    'animate-script-editing',
    async ({page, editor, holds, addStep, count, screenshot}) => {
      await addStep();
      await count(2);
      const firstId = await holds().first().getAttribute('data-step-id');
      await editor().focus();
      await page.keyboard.press('ControlOrMeta+Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.locator('[data-script-action="enter"]').click();
      await page.locator('[data-animate-aid="line"]').first().waitFor();
      await screenshot('enter');
      await addStep();
      await count(3);
      const lastId = await holds().last().getAttribute('data-step-id');
      await holds().nth(1).click();
      await page.locator('[data-step-menu]').click();
      await page.locator('[data-script-remove]').click();
      await count(2);
      assert.deepEqual(
        await holds().evaluateAll(items =>
          items.map(item => item.dataset.stepId),
        ),
        [firstId, lastId],
      );
      assert.equal(
        await holds().first().getAttribute('aria-pressed'),
        'true',
        'selection follows the surviving previous id',
      );
      return {firstId, lastId, removedMiddle: true};
    },
  );
  const transition = journey(
    'animate-transition-popover',
    async ({page, chips, addStep, screenshot}) => {
      await addStep();
      const chip = chips().first();
      for (const key of ['Enter', 'Space']) {
        await chip.focus();
        await chip.press(key);
        const popover = page.getByRole('dialog', {name: 'Easing', exact: true});
        await popover.waitFor();
        await screenshot(key.toLowerCase());
        await page.keyboard.press('Escape');
        await popover.waitFor({state: 'hidden'});
        await page.waitForFunction(() =>
          document.activeElement?.matches(
            '[data-animation-segment][data-kind="transition"]',
          ),
        );
        assert.equal(
          await chip.evaluate(element => element === document.activeElement),
          true,
        );
      }
      return {keys: ['Enter', 'Space'], focusReturned: true};
    },
  );
  const done = journey('animate-mode-done', async ({page}) => {
    await page.locator('[data-animate-mode]').waitFor();
    await page.locator('[data-animate-done]').click();
    await page.locator('[data-animate-panel]').waitFor({state: 'hidden'});
    assert.equal(
      await page.locator('[data-animate-toggle]').getAttribute('aria-pressed'),
      'false',
    );
    await page.locator('[data-animate-toggle]').focus();
    await page.locator('[data-animate-toggle]').press('Enter');
    await page.locator('[data-animate-mode]').waitFor();
    await page.locator('[data-animate-toggle]').press('Escape');
    await page.locator('[data-animate-panel]').waitFor({state: 'hidden'});
    return {done: true, escape: true};
  });
  const reload = journey(
    'animate-script-reload',
    async ({page, addStep, holds, count, editor}) => {
      await addStep();
      await editor().focus();
      await page.keyboard.press('ControlOrMeta+Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.locator('[data-script-action="enter"]').click();
      const ids = await holds().evaluateAll(items =>
        items.map(item => item.dataset.stepId),
      );
      const saved = () =>
        page.evaluate(
          () =>
            new Promise(resolve => {
              const request = indexedDB.open('keyval-store');
              request.onsuccess = () => {
                const database = request.result;
                const read = database
                  .transaction('keyval')
                  .objectStore('keyval')
                  .get('document');
                read.onsuccess = () => {
                  database.close();
                  resolve(read.result);
                };
              };
            }),
        );
      for (
        let i = 0;
        i < 50 &&
        !(await saved())?.editor?.editors?.[0]?.marks?.script?.lines?.length;
        i++
      )
        await page.waitForTimeout(100);
      const persisted = await saved();
      await writeFile(
        resolve(out, 'animate-script-persisted.json'),
        JSON.stringify(persisted, null, 2),
      );
      assert.ok(
        persisted?.editor?.editors?.[0]?.marks?.script?.lines?.length,
        'script ranges are persisted',
      );
      await page.reload();
      await editor().waitFor();
      await page.locator('[data-animate-toggle]').click();
      await count(2);
      assert.deepEqual(
        await holds().evaluateAll(items =>
          items.map(item => item.dataset.stepId),
        ),
        ids,
      );
      await holds().last().click();
      assert.ok((await page.locator('[data-animate-aid="line"]').count()) > 0);
      return {ids, scriptPersisted: true};
    },
  );
  const phone = journey(
    'animate-phone-timeline',
    async ({page, holds, count, screenshot}) => {
      await page.locator('[data-timeline="outline"]').waitFor();
      await count(1);
      assert.equal(
        await page.locator('[data-timeline="filmstrip"]').count(),
        0,
      );
      await holds().first().click();
      const sheet = page.locator('[data-animation-step-sheet]');
      await sheet.waitFor();
      await screenshot('sheet');
      await sheet
        .getByRole('button', {name: 'Close step settings', exact: true})
        .click();
      await sheet.waitFor({state: 'hidden'});
      return {layout: 'outline', sheet: true};
    },
    {width: 390, height: 844},
  );
  const exportScript = journey(
    'animate-script-export',
    async ({page, editor, addStep, holds, screenshot}) => {
      await addStep();
      await editor().focus();
      await page.keyboard.press('ControlOrMeta+Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.locator('[data-script-action="enter"]').click();
      await holds().first().click();
      await screenshot('aids');
      await page.evaluate(() => {
        const post = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function (message, ...options) {
          if (message?.kind === 'export')
            window.__animateTimelineJob = {
              scenes: message.job.scenes,
              css: message.job.css,
            };
          return post.call(this, message, ...options);
        };
      });
      await page.locator('[data-export-menu]').click();
      const action = page.locator('[data-export-action="animation"]');
      if (await action.isVisible()) await action.click();
      const dialog = page.locator('[data-animation-export]');
      await dialog.waitFor();
      await dialog
        .getByRole('radio', {name: 'GIF', exact: true})
        .press('Space');
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll('[data-animation-export] button')].some(
            button => button.textContent === 'Export GIF' && !button.disabled,
          ),
        undefined,
        {timeout: 60000},
      );
      const download = page.waitForEvent('download', {timeout: 180000});
      await dialog
        .getByRole('button', {name: 'Export GIF', exact: true})
        .click();
      const pending = await download;
      const file = resolve(out, 'animate-script.gif');
      await pending.saveAs(file);
      const job = await page.evaluate(() => window.__animateTimelineJob);
      assert.ok(job?.scenes.length >= 3);
      for (const scene of job.scenes) {
        assert.doesNotMatch(scene.html, /data-animate-aid|2→|●2|scriptLines_/);
      }
      const bytes = await readFile(file);
      const width = bytes.readUInt16LE(6);
      const height = bytes.readUInt16LE(8);
      const frames = [...decodeGif(bytes)];
      assert.ok(frames.length > 2);
      for (const [index, frame] of frames.entries()) {
        assert.equal(frame.rgba.length, width * height * 4);
        if (index === 0 || index === frames.length - 1) {
          const png = new PNG({width, height});
          png.data.set(frame.rgba);
          await writeFile(
            resolve(out, `animate-script-frame-${index}.png`),
            PNG.sync.write(png),
          );
        }
      }
      await writeFile(
        resolve(out, 'animate-script-scenes.json'),
        JSON.stringify(job, null, 2),
      );
      return {
        frames: frames.length,
        scenes: job.scenes.length,
        aidsAbsent: true,
        file,
      };
    },
  );
  return {tabs, script, transition, done, reload, phone, exportScript};
}
