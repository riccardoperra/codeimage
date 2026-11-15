export async function createMockContext(browser, base, options) {
  const context = await browser.newContext(options);
  try {
    // MSW unregisters its worker after the last controlled window closes.
    // A blank client keeps the registration stable across app reloads.
    const client = await context.newPage();
    const url = `${base}/__verify_client`;
    await client.route(url, route =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Verification client</title>',
      }),
    );
    await client.goto(url);
    return context;
  } catch (error) {
    await context.close();
    throw error;
  }
}
