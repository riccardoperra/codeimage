// A fresh profile gets the release announcement about 700 ms after the editor
// settles: the Showcase sheet for a major release, the Nudge card otherwise.
// It covers the editor, so the baseline, the doctor and fresh-context cases
// close it first, the way a user would, and let its exit finish before typing.
// The flag keeps later doctor calls in the same tab from waiting for it again.
const FLAG = 'verify:startup-dismissed';

export async function dismissNews(page) {
  const firstVisit = await page.evaluate(
    flag => !sessionStorage.getItem(flag),
    FLAG,
  );
  if (firstVisit)
    await page
      .locator('[data-whats-new="showcase"], [data-whats-new="nudge"]')
      .first()
      .waitFor({timeout: 15000});
  const close = page.getByRole('button', {name: /^close$/i});
  if (await close.isVisible()) await close.click();
  await page.locator('[data-whats-new="showcase"]').waitFor({state: 'hidden'});
  const dismiss = page.getByRole('button', {
    name: "Dismiss what's new",
    exact: true,
  });
  if (await dismiss.isVisible()) {
    await dismiss.click();
    await page.locator('[data-whats-new="nudge"]').waitFor({state: 'hidden'});
  }
  await page.evaluate(flag => sessionStorage.setItem(flag, 'true'), FLAG);
}
