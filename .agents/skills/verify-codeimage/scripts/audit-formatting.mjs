import assert from 'node:assert/strict';

export async function auditFormatting({
  feature,
  page,
  editor,
  section,
  settings,
  closeSettings,
}) {
  await feature('formatting-settings', async () => {
    const format = page.getByRole('button', {name: 'Format code', exact: true});
    const assertCode = async expected => {
      await page.waitForFunction(
        text =>
          document
            .querySelector('.cm-content[contenteditable="true"]')
            ?.innerText.trimEnd() === text,
        expected,
      );
      assert.equal((await editor().innerText()).trimEnd(), expected);
    };
    const language = async name => {
      await section('code');
      await page.locator('#sidebar-editor-language-trigger').click();
      await page.getByRole('option', {name, exact: true}).click();
    };

    await language(/^typescript$/i);
    const source = 'const item={label:"something",quantity:100}';
    await editor().fill(source);
    await format.click();
    await assertCode('const item = { label: "something", quantity: 100 };');

    await page.keyboard.press('ControlOrMeta+k');
    const command = page.getByRole('combobox', {
      name: 'Search themes and options',
    });
    await command.fill('Line width');
    await command.press('Enter');
    await page
      .getByRole('textbox', {name: 'Line width', exact: true})
      .waitFor();
    await closeSettings();

    await settings('formatting');
    await page
      .getByRole('textbox', {name: 'Line width', exact: true})
      .fill('25');
    await page
      .getByRole('textbox', {name: 'Indentation width', exact: true})
      .fill('4');
    for (const id of ['singleQuote', 'semi']) {
      await page.locator(`#settings-formatting-${id}`).focus();
      await page.keyboard.press('Space');
    }
    await closeSettings();
    await page.reload();
    await editor().waitFor();
    await editor().fill(source);
    await format.click();
    await assertCode(
      "const item = {\n    label: 'something',\n    quantity: 100,\n}",
    );

    await settings('formatting');
    await page
      .getByRole('button', {name: 'Restore defaults', exact: true})
      .click();
    await closeSettings();
    await editor().fill(source);
    await format.click();
    await assertCode('const item = { label: "something", quantity: 100 };');

    await language(/^json$/i);
    await editor().fill('{"count":1}');
    await format.click();
    await assertCode('{\n  "count": 1\n}');
  });
  await feature('editor-options', async () => {
    await editor().fill('const unchanged = 1;');
    await section('code');
    const language = page.locator('#sidebar-editor-language-trigger');
    await language.click();
    await page.getByRole('option', {name: 'Python', exact: true}).click();
    assert.match(await language.innerText(), /Python/);
    assert.equal(await editor().innerText(), 'const unchanged = 1;');
    await language.click();
    await page.getByRole('option', {name: /^Typescript$/i}).click();
    assert.match(await language.innerText(), /Typescript/i);
    await editor().fill('const value={answer:42}');
    await page.getByRole('button', {name: 'Format code', exact: true}).click();
    await page.waitForFunction(() =>
      document
        .querySelector('.cm-content[contenteditable="true"]')
        ?.textContent.includes('const value ='),
    );
    assert.match(await editor().innerText(), /const value = \{.*answer: 42/);
  });
}
