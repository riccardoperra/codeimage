import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decodeGif} from '../../../../apps/codeimage/src/core/gif/decode.test-utils.ts';
import {PNG} from 'pngjs';

export function reloadJourney(journey, out) {
  return journey(
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
}

export function exportScriptJourney(journey, out) {
  return journey(
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
}
