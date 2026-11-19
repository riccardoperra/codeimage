import assert from 'node:assert/strict';

export async function auditEditor({feature, fresh, doctor, editor, page}) {
  await feature('editor', async () => {
    await doctor();
    await editor().fill('const audit = 1;');
    await editor().press('End');
    await page.keyboard.type('x');
    await page.keyboard.press('ControlOrMeta+z');
    assert.equal(await editor().innerText(), 'const audit = 1;');
  });
  await feature('responsive-editor', async () => {
    for (const layout of ['inspector', 'studio', 'dock']) {
      await fresh(
        {
          name: `responsive-${layout}`,
          layout,
          viewport: {width: 1440, height: 900},
        },
        async ({page, doctor, editor}) => {
          await doctor();
          const desktopExport = page.locator('header [data-export-image]');
          const dockCompact = page
            .locator('.unified-editor [data-compact]')
            .filter({
              has: page.locator('[data-control-dock]'),
            });
          const railSide = page
            .getByRole('navigation', {name: 'Editor panels'})
            .locator('..');
          const code = 'const responsiveEditor = true;';
          await editor().fill(code);
          const editorNode = await editor().elementHandle();
          await desktopExport.waitFor();

          for (const width of [768, 767, 390, 1440]) {
            await page.setViewportSize({width, height: 900});
            const compact = width <= 768;
            await desktopExport.waitFor({
              state: compact ? 'detached' : 'visible',
            });
            await page.locator('[data-export-image]:visible').waitFor();
            if (layout === 'dock') {
              await dockCompact.waitFor({
                state: width <= 767 ? 'attached' : 'detached',
              });
            }
            if (layout === 'studio') {
              await railSide
                .locator(
                  `xpath=self::*[${compact ? 'not(@data-side)' : '@data-side'}]`,
                )
                .waitFor({state: 'attached'});
            }
            assert.ok(await editorNode.evaluate(node => node.isConnected));
            assert.equal(await editor().innerText(), code);
          }
        },
      );
    }
  });
  await feature('theme-search-field', async () => {
    for (const width of [1440, 390]) {
      await fresh(
        {
          name: `theme-search-field-${width}`,
          layout: 'inspector',
          viewport: {width, height: 900},
          hasTouch: width < 768,
        },
        async ({page, doctor}) => {
          await doctor();
          if (width < 768)
            await page
              .getByRole('button', {name: 'Expand inspector'})
              .press('Space');
          const picker = page.locator('[data-theme-style]:visible').first();
          const search = picker.getByRole('textbox', {
            name: 'Search themes',
            exact: true,
          });
          await search.waitFor();
          const filter = picker.getByRole('tablist');
          const [fieldBox, filterBox] = await Promise.all([
            search.boundingBox(),
            filter.boundingBox(),
          ]);
          const height = width < 768 ? 40 : 36;
          assert.equal(
            fieldBox.height,
            height,
            'Theme search uses the full field height',
          );
          assert.ok(Math.abs(fieldBox.height - filterBox.height) <= 8);
          await search.fill('Dracula');
          const option = picker.getByRole('option', {
            name: 'Dracula Dark theme',
            exact: true,
          });
          await option.waitFor();
          assert.equal(await picker.getByRole('option').count(), 1);
          await search.press('ArrowDown');
          assert.ok(
            await option.evaluate(node => node === document.activeElement),
          );
          await search.focus();
          await search.press('Escape');
          assert.equal(await search.inputValue(), '');
          assert.ok((await picker.getByRole('option').count()) > 1);
        },
      );
    }
  });
  await feature('system-colour-mode', async () => {
    await fresh(
      {
        name: 'system-colour-mode',
        layout: 'inspector',
        viewport: {width: 1440, height: 900},
      },
      async ({page, doctor, settings}) => {
        const theme = colour =>
          page.locator(`html[data-cui-theme="${colour}"]`);
        await doctor();
        await page.emulateMedia({colorScheme: 'light'});
        await settings('appearance');
        const mode = page.locator('[data-setting="colour-mode"]');
        await mode.getByRole('radio', {name: /^System/}).press('Space');
        await theme('light').waitFor({state: 'attached'});
        await page.emulateMedia({colorScheme: 'dark'});
        await theme('dark').waitFor({state: 'attached'});
        await mode.getByRole('radio', {name: /^Light/}).press('Space');
        await theme('light').waitFor({state: 'attached'});
        await page.emulateMedia({colorScheme: 'light'});
        await page.emulateMedia({colorScheme: 'dark'});
        await page.evaluate(
          () =>
            new Promise(resolve => {
              requestAnimationFrame(() => requestAnimationFrame(resolve));
            }),
        );
        assert.equal(await theme('light').count(), 1);
      },
    );
  });
}
