import assert from 'node:assert/strict';
import {auditReadOnlyNotice} from './read-only-notice.mjs';
import {auditSnippets} from './snippets.mjs';

export async function verifyProjectSearch(page, row) {
  const name = row.getByText('Renamed verification', {exact: true});
  const search = page.getByPlaceholder('Search', {exact: true});
  await name.waitFor();
  await search.fill('zz');
  await name.waitFor();
  await search.fill('zzz');
  await name.waitFor({state: 'hidden'});
  await search.fill('RENAMED');
  await name.waitFor();
  await search.clear();
  await name.waitFor();
}

async function auditProjectMenuBridge({page}) {
  const errors = [];
  const captureError = error => errors.push(error.message);
  page.on('pageerror', captureError);
  try {
    await page
      .getByRole('button', {name: 'Sign in with GitHub', exact: true})
      .click();
    const create = page.getByRole('button', {name: 'New', exact: true}).first();
    const created = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/v1/project',
    );
    await create.click();
    const project = await (await created).json();
    await page.locator('.cm-content[contenteditable="true"]').first().waitFor();

    const dashboard = page.getByRole('link', {name: 'Dashboard', exact: true});
    await dashboard.click();
    const row = page
      .getByRole('listitem')
      .filter({has: page.locator(`a[href="/${project.id}"]`)});
    const trigger = row.getByRole('button', {name: 'Menu', exact: true});
    const menu = page.locator(
      '[role="menu"][data-cui="dropdown-menu-content"]',
    );
    const rename = menu.getByRole('menuitem', {name: 'Rename', exact: true});
    const focused = page.locator(':focus');
    await trigger.press('ArrowDown');
    await rename.and(focused).waitFor();
    assert.equal(await menu.evaluate(element => !element.closest('li')), true);
    await page.keyboard.press('Escape');
    await menu.waitFor({state: 'detached'});
    await trigger.and(focused).waitFor();

    await trigger.click();
    await rename.click();
    const dialog = page.getByRole('alertdialog', {name: 'Rename project'});
    await dialog.getByRole('textbox').fill('Renamed through the bridge');
    await menu.waitFor({state: 'detached'});
    const body = page.locator('body');
    assert.equal(
      await body.evaluate(element => element.style.pointerEvents),
      'none',
    );
    const renamed = page.waitForResponse(
      response =>
        response.request().method() === 'PUT' &&
        new URL(response.url()).pathname ===
          `/api/v1/project/${project.id}/name`,
    );
    await dialog.getByRole('button', {name: 'Confirm', exact: true}).click();
    assert.ok((await renamed).ok());
    await dialog.waitFor({state: 'detached'});
    assert.notEqual(
      await body.evaluate(element => element.style.pointerEvents),
      'none',
    );
    await row.getByText('Renamed through the bridge', {exact: true}).waitFor();

    await trigger.click();
    const cloned = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname ===
          `/api/v1/project/${project.id}/clone`,
    );
    await menu.getByRole('menuitem', {name: 'Clone', exact: true}).click();
    const cloneResponse = await cloned;
    assert.ok(cloneResponse.ok());
    const clone = await cloneResponse.json();
    assert.notEqual(clone.id, project.id);
    await page.waitForURL(url => url.pathname === `/${clone.id}`);
    await page.locator('.cm-content[contenteditable="true"]').first().waitFor();
    await menu.waitFor({state: 'detached'});
    await dashboard.click();
    await row.getByText('Renamed through the bridge', {exact: true}).waitFor();
    await trigger.click();
    await menu.getByRole('menuitem', {name: 'Delete', exact: true}).click();
    const confirm = page.getByRole('alertdialog', {name: 'Delete project'});
    const removed = page.waitForResponse(
      response =>
        response.request().method() === 'DELETE' &&
        new URL(response.url()).pathname === `/api/v1/project/${project.id}`,
    );
    await confirm.getByRole('button', {name: 'Confirm', exact: true}).click();
    assert.ok((await removed).ok());
    await row.waitFor({state: 'detached'});
    assert.deepEqual(errors, []);
    return {projectId: project.id, actions: ['rename', 'clone', 'delete']};
  } finally {
    page.off('pageerror', captureError);
  }
}

export async function auditSavedProjects(options) {
  await auditSnippets(options);
  const requested = process.env.VERIFY_CASES?.split(',').map(name =>
    name.trim(),
  );
  for (const [name, audit] of [
    ['read-only-notice', auditReadOnlyNotice],
    ['solid1-bridge-project-menu', auditProjectMenuBridge],
  ]) {
    if (!requested?.includes(name)) continue;
    await options.feature(name, () =>
      options.fresh(
        {name, layout: 'inspector', viewport: {width: 1440, height: 900}},
        async ({page, doctor}) => {
          await doctor('/', 'editor', 'inspector');
          return audit({page, base: options.base});
        },
      ),
    );
  }
}
