import {describe, expect, it, vi} from 'vitest';
import type {ListedModel} from '../command-menu/listed-model';
import type {EditorControlsModel, SelectControl, ToggleControl} from '../model';
import type {AgentToolsContext} from './tools';
import {SYSTEM_PROMPT} from '../local-ai/agent';
import {stepSchema} from '../local-ai/structured-provider';
import {copyName, createAgentTools, createEditorBrief} from './tools';

const editors = {
  state: {
    activeEditorId: 'a',
    editors: [
      {
        id: 'a',
        code: 'const a = 1;',
        languageId: 'typescript',
        tab: {tabName: 'index.ts'},
      },
      {
        id: 'b',
        code: 'print(1)',
        languageId: 'python',
        tab: {tabName: 'main.py'},
      },
    ],
  },
  isActive: (id: string) => editors.state.activeEditorId === id,
  actions: {
    setActiveEditorId: vi.fn(),
    addEditor: vi.fn((editor: object, active: boolean) => {
      const id = `copy-${editors.state.editors.length}`;
      editors.state.editors.push({...editor, id} as never);
      if (active) editors.state.activeEditorId = id;
    }),
  },
  computed: {canAddEditor: () => editors.state.editors.length < 6},
};

const animation = {
  state: {open: false},
  open: () => animation.state.open,
  actions: {
    setOpen: vi.fn((open: boolean) => (animation.state.open = open)),
  },
};
const setCode = vi.fn();

vi.mock('@codeimage/store/editor', () => ({
  getRootEditorStore: () => editors,
  getEditorStore: () => ({animation}),
}));
vi.mock('@codeimage/store/editor/activeEditor', () => ({
  getActiveEditorStore: () => ({
    editor: () => editors.state.editors[0],
    setCode,
  }),
}));

const padding: SelectControl = {
  kind: 'select',
  id: 'frame.padding',
  label: () => 'Padding',
  visible: () => true,
  disabled: () => false,
  options: () => ['16', '32', '64'].map(key => ({key, label: key})),
  value: () => '32',
  set: vi.fn(),
  preview: vi.fn(),
};
const lineNumbers: ToggleControl = {
  kind: 'toggle',
  id: 'editor.lineNumbers',
  label: () => 'Line numbers',
  visible: () => true,
  value: () => false,
  set: vi.fn(),
  preview: vi.fn(),
};

const context = {
  model: {
    themes: () => [
      {id: 'dracula', name: 'Dracula', dark: true, active: () => true},
      {id: 'nightOwlTheme', name: 'Night Owl', dark: true, active: () => false},
    ],
  } as unknown as EditorControlsModel,
  listed: {
    sections: [{controls: [padding, lineNumbers]}],
    choice: () => undefined,
  } as unknown as ListedModel,
  exporter: {secrets: () => 0} as unknown as AgentToolsContext['exporter'],
  pageState: () => ({editable: true, ready: true}) as never,
};

const tools = createAgentTools(context);
const run = (name: string, input: unknown) =>
  tools.find(tool => tool.name === name)!.execute(input);

describe('read_tab', () => {
  it("reads another tab's code by name without selecting it", async () => {
    expect(await run('read_tab', {name: 'MAIN.PY'})).toEqual({
      ok: true,
      tab: {index: 1, name: 'main.py', language: 'python', active: false},
      code: 'print(1)',
    });
    expect(editors.actions.setActiveEditorId).not.toHaveBeenCalled();
    expect(tools.find(tool => tool.name === 'read_tab')?.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
    });
  });

  it('reads the active tab when given neither name nor index', async () => {
    expect(await run('read_tab', {})).toEqual({
      ok: true,
      tab: {index: 0, name: 'index.ts', language: 'typescript', active: true},
      code: 'const a = 1;',
    });
  });

  it('lists the tabs for an unknown one', async () => {
    const result = await run('read_tab', {name: 'nope.rs'});
    expect(result).toMatchObject({
      ok: false,
      tabs: [{name: 'index.ts'}, {name: 'main.py'}],
    });
    expect(!result.ok && result.error).toContain(
      '0 "index.ts" (active), 1 "main.py"',
    );
  });
});

describe('set_controls', () => {
  it('takes flat setting names as its arguments', async () => {
    expect(
      tools.find(tool => tool.name === 'set_controls')?.inputSchema,
    ).toMatchObject({
      properties: {
        frame_padding: {type: 'string', enum: ['16', '32', '64']},
        editor_line_numbers: {type: 'boolean'},
      },
    });
    expect(
      await run('set_controls', {frame_padding: 64, editor_line_numbers: true}),
    ).toEqual({
      ok: true,
      applied: {frame_padding: '64', editor_line_numbers: true},
    });
    expect(padding.set).toHaveBeenCalledWith('64');
    expect(lineNumbers.set).toHaveBeenCalledWith(true);
  });

  it('rejects dotted, nested and empty input by name', async () => {
    expect(
      await run('set_controls', {
        frame: {frame_padding: 3},
        'frame.padding': 64,
      }),
    ).toMatchObject({
      ok: false,
      applied: {},
      errors: {frame: expect.any(String), 'frame.padding': expect.any(String)},
    });
    expect(await run('set_controls', {})).toMatchObject({ok: false});
  });
});

