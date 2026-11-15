// node apps/codeimage/src/prototypes/editor-controls/verify-i18n.mjs [base URL] [screenshot directory]
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {dictionaries, flatten} from './verify-locale-parity.mjs';
const base = process.argv[2] ?? 'http://localhost:4343';
const output = process.argv[3];
if (output) mkdirSync(output, {recursive: true});
const browser = await chromium.launch();
const errors = [];
const allEnglish = flatten(dictionaries.en);
const routes = [
  ['inspector', 2],
  ['dock', 3],
  ['studio', 4],
];

async function noEnglish(page, locale, surface) {
  if (locale === 'en') return;
  const messages = flatten(dictionaries[locale]);
  const permitted = new Set(Object.values(messages));
  const forbidden = [
    ...new Set(
      Object.entries(allEnglish)
        .filter(
          ([key, value]) =>
            !key.startsWith('dashboard.') &&
            !value.includes('{{') &&
            value !== messages[key] &&
            !permitted.has(value),
        )
        .map(([, value]) => value),
    ),
  ];
  const leftovers = await page.evaluate(forbidden => {
    const bad = new Set(forbidden);
    const found = new Set();
    const visible = element =>
      element.checkVisibility() &&
      !element.closest(
        '[inert], [aria-hidden=true], [data-frame-content], .cm-editor, [class*=previewPortal]',
      );
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element)) continue;
      for (const attribute of ['aria-label', 'title', 'placeholder']) {
        const value = element.getAttribute(attribute)?.trim();
        if (bad.has(value)) found.add(`${attribute}: ${value}`);
      }
      for (const child of element.childNodes) {
        if (
          child.nodeType === Node.TEXT_NODE &&
          bad.has(child.textContent.trim())
        )
          found.add(child.textContent.trim());
      }
    }
    return [...found];
  }, forbidden);
  assert.deepEqual(leftovers, [], `${locale} ${surface}: English leftovers`);
}
async function ready(page) {
  await page.waitForSelector('.unified-editor [data-fit-scale]', {
    timeout: 60000,
  });
  await page.waitForTimeout(2500);
  const close = page.getByRole('button', {name: /^close$/i}).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.getByRole('dialog').waitFor({state: 'hidden'});
  }
}
async function settings(page) {
  await page.locator('[data-settings-trigger]').click();
  await page.locator('[data-settings-section=general]').click();
}
async function closeStudioPanel(page, name) {
  await page.getByRole('button', {name, exact: true}).click();
  await page.locator('#studio-panel').waitFor({state: 'hidden'});
}
async function expandInspector(page, messages) {
  const expand = page.getByRole('button', {
    name: messages.editor.expandInspector,
    exact: true,
  });
  if (await expand.isVisible()) await expand.click();
}
async function openPanel(page, layout, messages) {
  if (layout === 'inspector') {
    await expandInspector(page, messages);
    const frame = page.locator('[data-section=frame] > button');
    if ((await frame.getAttribute('aria-expanded')) !== 'true')
      await frame.click();
  }
  if (layout === 'dock')
    await page.locator('button[data-panel=background]').click();
  if (layout === 'studio')
    await page
      .getByRole('button', {name: messages.frame.frame, exact: true})
      .click();
  await page.waitForTimeout(400);
}

