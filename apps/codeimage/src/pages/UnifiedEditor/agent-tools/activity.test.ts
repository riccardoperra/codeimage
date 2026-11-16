import {afterEach, describe, expect, it} from 'vitest';
import type {SummaryWords} from './activity';
import {activity, MAX_CALLS, summarize, withActivity} from './activity';
import type {AgentTool, ToolResult} from './tools';

const words: SummaryWords = {
  lines: count => `${count} lines`,
  tabs: count => `${count} tabs`,
  toggle: on => (on ? 'on' : 'off'),
  delivery: delivery => delivery.replace('_', ' '),
};

const tool = (
  name: string,
  execute: (input: unknown) => Promise<ToolResult>,
  readOnly = false,
): AgentTool => ({
  name,
  title: name,
  description: '',
  inputSchema: {},
  annotations: {readOnlyHint: readOnly},
  execute,
});

afterEach(() => activity.clear());

describe('summarize', () => {
  it('counts the lines of the code and never repeats it', () => {
    const summary = summarize(
      'set_code',
      {code: 'const secret = "hunter2";\nexport {secret};', language: 'TS'},
      words,
    );
    expect(summary).toBe('TS · 2 lines');
    expect(summary).not.toContain('hunter2');
  });

  it('names a new tab, its language and its lines', () => {
    expect(
      summarize(
        'add_tab',
        {code: 'print(1)', language: 'Python', name: 'main'},
        words,
      ),
    ).toBe('main · Python · 1 lines');
  });

  it('sums up the editor state the bar gave the model', () => {
    expect(
      summarize(
        'get_editor_state',
        {
          tab: {name: 'index.tsx', language: 'typescript'},
          tabs: ['index.tsx', 'a.ts', 'b.ts'],
          theme: 'Dracula',
          settings: {frame_padding: '64'},
        },
        words,
      ),
    ).toBe('3 tabs · index.tsx · Dracula');
  });

  it('names the theme', () => {
    expect(summarize('apply_theme', {theme: 'Dracula'}, words)).toBe('Dracula');
  });

  it('shows a tab by name, or by its position counted from one', () => {
    expect(summarize('select_tab', {name: 'main'}, words)).toBe('main');
    expect(summarize('select_tab', {index: 0}, words)).toBe('#1');
  });

  it('names the tab a read_tab call reads', () => {
    expect(summarize('read_tab', {name: 'main.py'}, words)).toBe('main.py');
  });

  it('lists the first settings with their values and counts the rest', () => {
    expect(
      summarize(
        'set_controls',
        {
          frame_padding: 64,
          window_shadow: 'bottom',
          frame_visible: false,
          editor_line_number_start: 3,
        },
        words,
      ),
    ).toBe('padding 64, shadow bottom, visible off, +1');
  });

  it('describes an export, delivered as a download unless told otherwise', () => {
    expect(summarize('export_image', {format: 'png', scale: 2}, words)).toBe(
      'PNG · 2x · download',
    );
    expect(summarize('export_image', {delivery: 'new_tab'}, words)).toBe(
      'new tab',
    );
  });

  it('says nothing for a tool without arguments or for malformed input', () => {
    expect(summarize('get_editor_state', {}, words)).toBe('');
    expect(summarize('set_controls', 'nonsense', words)).toBe('');
  });
});

describe('withActivity', () => {
  it('shows a call running, then done, and returns its result unchanged', async () => {
    let finish!: (result: ToolResult) => void;
    const [wrapped] = withActivity(
      [tool('apply_theme', () => new Promise(resolve => (finish = resolve)))],
      'webmcp',
      words,
    );
    const pending = wrapped.execute({theme: 'Dracula'});
    expect(activity.calls()).toMatchObject([
      {
        tool: 'apply_theme',
        summary: 'Dracula',
        source: 'webmcp',
        status: 'running',
      },
    ]);
    expect(activity.running()).toBe(true);

    const result = {ok: true, theme: {id: 'dracula'}} as const;
    finish(result);
    expect(await pending).toBe(result);
    expect(activity.calls()).toMatchObject([{status: 'done'}]);
    expect(activity.running()).toBe(false);
  });

  it('shows the error of a failed call', async () => {
    const [wrapped] = withActivity(
      [tool('apply_theme', async () => ({ok: false, error: 'Unknown theme'}))],
      'devtools',
      words,
    );
    await wrapped.execute({theme: 'Nope'});
    expect(activity.calls()).toMatchObject([
      {status: 'failed', error: 'Unknown theme', source: 'devtools'},
    ]);
  });

  it('marks a call that throws as failed and rethrows', async () => {
    const [wrapped] = withActivity(
      [
        tool('export_image', async () => {
          throw new Error('boom');
        }),
      ],
      'webmcp',
      words,
    );
    await expect(wrapped.execute({})).rejects.toThrow('boom');
    expect(activity.calls()).toMatchObject([{status: 'failed', error: 'boom'}]);
  });

  it('flags read-only tools', async () => {
    const [wrapped] = withActivity(
      [tool('list_themes', async () => ({ok: true}), true)],
      'webmcp',
      words,
    );
    await wrapped.execute({});
    expect(activity.calls()).toMatchObject([{readOnly: true}]);
  });

  it('keeps the most recent calls only', async () => {
    const [wrapped] = withActivity(
      [tool('select_tab', async () => ({ok: true}))],
      'webmcp',
      words,
    );
    for (let index = 0; index < MAX_CALLS + 2; index++)
      await wrapped.execute({index});
    const shown = activity.calls().map(call => call.summary);
    expect(shown).toHaveLength(MAX_CALLS);
    expect(shown.at(0)).toBe('#3');
    expect(shown.at(-1)).toBe(`#${MAX_CALLS + 2}`);
  });

  it('lets a call that settles after a dismissal leave nothing behind', async () => {
    let finish!: (result: ToolResult) => void;
    const [wrapped] = withActivity(
      [tool('export_image', () => new Promise(resolve => (finish = resolve)))],
      'webmcp',
      words,
    );
    const pending = wrapped.execute({});
    activity.clear();
    finish({ok: true});
    await pending;
    expect(activity.calls()).toEqual([]);
  });
});