describe('createEditorBrief', () => {
  it('gives the tabs, the theme, each setting by name and the theme names', () => {
    expect(createEditorBrief(context)()).toEqual({
      tab: {name: 'index.ts', language: 'typescript'},
      tabs: ['index.ts', 'main.py'],
      theme: 'Dracula',
      settings: {frame_padding: '32', editor_line_numbers: false},
      animate: false,
      themes: ['Dracula', 'Night Owl'],
    });
  });
});

describe('set_code', () => {
  it('returns the tab it wrote with its editor id, for the row to format', async () => {
    expect(await run('set_code', {code: 'let b = 2;'})).toMatchObject({
      ok: true,
      tab: {id: 'a', index: 0, name: 'index.ts'},
    });
    expect(setCode).toHaveBeenCalledWith('let b = 2;');
  });
});

describe('set_animate_mode', () => {
  it('opens and closes the Animate panel, and repeats without harm', async () => {
    expect(await run('set_animate_mode', {open: true})).toEqual({
      ok: true,
      open: true,
    });
    expect(await run('set_animate_mode', {open: true})).toEqual({
      ok: true,
      open: true,
    });
    expect(createEditorBrief(context)()).toMatchObject({animate: true});
    expect(await run('set_animate_mode', {open: false})).toEqual({
      ok: true,
      open: false,
    });
  });

  it('takes only a boolean', async () => {
    expect(await run('set_animate_mode', {open: 'yes'})).toMatchObject({
      ok: false,
    });
    expect(animation.actions.setOpen).not.toHaveBeenCalledWith('yes');
  });
});

describe('duplicate_tab', () => {
  it('names a copy after its source', () => {
    expect(copyName('index.tsx')).toBe('index copy.tsx');
    expect(copyName('Makefile')).toBe('Makefile copy');
    expect(copyName('.env')).toBe('.env copy');
    expect(copyName('')).toBe('');
  });

  it('copies the active tab, code and language included, and selects the copy', async () => {
    const before = editors.state.editors.length;
    const result = await run('duplicate_tab', {});
    expect(result).toMatchObject({
      ok: true,
      tab: {name: 'index copy.ts', language: 'typescript', active: true},
    });
    const copy = editors.state.editors.at(-1)!;
    expect(editors.state.editors).toHaveLength(before + 1);
    expect(copy.code).toBe(editors.state.editors[0].code);
    expect(result.ok && (result.tab as {id: string}).id).toBe(copy.id);
    editors.state.editors.splice(before);
    editors.state.activeEditorId = 'a';
  });

  it('copies a named tab under a given name, and refuses past the limit', async () => {
    expect(
      await run('duplicate_tab', {name: 'main.py', newName: 'other.py'}),
    ).toMatchObject({ok: true, tab: {name: 'other.py', language: 'python'}});
    while (editors.state.editors.length < 6)
      await run('duplicate_tab', {index: 0});
    expect(await run('duplicate_tab', {})).toMatchObject({ok: false});
    expect(editors.state.editors).toHaveLength(6);
    editors.state.editors.splice(2);
    editors.state.activeEditorId = 'a';
  });
});

describe('the system prompt', () => {
  it('names only tools that exist, and names the ones its recipes need', () => {
    const named = new Set(
      SYSTEM_PROMPT.match(
        /\b(?:get|list|set|add|select|read|apply|export|duplicate)_[a-z_]+\b/g,
      ),
    );
    const registry = new Set(tools.map(tool => tool.name));
    expect([...named].filter(name => !registry.has(name))).toEqual([]);
    expect([...named].sort()).toEqual(
      [
        'add_tab',
        'apply_theme',
        'duplicate_tab',
        'export_image',
        'get_editor_state',
        'read_tab',
        'select_tab',
        'set_animate_mode',
        'set_code',
        'set_controls',
      ].sort(),
    );
  });
});

describe('structured steps', () => {
  it('give every tool its own branch', () => {
    const {oneOf} = stepSchema(tools, true) as {
      oneOf: {properties: {name?: {enum: string[]}}}[];
    };
    expect(oneOf.flatMap(branch => branch.properties.name?.enum ?? [])).toEqual(
      tools.map(tool => tool.name),
    );
  });
});
