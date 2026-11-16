import assert from 'node:assert/strict';

async function setLineNumbers({page, section}, on) {
  await section('code');
  const control = page.locator('[data-control="editor.lineNumbers"]');
  const toggle = (await control.count())
    ? control.getByRole('switch')
    : page.getByRole('switch', {name: 'Line number', exact: true});
  if ((await toggle.getAttribute('aria-checked')) !== String(on))
    await toggle.press('Space');
  const gutter = page.locator(
    '.cm-editor:has(.cm-content[contenteditable=true]) .cm-lineNumbers',
  );
  await gutter.first().waitFor({state: on ? 'visible' : 'detached'});
}

async function readBadges(page) {
  return page.locator('[data-animate-aid="badge"]').evaluateAll(badges => {
    const editor = document.querySelector(
      '.cm-editor:has(.cm-content[contenteditable=true])',
    );
    const content = editor
      ?.querySelector('.cm-content')
      ?.getBoundingClientRect();
    const lines = [...(editor?.querySelectorAll('.cm-line') ?? [])].map(line =>
      line.getBoundingClientRect(),
    );
    return badges.map(badge => {
      const box = badge.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      const style = getComputedStyle(badge.closest('.cm-tooltip') ?? badge);
      return {
        text: badge.textContent,
        insideEditor: !!badge.closest('.cm-editor'),
        shown:
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== 'hidden' &&
          box.right > 0 &&
          box.left < innerWidth &&
          box.bottom > 0 &&
          box.top < innerHeight,
        line: lines.findIndex(
          line => middle >= line.top && middle <= line.bottom,
        ),
        rightOfContentStart: !!content && box.left > content.left,
      };
    });
  });
}

export function badgesJourney(journey) {
  return journey(
    'animate-script-badges',
    async ({page, addStep, editor, section, screenshot}) => {
      await addStep();
      await editor().focus();
      await page.keyboard.press('ControlOrMeta+Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.locator('[data-script-action="enter"]').click();
      await page.locator('[data-animate-aid="badge"]').first().waitFor();
      const results = {};
      for (const on of [false, true]) {
        await setLineNumbers({page, section}, on);
        await page.waitForTimeout(300);
        const badges = await readBadges(page);
        await screenshot(on ? 'numbers-on' : 'numbers-off');
        assert.ok(badges.length >= 1, 'a script badge is rendered');
        for (const badge of badges) {
          assert.equal(
            badge.insideEditor,
            false,
            'badge sits in the popup host',
          );
          assert.equal(badge.shown, true, `badge ${badge.text} is visible`);
          assert.ok(
            badge.line >= 1,
            `badge ${badge.text} sits on a script line`,
          );
          assert.equal(badge.rightOfContentStart, true);
        }
        results[on ? 'numbersOn' : 'numbersOff'] = badges;
      }
      return results;
    },
  );
}
