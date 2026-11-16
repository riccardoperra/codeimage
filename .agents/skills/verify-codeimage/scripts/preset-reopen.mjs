export async function auditPresets({page, doctor, editor, shot}) {
  await doctor('/', 'editor', 'studio');
  await page.getByRole('button', {name: 'Presets', exact: true}).click();
  await page
    .getByRole('button', {name: 'Add preset', exact: true})
    .first()
    .click();
  const dialog = page.getByRole('alertdialog', {
    name: 'Add a new preset',
    exact: true,
  });
  await dialog.getByRole('textbox').fill('Verification preset');
  await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
  await page.locator('li').filter({hasText: 'Verification preset'}).waitFor();
  await page.reload();
  await editor().waitFor();
  await page.getByRole('button', {name: 'Presets', exact: true}).click();
  await page.locator('li').filter({hasText: 'Verification preset'}).click();
  await shot('preset-reopened');
}
