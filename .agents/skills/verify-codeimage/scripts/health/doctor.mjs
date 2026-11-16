import assert from 'node:assert/strict';
import {dismissNews} from '../news.mjs';
export function createDoctor({page, server, base}) {
  async function doctor(
    route = '/',
    expected = 'editor',
    layout,
    target = page(),
  ) {
    assert.equal(server.exitCode, null);
    assert.ok((await fetch(base)).ok);
    await target.goto(base + route, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const changed =
      layout !== undefined &&
      (await target.evaluate(layout => {
        const key = 'codeimage:editor-settings';
        const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
        if ((stored.layout ?? 'inspector') === layout) return false;
        localStorage.setItem(key, JSON.stringify({...stored, layout}));
        return true;
      }, layout));
    if (changed) await target.reload();
    if (expected === 'dashboard') {
      await target
        .getByRole('button', {name: 'New', exact: true})
        .first()
        .waitFor();
      return;
    }
    await target
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .waitFor({timeout: 60000});
    await target.evaluate(() => document.fonts.ready);
    await dismissNews(target);
    await target.evaluate(() => document.fonts.ready);
    assert.ok(
      await target
        .locator('.cm-content[contenteditable="true"]')
        .first()
        .isVisible(),
    );
  }
  return doctor;
}
