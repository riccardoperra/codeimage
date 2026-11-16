const numbersGutter =
  '.cm-editor:has(.cm-content[contenteditable=true]) .cm-lineNumbers';

export const lineNumberVariants = [
  ['off', false],
  ['on', true],
];

export async function setLineNumbers(page, on) {
  const shown = async () => (await page.locator(numbersGutter).count()) > 0;
  if ((await shown()) !== on) {
    await page.keyboard.press('ControlOrMeta+k');
    const search = page.getByRole('combobox', {
      name: 'Search themes and options',
      exact: true,
    });
    await search.fill('Line number');
    await page
      .getByRole('option', {name: /^Toggle Line number/})
      .first()
      .click();
    await search.waitFor({state: 'hidden'});
  }
  await page
    .locator(numbersGutter)
    .first()
    .waitFor({state: on ? 'attached' : 'detached'});
}
