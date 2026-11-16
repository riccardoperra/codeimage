import {setupServer} from 'msw/node';
import {expect, test, vi} from 'vitest';

vi.mock('./persist', () => ({persistDb: async () => undefined}));

test('mock projects keep terminal colours through creation, updates and reads', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost');
  const {default: handlers} = await import('./projectMockHandlers');
  const server = setupServer(...handlers);
  server.listen({onUnhandledRequest: 'error'});
  const body = {
    name: 'Preset persistence',
    editorOptions: {
      themeId: 'dracula',
      fontId: 'jetbrains-mono',
      fontWeight: 400,
      showLineNumbers: false,
    },
    editors: [
      {
        id: 'editor',
        code: 'const preset = true;',
        tabName: 'index.ts',
        languageId: 'typescript',
        lineNumberStart: 1,
      },
    ],
    frame: {
      padding: 128,
      background: '#abcdef',
      visible: true,
      opacity: 100,
      radius: 8,
    },
    terminal: {
      background: '#282a36',
      textColor: '#BD93F9',
      type: 'macOs',
      showHeader: true,
      showWatermark: false,
    },
  };
  try {
    const response = await fetch('http://localhost/api/v1/project', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(body),
    });
    expect(response.ok).toBe(true);
    const created: unknown = await response.json();
    expect(created).toMatchObject({terminal: body.terminal});
    if (
      !created ||
      typeof created !== 'object' ||
      !('id' in created) ||
      typeof created.id !== 'string'
    )
      throw new Error('Missing created project id');
    const url = `http://localhost/api/v1/project/${created.id}`;
    const terminal = {
      ...body.terminal,
      background: '#041c31',
      textColor: '#d6deeb',
    };
    const updated = await fetch(url, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({...body, terminal}),
    });
    expect(updated.ok).toBe(true);
    expect(await updated.json()).toMatchObject({terminal});
    expect(await (await fetch(url)).json()).toMatchObject({terminal});
  } finally {
    server.close();
    vi.unstubAllEnvs();
  }
});
