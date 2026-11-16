import {dismissNews} from '../news.mjs';
export async function editProject({page, base, scenario}) {
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page
    .locator('.cm-content[contenteditable="true"]')
    .first()
    .waitFor({timeout: 120_000});
  await dismissNews(page);
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator('[data-section="window"] > button');
  if ((await section.getAttribute('aria-expanded')) !== 'true')
    await section.click();
  await page
    .locator('[data-control="window.style"]')
    .getByRole('button')
    .click();
  await page.getByRole('radio', {name: 'Editor', exact: true}).press('Space');
  await page
    .getByRole('dialog', {name: 'Window', exact: true})
    .getByRole('button', {name: 'Close', exact: true})
    .click();
  const strip = page
    .locator('[data-window-tabs]')
    .filter({has: page.getByRole('button', {name: 'Add tab', exact: true})})
    .first();
  const codes = [
    'let a = 1;',
    [
      ...Array.from({length: 11}, (_, i) => `const row${i} = ${i};`),
      'const lastLine = "BOTTOM_SENTINEL_WWWWWWWWWWWWW";',
    ].join('\n'),
  ];
  for (const [index, code] of codes.entries()) {
    if (index)
      await strip.getByRole('button', {name: 'Add tab', exact: true}).click();
    await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .fill(code);
    await page.waitForFunction(
      code =>
        [
          ...document.querySelectorAll(
            '.cm-content[contenteditable="true"] .cm-line',
          ),
        ]
          .map(line => line.textContent)
          .join('\n') === code,
      code,
    );
  }
  const frame = page.locator('[data-section="frame"] > button');
  if ((await frame.getAttribute('aria-expanded')) !== 'true')
    await frame.click();
  if (scenario === 'hidden')
    await page
      .getByRole('switch', {name: 'Visible', exact: true})
      .press('Space');
  if (scenario === 'signature') {
    await page.locator('#signature-options').click();
    await page
      .getByPlaceholder('@handle or profile link', {exact: true})
      .fill('@step_size');
    await page.keyboard.press('Escape');
  }

  return codes;
}
