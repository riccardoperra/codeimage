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
  await feature('formatting-json', () =>
    checkJson({page, editor, section, closeSettings}),
  );
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

async function checkJson({page, editor, section, closeSettings}) {
  const config = page.getByRole('textbox', {name: 'Prettier configuration'});
  const apply = page.getByRole('button', {
    name: 'Save and apply',
    exact: true,
  });
  const jsonTab = page.getByRole('tab', {name: 'JSON', exact: true});
  const controls = page.getByRole('tab', {name: 'Controls', exact: true});
  const assertFormat = async expected => {
    await editor().fill('const label="hello"');
    await page.getByRole('button', {name: 'Format code', exact: true}).click();
    await page.waitForFunction(
      text =>
        document
          .querySelector('.cm-content[contenteditable="true"]')
          ?.innerText.trimEnd() === text,
      expected,
    );
  };
  const open = async () => {
    await section('code');
    await page
      .getByRole('button', {name: 'Formatting settings', exact: true})
      .click();
    await page
      .locator('[data-settings-section=formatting][aria-current=page]')
      .waitFor();
  };

  await section('code');
  await page.locator('#sidebar-editor-language-trigger').click();
  await page.getByRole('option', {name: /^typescript$/i}).click();
  await open();
  await jsonTab.click();
  await config.waitFor();
  await config.fill('{"printWidth":0}');
  await page
    .getByText('Invalid value for printWidth.', {exact: true})
    .waitFor();
  assert.equal(await apply.isDisabled(), true);
  await config.fill('{"plugins":["custom-plugin"]}');
  await page.getByText('Unsupported option: plugins.', {exact: true}).waitFor();
  assert.equal(await apply.isDisabled(), true);

  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Load JSON file', exact: true}).click();
  const source = '{"singleQuote":true,"semi":false}';
  await (
    await chooser
  ).setFiles({
    name: '.prettierrc.json',
    mimeType: 'application/json',
    buffer: Buffer.from(source),
  });
  await page.waitForFunction(
    text =>
      document.querySelector(
        '[role="textbox"][aria-label="Prettier configuration"]',
      )?.innerText === text,
    source,
  );
  await apply.click();
  await page.getByText('JSON configuration saved.', {exact: true}).waitFor();
  await closeSettings();
  await page.reload();
  await editor().waitFor();
  await assertFormat("const label = 'hello'");

  await open();
  assert.equal(await config.innerText(), source);
  await controls.click();
  await page.getByRole('textbox', {name: 'Line width', exact: true}).waitFor();
  await closeSettings();
  await assertFormat('const label = "hello";');

  await open();
  await jsonTab.click();
  assert.equal(await config.innerText(), source);
  const edited = '{\n  "semi": false\n}';
  await config.fill(edited);
  await config.press('ControlOrMeta+z');
  assert.equal(await config.innerText(), source);
  await config.press('ControlOrMeta+Shift+z');
  assert.equal(await config.innerText(), edited);
  await apply.click();
  await page.getByText('JSON configuration saved.', {exact: true}).waitFor();
  await closeSettings();
  await assertFormat('const label = "hello"');

  await open();
  await page
    .getByRole('button', {name: 'Delete saved JSON', exact: true})
    .click();
  await page.getByRole('textbox', {name: 'Line width', exact: true}).waitFor();
  await closeSettings();
  await page.reload();
  await editor().waitFor();
  await assertFormat('const label = "hello";');
}
