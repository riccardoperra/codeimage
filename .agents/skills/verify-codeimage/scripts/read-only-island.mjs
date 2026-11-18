import assert from 'node:assert/strict';
import {createProject, makeReadOnly, ready} from './snippets.mjs';

async function pauseClone(page, id) {
  await page.evaluate(async projectId => {
    const {worker} = await import('/src/mocks/browser.ts');
    const {http} = await import('/node_modules/msw/lib/core/index.mjs');
    const paused = new Promise(resolve => {
      window.__verifyReleaseReadOnlyClone = () => {
        delete window.__verifyReleaseReadOnlyClone;
        resolve();
      };
    });
    worker.use(
      http.post(`*/api/v1/project/${projectId}/clone`, async () => {
        await paused;
      }),
    );
  }, id);
}

export async function auditReadOnlyIsland({page, base}) {
  const project = await createProject(page, base);
  await makeReadOnly(page, project.id);
  const island = page.locator('[data-solid2-island="read-only-notice"]');
  const banner = island.locator('[data-read-only-banner]');
  await banner.waitFor();
  await banner.getByRole('button', {name: 'Clone', exact: true}).waitFor();

  await page.locator('[data-settings-trigger]:visible').first().click();
  await page.locator('[data-settings-section=general]').click();
  await page
    .locator('[data-setting=language]')
    .getByRole('tab', {name: 'Italian', exact: true})
    .click();
  await page.keyboard.press('Escape');
  await page.locator('[data-settings]').waitFor({state: 'hidden'});
  const cloneButton = banner.getByRole('button', {name: 'Clona', exact: true});
  await cloneButton.waitFor();
  await pauseClone(page, project.id);

  const matchesClone = request =>
    request.method() === 'POST' &&
    new URL(request.url()).pathname === `/api/v1/project/${project.id}/clone`;
  const requests = [];
  const collect = request => {
    if (matchesClone(request)) requests.push(request);
  };
  page.on('request', collect);
  try {
    const requested = page.waitForRequest(matchesClone);
    const responded = page.waitForResponse(response =>
      matchesClone(response.request()),
    );
    await cloneButton.press('Enter');
    await requested;
    await cloneButton.and(page.locator(':disabled')).waitFor();
    await page.evaluate(() => window.__verifyReleaseReadOnlyClone());
    const response = await responded;
    assert.ok(response.ok());
    const clone = await response.json();
    await page.waitForURL(url => url.pathname === `/${clone.id}`);
    await ready(page);
    await island.waitFor({state: 'detached'});
    assert.equal(requests.length, 1);
    assert.notEqual(clone.id, project.id);
    return {
      layout: 'inspector',
      cloneRequests: requests.length,
      translatedCloneButton: 'Clona',
    };
  } finally {
    await page.evaluate(() => window.__verifyReleaseReadOnlyClone?.());
    page.off('request', collect);
  }
}
