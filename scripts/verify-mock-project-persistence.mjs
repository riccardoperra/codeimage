import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const baseURL = process.env.BASE_URL ?? 'http://localhost:4420';
const output = process.env.ARTIFACT_DIR ?? '/tmp/swarm-mockdb';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
});
const context = await browser.newContext({
  viewport: {width: 1440, height: 1000},
});
await context.addInitScript(() => {
  sessionStorage.setItem('_mockAuth', JSON.stringify({authenticated: true}));
});
const page = await context.newPage();
page.setDefaultTimeout(120_000);
page.setDefaultNavigationTimeout(120_000);

async function api(path = '', method = 'GET', body, owner) {
  return page.evaluate(
    async ({path, method, body, owner}) => {
      const response = await fetch(`/api/v1/project${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(owner ? {'auth-mock-user-id': owner} : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {status: response.status, body: await response.json()};
    },
    {path, method, body, owner},
  );
}

function projectResponse(method, path) {
  return page.waitForResponse(
    response =>
      response.request().method() === method &&
      new URL(response.url()).pathname === `/api/v1/project${path}`,
  );
}

async function reloadProject(id, filename, code) {
  const loaded = projectResponse('GET', `/${id}`);
  await page.reload();
  const response = await loaded;
  const data = await response.json();
  console.log(
    `Reload GET ${response.status()} ${data?.id ? 'project' : JSON.stringify(data)}`,
  );
  if (!data?.id) {
    await page.waitForURL('**/404');
    await page
      .getByText('The resource you are looking for does not exists')
      .waitFor();
    await page.screenshot({path: join(output, filename), fullPage: true});
    assert.fail('Saved project disappeared after reload');
  }
  assert.equal(data.id, id);
  assert.equal(data.editorTabs[0].code, code);
  await page.locator('.cm-content[contenteditable="true"]').first().waitFor();
  assert.match(
    await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .innerText(),
    /mockPersistence/,
  );
  await page.screenshot({path: join(output, filename), fullPage: true});
  return data;
}

try {
  const mockReady = page.waitForEvent('console', message =>
    message.text().includes('[MSW] Mocking enabled.'),
  );
  await page.goto(baseURL);
  await mockReady;
  const created = projectResponse('POST', '');
  await page.getByRole('button', {name: 'New', exact: true}).first().click();
  const project = await (await created).json();
  assert.ok(project.id);
  await page.locator('.cm-content[contenteditable="true"]').first().waitFor();
  console.log('PASS create and open');

  const code = 'const mockPersistence = "saved before reload";';
  await page.keyboard.press('Escape');
  const [saved] = await Promise.all([
    projectResponse('PUT', `/${project.id}`),
    page.locator('.cm-content[contenteditable="true"]').first().fill(code),
  ]);
  assert.equal(saved.status(), 200);
  assert.equal((await api(`/${project.id}`)).body.editorTabs[0].code, code);
  await page.screenshot({path: join(output, 'saved.png'), fullPage: true});
  console.log('PASS save and get-by-id');

  await reloadProject(project.id, 'reloaded.png', code);
  console.log('PASS reload preserves saved code');

  const lateContext = await browser.newContext({
    viewport: {width: 1440, height: 1000},
    storageState: await context.storageState({indexedDB: true}),
  });
  await lateContext.addInitScript(() => {
    sessionStorage.setItem('_mockAuth', JSON.stringify({authenticated: true}));
  });
  const latePage = await lateContext.newPage();
  latePage.setDefaultTimeout(120_000);
  latePage.setDefaultNavigationTimeout(120_000);
  let lateStarts = 0;
  await latePage.route(
    url => url.pathname === '/src/mocks/browser.ts',
    async route => {
      await latePage.waitForFunction(() => document.readyState === 'complete');
      lateStarts++;
      await route.continue();
    },
  );
  await latePage.goto(`${baseURL}/${project.id}`);
  const lateEditor = latePage
    .locator('.cm-content[contenteditable="true"]')
    .first();
  await lateEditor.waitFor();
  assert.equal(await lateEditor.innerText(), code);
  assert.equal(lateStarts, 1);
  await latePage.screenshot({
    path: join(output, 'late-start.png'),
    fullPage: true,
  });
  await lateContext.close();
  console.log('PASS mock startup after the load event');

  const renamed = await api(`/${project.id}/name`, 'PUT', {
    name: 'Mock persistence verified',
  });
  assert.equal(renamed.status, 200);
  assert.equal(
    (await api(`/${project.id}`, 'DELETE', undefined, 'another-user')).status,
    404,
  );
  const listed = projectResponse('GET', '');
  await page.goto(baseURL);
  const projects = await (await listed).json();
  assert.ok(
    projects.some(
      item =>
        item.id === project.id && item.name === 'Mock persistence verified',
    ),
  );
  await page.getByText('Mock persistence verified', {exact: true}).waitFor();
  await page.screenshot({path: join(output, 'dashboard.png'), fullPage: true});
  await page.locator(`a[href="/${project.id}"]`).click();
  await page.locator('.cm-content[contenteditable="true"]').first().waitFor();
  assert.match(
    await page
      .locator('.cm-content[contenteditable="true"]')
      .first()
      .innerText(),
    /mockPersistence/,
  );
  await page.screenshot({path: join(output, 'reopened.png'), fullPage: true});
  console.log('PASS rename, list, owner isolation, and reopen');

  const clone = await api(`/${project.id}/clone`, 'POST', {newName: 'Clone'});
  assert.equal(clone.status, 200);
  assert.ok(clone.body.id);
  assert.notEqual(clone.body.id, project.id);
  const listedClones = projectResponse('GET', '');
  await page.goto(baseURL);
  assert.ok(
    (await (await listedClones).json()).some(item => item.id === clone.body.id),
  );
  assert.equal((await api(`/${clone.body.id}`)).body.editorTabs[0].code, code);
  assert.equal((await api(`/${clone.body.id}`, 'DELETE')).status, 200);
  console.log('PASS clone survives immediate navigation');

  assert.equal((await api(`/${project.id}`, 'DELETE')).status, 200);
  await page.goto(baseURL);
  await page.getByRole('heading', {name: 'My projects'}).waitFor();
  assert.equal((await api(`/${project.id}`)).status, 404);
  assert.ok(!(await api()).body.some(item => item.id === project.id));
  assert.equal(
    (await api(`/${project.id}/name`, 'PUT', {name: 'Missing'})).status,
    404,
  );
  assert.equal((await api(`/${project.id}`, 'DELETE')).status, 404);
  console.log('PASS delete survives reload and missing projects return 404');
} catch (error) {
  await page.screenshot({path: join(output, 'failure.png'), fullPage: true});
  throw error;
} finally {
  await browser.close();
}