try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    for (const [layout, variant] of routes) {
      const ctx = await browser.newContext({
        viewport: {width, height},
        colorScheme: 'dark',
      });
      const page = await ctx.newPage();
      page.on('pageerror', error => {
        if (!/reading 'url'/.test(error.message)) errors.push(error.message);
      });
      await page.goto(`${base}/?v=${variant}`, {waitUntil: 'load'});
      await page.reload({waitUntil: 'load'});
      await ready(page);
      let current = 'en';
      for (const locale of ['it', 'de', 'es', 'en']) {
        const messages = dictionaries[locale];
        await settings(page);
        await page
          .locator('[data-setting=language]')
          .getByRole('tab', {
            name: dictionaries[current].locales[locale],
            exact: true,
          })
          .click();
        current = locale;
        await page
          .getByRole('navigation', {name: messages.editor.settingsSections})
          .waitFor();
        assert.equal(
          await page
            .locator('[data-setting=language] [id$=-title]')
            .innerText(),
          messages.editor.language,
        );
        for (const section of [
          'general',
          'appearance',
          'export',
          'experiments',
          'about',
        ]) {
          await page.locator(`[data-settings-section=${section}]`).click();
          await noEnglish(
            page,
            locale,
            `${layout}/${width} settings:${section}`,
          );
        }
        const search = page.getByRole('textbox', {
          name: messages.editor.searchSettings,
        });
        await search.fill('zz-no-result-zz');
        await page
          .getByText(
            messages.editor.noSettings.replace('{{query}}', 'zz-no-result-zz'),
            {exact: true},
          )
          .waitFor();
        await noEnglish(page, locale, 'settings empty state');
        await page
          .getByRole('button', {name: messages.common.close, exact: true})
          .click();
        if (layout === 'inspector') {
          const collapse = page.getByRole('button', {
            name: messages.editor.collapseInspector,
            exact: true,
          });
          if (await collapse.isVisible()) await collapse.click();
        }
        await noEnglish(page, locale, `${layout}/${width} header`);
        if (layout === 'dock' && width === 390) {
          const labels = await page
            .locator('button[data-panel]')
            .evaluateAll(buttons =>
              buttons.map(button => {
                const box = button.getBoundingClientRect();
                const label = button
                  .querySelector('[data-dock-label]')
                  .getBoundingClientRect();
                return {
                  name: button.getAttribute('aria-label'),
                  width: box.width,
                  fits:
                    label.left >= box.left - 1 && label.right <= box.right + 1,
                };
              }),
            );
          assert(
            labels.length === 6 &&
              labels.every(label => label.width >= 40 && label.fits),
            `${locale}: phone Dock labels fit their touch targets: ${JSON.stringify(labels)}`,
          );
        }

        await page.locator('[data-export-menu]:visible').first().click();
        await page
          .getByRole('menuitem', {
            name: messages.editor.exportSettings,
            exact: true,
          })
          .waitFor();
        await noEnglish(page, locale, `${layout}/${width} export menu`);
        await page.keyboard.press('Escape');
        await page.keyboard.press('Meta+k');
        await page.locator('[data-command-menu]').waitFor();
        const commands = page.getByRole('combobox', {
          name: messages.editor.searchOptions,
        });
        await noEnglish(page, locale, `${layout}/${width} commands`);
        await commands.fill(messages.editor.settings);
        await page
          .getByRole('option', {
            name: messages.editor.settingSection.replace(
              '{{value}}',
              messages.editor.general,
            ),
            exact: true,
          })
          .waitFor();
        await commands.fill('zz-no-result-zz');
        await page
          .getByText(
            messages.editor.noCommand.replace('{{query}}', 'zz-no-result-zz'),
            {exact: true},
          )
          .waitFor();
        await page.keyboard.press('Escape');
        if (layout === 'inspector') {
          await expandInspector(page, messages);
          const themes = page.locator('[data-section=themes] > button');
          if ((await themes.getAttribute('aria-expanded')) !== 'true')
            await themes.click();
        }
        if (layout === 'dock')
          await page.locator('button[data-panel=themes]').click();
        if (layout === 'studio') {
          const themes = page.getByRole('button', {
            name: messages.bottomBar.themes,
            exact: true,
          });
          if ((await themes.getAttribute('aria-expanded')) !== 'true')
            await themes.click();
        }
        const themeSearch = page.getByRole('textbox', {
          name: messages.editor.searchThemes,
          exact: true,
        });
        await themeSearch.fill('zz-no-theme-zz');
        await page
          .getByText(
            messages.editor.noTheme.replace('{{query}}', 'zz-no-theme-zz'),
            {exact: true},
          )
          .waitFor();
        await noEnglish(page, locale, `${layout}/${width} theme picker`);
        await page
          .getByRole('button', {name: messages.editor.showThemes, exact: true})
          .focus();
        await page.keyboard.press('Enter');
        if (layout === 'dock') await page.keyboard.press('Escape');
        if (layout === 'studio')
          await closeStudioPanel(
            page,
            messages.editor.closePanel.replace(
              '{{panel}}',
              messages.bottomBar.themes,
            ),
          );
        await openPanel(page, layout, messages);
        await noEnglish(page, locale, `${layout}/${width} panel`);
        if (output && locale === 'it') {
          await page.reload({waitUntil: 'load'});
          await ready(page);
          await openPanel(page, layout, messages);
          await page.screenshot({path: `${output}/${layout}-${width}.png`});
        }
        if (layout === 'dock') await page.keyboard.press('Escape');
        if (layout === 'studio')
          await closeStudioPanel(
            page,
            messages.editor.closePanel.replace(
              '{{panel}}',
              messages.frame.frame,
            ),
          );
        console.log(
          `PASS ${locale} ${layout} ${width}x${height}: language switched in Settings; settings, header, export, commands, panel.`,
        );
      }
      await ctx.close();
    }
  }
  assert.deepEqual(errors, [], 'Browser errors');
} finally {
  await browser.close();
}
