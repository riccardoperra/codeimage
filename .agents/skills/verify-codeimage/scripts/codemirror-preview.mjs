import assert from 'node:assert/strict';

export async function auditCodeMirrorPreview(page, section, editor) {
  const name = 'CodeMirror preview preset';
  const getDialog = name =>
    page
      .getByRole('dialog', {name, exact: true})
      .or(page.getByRole('alertdialog', {name, exact: true}));
  await section('presets');
  await page
    .getByRole('button', {name: 'Add preset', exact: true})
    .first()
    .click();
  const add = getDialog('Add a new preset');
  await add.getByRole('textbox').fill(name);
  await add.getByRole('button', {name: 'Confirm', exact: true}).click();
  await add.waitFor({state: 'hidden'});

  await section('themes');
  await page
    .getByRole('textbox', {name: 'Search themes', exact: true})
    .fill('Dracula');
  await page
    .getByRole('option', {name: 'Dracula Dark theme', exact: true})
    .click();
  await section('presets');
  const menu = page.locator('li').filter({hasText: name}).getByRole('button', {
    name: 'Preset menu',
    exact: true,
  });
  const dialog = getDialog('Update preset');
  const preview = label =>
    dialog.locator('li').filter({has: page.getByText(label, {exact: true})});
  const codeSelector = '.cm-content[contenteditable="false"]';
  const current = preview('New');
  const content = current.locator(codeSelector);
  const saved = preview('Old').locator(codeSelector);
  const code = 'function Code() {\n console.log()\n}';
  const initialDocument = await editor().innerText();

  for (let open = 0; open < 2; open++) {
    await menu.click();
    await page.getByRole('menuitem', {name: 'Update', exact: true}).click();
    await content.waitFor();
    await saved.waitFor();
    assert.equal(await dialog.locator(codeSelector).count(), 2);
    assert.equal(await content.textContent(), code.replaceAll('\n', ''));
    const keyword = content
      .locator('.cm-line span')
      .filter({hasText: /^function$/});
    await keyword.waitFor();
    await page.waitForFunction(
      row => {
        const keywords = row.querySelectorAll('.cm-line span');
        return [...keywords].some(
          element =>
            element.textContent === 'function' &&
            getComputedStyle(element).color === 'rgb(255, 121, 198)',
        );
      },
      await current.elementHandle(),
    );
    const oldKeyword = saved
      .locator('.cm-line span')
      .filter({hasText: /^function$/});
    await oldKeyword.waitFor();
    assert.notEqual(
      await oldKeyword.evaluate(element => getComputedStyle(element).color),
      'rgb(255, 121, 198)',
    );

    await content.focus();
    await page.keyboard.type('changed');
    assert.equal(await content.textContent(), code.replaceAll('\n', ''));
    await dialog
      .getByRole('button', {name: 'Close', exact: true})
      .last()
      .click();
    await dialog.waitFor({state: 'hidden'});
  }

  assert.equal(await editor().innerText(), initialDocument);
  return {comparisonViews: 2, opens: 2, theme: 'dracula', readOnly: true};
}
