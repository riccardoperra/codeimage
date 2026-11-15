// A fresh profile gets the release announcement a moment after the editor
// settles: the Showcase sheet for a major release, the Nudge card otherwise.
// It covers the editor, so every journey closes it first, the way a user would.
// The dismissal is stored per browser context, so one close per context is enough.
const settled = new WeakSet();

export async function dismissNews(page) {
  const context = page.context();
  if (settled.has(context)) return;
  settled.add(context);
  const news = page.locator(
    '[data-whats-new="showcase"], [data-whats-new="nudge"]',
  );
  try {
    await news.first().waitFor({timeout: 8000});
  } catch {
    // No release inside its 45-day window, or already dismissed.
    return;
  }
  const sheet = page.locator('[data-whats-new="showcase"]');
  if (await sheet.count())
    await page
      .locator('[role="dialog"], [role="alertdialog"]')
      .filter({has: sheet})
      .getByRole('button', {name: /^close$/i})
      .click();
  else
    await page
      .locator('[data-whats-new="nudge"]')
      .getByRole('button', {name: "Dismiss what's new", exact: true})
      .click();
  await news.first().waitFor({state: 'hidden'});
}
