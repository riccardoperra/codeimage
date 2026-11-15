import {describe, expect, it, vi} from 'vitest';
import type {AgentTool, ToolResult} from '../agent-tools/tools';
import type {Run} from './agent';
import {asksForExport, createChat, MAX_TURNS} from './agent';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
  ToolSpec,
  TurnInput,
} from './model';
import {ContextFullError, ModelStartError} from './model';

const tool = (
  name: string,
  execute: (input: unknown) => Promise<ToolResult> = async () => ({ok: true}),
): AgentTool => ({
  name,
  title: name,
  description: `The ${name} tool.`,
  inputSchema: {type: 'object', properties: {}},
  execute: vi.fn(execute),
});

const call = (id: string, name: string, args: unknown = {}): ModelEvent => ({
  type: 'tool-call',
  call: {id, name, args},
});
const text = (value: string): ModelEvent => ({type: 'text-delta', text: value});
const done = (reason: 'stop' | 'tool-calls'): ModelEvent => ({
  type: 'done',
  reason,
});

/**
 * A model that answers each turn with the next scripted list of events, or
 * throws the scripted error. Every session it opens shares one script.
 */
function fakeProvider(
  turns: readonly (readonly ModelEvent[] | Error)[],
  options: {availability?: Availability; onTurn?: () => void} = {},
) {
  const inputs: TurnInput[] = [];
  const opened: {
    system: string;
    tools: readonly ToolSpec[];
    inputs: TurnInput[];
    destroy: ReturnType<typeof vi.fn>;
  }[] = [];
  const provider: ModelProvider = {
    availability: async () => options.availability ?? 'available',
    open: async ({system, tools}) => {
      const session = {
        system,
        tools,
        inputs: [] as TurnInput[],
        destroy: vi.fn(),
      };
      opened.push(session);
      return {
        async *stream(input) {
          inputs.push(input);
          session.inputs.push(input);
          options.onTurn?.();
          const events = turns[inputs.length - 1];
          if (!events) throw new Error('the model was asked one turn too many');
          if (events instanceof Error) throw events;
          yield* events;
        },
        destroy: session.destroy,
      };
    },
  };
  return {provider, inputs, opened};
}

async function run(
  provider: ModelProvider,
  tools: readonly AgentTool[],
  signal = new AbortController().signal,
  brief?: () => Record<string, unknown>,
) {
  const states: Run[] = [];
  const chat = createChat({provider, tools, brief});
  const last = await chat.send('use Dracula and export', signal, state =>
    states.push(state),
  );
  return {last, states, chat};
}

const stateStep = (id: string, output: Record<string, unknown>) => ({
  call: {id, name: 'get_editor_state', args: {}},
  result: {callId: id, name: 'get_editor_state', ok: true, output},
});

const calls = (run: Run) =>
  run.entries.flatMap(entry =>
    entry.kind === 'call' ? [[entry.tool, entry.status]] : [],
  );

describe('a chat request', () => {
  it('runs each call, sends the results back and ends with the answer', async () => {
    const theme = tool('apply_theme', async () => ({
      ok: true,
      theme: {id: 'dracula', name: 'Dracula'},
    }));
    const exporter = tool('export_image');
    const fake = fakeProvider([
      [
        text('Setting the theme.'),
        call('c1', 'apply_theme', {theme: 'Dracula'}),
        done('tool-calls'),
      ],
      [call('c2', 'export_image', {format: 'png'}), done('tool-calls')],
      [text('Done: Dracula, '), text('exported.'), done('stop')],
    ]);

    const {last, states} = await run(fake.provider, [theme, exporter]);

    expect(fake.opened[0].tools.map(spec => spec.name)).toEqual([
      'apply_theme',
      'export_image',
    ]);
    expect(fake.inputs).toEqual([
      {kind: 'text', text: 'use Dracula and export', history: []},
      {
        kind: 'tool-results',
        results: [
          {
            callId: 'c1',
            name: 'apply_theme',
            ok: true,
            output: {theme: {id: 'dracula', name: 'Dracula'}},
          },
        ],
      },
      {
        kind: 'tool-results',
        results: [{callId: 'c2', name: 'export_image', ok: true, output: {}}],
      },
    ]);
    expect(theme.execute).toHaveBeenCalledWith({theme: 'Dracula'});
    expect(last.phase).toEqual({kind: 'answered'});
    expect(last.text).toBe('Done: Dracula, exported.');
    expect(last.entries[0]).toEqual({kind: 'note', text: 'Setting the theme.'});
    expect(calls(last)).toEqual([
      ['apply_theme', 'done'],
      ['export_image', 'done'],
    ]);
    expect(states[0].phase).toEqual({kind: 'thinking'});
    expect(
      states.some(state =>
        calls(state).some(([, status]) => status === 'running'),
      ),
    ).toBe(true);
    expect(fake.opened[0].destroy).not.toHaveBeenCalled();
  });

  it('shows reasoning as a note before the answer', async () => {
    const fake = fakeProvider([
      [
        text('The user wants a theme.'),
        {type: 'reasoned'},
        text('Applied Dracula.'),
        done('stop'),
      ],
    ]);

    const {last} = await run(fake.provider, []);

    expect(last.entries).toEqual([
      {kind: 'note', text: 'The user wants a theme.'},
    ]);
    expect(last.text).toBe('Applied Dracula.');
    expect(last.phase.kind).toBe('answered');
  });

  it('starts the request with the brief as the editor state, so the first turn can act', async () => {
    const state = tool('get_editor_state');
    const theme = tool('apply_theme');
    const fake = fakeProvider([
      [call('c1', 'apply_theme', {theme: 'Dracula'}), done('tool-calls')],
      [done('stop')],
    ]);
    const brief = {tabs: ['index.ts'], settings: {frame_padding: '64'}};

    const {last} = await run(
      fake.provider,
      [state, theme],
      new AbortController().signal,
      () => brief,
    );

    expect(fake.inputs[0]).toEqual({
      kind: 'text',
      text: 'use Dracula and export',
      history: [stateStep('state-0', brief)],
    });
    expect(state.execute).not.toHaveBeenCalled();
    expect(last.entries[0]).toMatchObject({
      tool: 'get_editor_state',
      readOnly: true,
      status: 'done',
      args: brief,
    });
    expect(calls(last)).toEqual([
      ['get_editor_state', 'done'],
      ['apply_theme', 'done'],
    ]);
  });

  it('shows a brief that fails to read as a failed first row, and goes on', async () => {
    const fake = fakeProvider([[done('stop')]]);
    const {last} = await run(
      fake.provider,
      [],
      new AbortController().signal,
      () => {
        throw new Error('no editor');
      },
    );
    expect(last.entries).toMatchObject([
      {tool: 'get_editor_state', status: 'failed', error: 'no editor'},
    ]);
    expect(fake.inputs[0]).toMatchObject({history: []});
    expect(last.phase).toEqual({kind: 'answered'});
  });

  it('keeps each call its own row when the model reuses or omits call ids', async () => {
    const code = tool('set_code', async () => ({
      ok: false,
      error: 'Unknown language "}".',
    }));
    const settings = tool('set_controls', async () => ({
      ok: false,
      error: 'Some settings were not applied.',
    }));
    const theme = tool('apply_theme');
    const fake = fakeProvider([
      [
        call('call_0', 'set_code', {code: 'x', language: '}'}),
        done('tool-calls'),
      ],
      [call('call_0', 'set_controls', {frame: {}}), done('tool-calls')],
      [
        call('', 'apply_theme', {theme: 'XCode Dark'}),
        call('', 'apply_theme'),
        done('tool-calls'),
      ],
      [done('stop')],
    ]);

    const {last} = await run(fake.provider, [code, settings, theme]);

    expect(last.entries).toMatchObject([
      {tool: 'set_code', status: 'failed', error: 'Unknown language "}".'},
      {
        tool: 'set_controls',
        status: 'failed',
        error: 'Some settings were not applied.',
      },
      {tool: 'apply_theme', status: 'done', args: {theme: 'XCode Dark'}},
      {tool: 'apply_theme', status: 'done', args: {}},
    ]);
    expect(fake.inputs.slice(1)).toMatchObject([
      {results: [{callId: 'call_0', name: 'set_code', ok: false}]},
      {results: [{callId: 'call_0', name: 'set_controls', ok: false}]},
      {
        results: [
          {callId: '', name: 'apply_theme', ok: true},
          {callId: '', name: 'apply_theme', ok: true},
        ],
      },
    ]);
  });

  it('returns a failing call to the model as an error and keeps going', async () => {
    const theme = tool('apply_theme', async () => ({
      ok: false,
      error: 'Unknown theme "Nope".',
    }));
    const fake = fakeProvider([
      [
        call('c1', 'apply_theme', {theme: 'Nope'}),
        call('c2', 'remove_all'),
        done('tool-calls'),
      ],
      [text('There is no theme Nope.'), done('stop')],
    ]);

    const {last} = await run(fake.provider, [theme]);

    expect(fake.inputs[1]).toEqual({
      kind: 'tool-results',
      results: [
        {
          callId: 'c1',
          name: 'apply_theme',
          ok: false,
          output: 'Unknown theme "Nope".',
        },
        {
          callId: 'c2',
          name: 'remove_all',
          ok: false,
          output: 'Unknown tool "remove_all".',
        },
      ],
    });
    expect(last.entries).toMatchObject([
      {tool: 'apply_theme', status: 'failed', error: 'Unknown theme "Nope".'},
      {tool: 'remove_all', status: 'failed'},
    ]);
    expect(last.phase).toEqual({kind: 'answered'});
    expect(last.text).toBe('There is no theme Nope.');
  });

  it('refuses an export the request did not ask for, and tells the model', async () => {
    const exporter = tool('export_image');
    const fake = fakeProvider([
      [call('c1', 'export_image', {delivery: 'clipboard'}), done('tool-calls')],
      [done('stop')],
    ]);
    const last = await createChat({
      provider: fake.provider,
      tools: [exporter],
    }).send('use Dracula', new AbortController().signal, () => {});

    expect(exporter.execute).not.toHaveBeenCalled();
    expect(fake.inputs[1]).toEqual({
      kind: 'tool-results',
      results: [
        {
          callId: 'c1',
          name: 'export_image',
          ok: false,
          output: 'The request did not ask for an export.',
        },
      ],
    });
    expect(last.entries).toMatchObject([
      {tool: 'export_image', status: 'failed'},
    ]);
  });

  it.each([
    ['export PNG 2x', true],
    ['esporta in png', true],
    ['scarica l’immagine', true],
    ['save image please', true],
    ['salva', true],
    ['make it a JPG', true],
    ['use Dracula, padding 64', false],
    ['add a tab main.py', false],
  ])('reads "%s" as asking for an export: %s', (request, expected) => {
    expect(asksForExport(request)).toBe(expected);
  });

  it(`stops after ${MAX_TURNS} turns of calls`, async () => {
    const turns = Array.from({length: MAX_TURNS + 1}, (_, index) => [
      call(`c${index}`, 'list_themes'),
      done('tool-calls'),
    ]);
    const themes = tool('list_themes');
    const fake = fakeProvider(turns);

    const {last} = await run(fake.provider, [themes]);

    expect(fake.inputs).toHaveLength(MAX_TURNS);
    expect(themes.execute).toHaveBeenCalledTimes(MAX_TURNS);
    expect(last.phase).toEqual({kind: 'turn-limit'});
  });

  it('opens no session when the model is not available', async () => {
    const fake = fakeProvider([], {availability: 'downloadable'});
    const {last} = await run(fake.provider, []);
    expect(fake.opened).toHaveLength(0);
    expect(last.phase).toEqual({kind: 'unavailable'});
  });

  it('says why when the model fails', async () => {
    const fake = fakeProvider([]);
    const {last} = await run(fake.provider, []);
    expect(last.phase).toEqual({
      kind: 'failed',
      message: 'the model was asked one turn too many',
    });
  });

  it('says the model could not start, with the reason', async () => {
    const fake = fakeProvider([]);
    fake.provider.open = async () => {
      throw new ModelStartError('resources');
    };
    const {last} = await run(fake.provider, []);
    expect(last.phase).toEqual({kind: 'cannot-start', reason: 'resources'});
  });

  it('stops without sending results when aborted', async () => {
    const controller = new AbortController();
    const theme = tool('apply_theme', async () => {
      controller.abort();
      return {ok: true};
    });
    const fake = fakeProvider([
      [
        call('c1', 'apply_theme'),
        call('c2', 'apply_theme'),
        done('tool-calls'),
      ],
      [done('stop')],
    ]);

    const {last} = await run(fake.provider, [theme], controller.signal);

    expect(theme.execute).toHaveBeenCalledOnce();
    expect(fake.inputs).toHaveLength(1);
    expect(last.phase).toEqual({kind: 'stopped'});
  });
});

describe('a chat', () => {
  const answer = (words: string) => [text(words), done('stop')];
  const send = (
    chat: ReturnType<typeof createChat>,
    request: string,
    signal = new AbortController().signal,
  ) => chat.send(request, signal, () => {});

  it('sends each request to one session, after a fresh read of the editor', async () => {
    const fake = fakeProvider([answer('Darker.'), answer('Lighter.')]);
    let theme = 'Dracula';
    const chat = createChat({
      provider: fake.provider,
      tools: [],
      brief: () => ({theme}),
    });

    await send(chat, 'make it darker');
    theme = 'Nord';
    const second = await send(chat, 'now make it lighter');

    expect(fake.opened).toHaveLength(1);
    expect(fake.opened[0].inputs).toEqual([
      {
        kind: 'text',
        text: 'make it darker',
        history: [stateStep('state-0', {theme: 'Dracula'})],
      },
      {
        kind: 'text',
        text: 'now make it lighter',
        history: [stateStep('state-1', {theme: 'Nord'})],
      },
    ]);
    expect(second.text).toBe('Lighter.');
    expect(second.entries).toMatchObject([
      {tool: 'get_editor_state', args: {theme: 'Nord'}},
    ]);
    expect(fake.opened[0].destroy).not.toHaveBeenCalled();
  });

  it('ends the session on end(), and the next request opens a new one', async () => {
    const fake = fakeProvider([answer('One.'), answer('Two.')]);
    const chat = createChat({provider: fake.provider, tools: []});

    await send(chat, 'one');
    chat.end();
    expect(fake.opened[0].destroy).toHaveBeenCalledOnce();
    chat.end();
    expect(fake.opened[0].destroy).toHaveBeenCalledOnce();

    const second = await send(chat, 'two');
    expect(fake.opened).toHaveLength(2);
    expect(fake.opened[1].inputs).toMatchObject([{kind: 'text', text: 'two'}]);
    expect(second.entries).toEqual([]);
  });

  it('keeps the session after a stopped request, for the next one', async () => {
    const controller = new AbortController();
    const fake = fakeProvider([
      [call('c1', 'apply_theme'), done('tool-calls')],
      answer('Done.'),
    ]);
    const theme = tool('apply_theme', async () => {
      controller.abort();
      return {ok: true};
    });
    const chat = createChat({provider: fake.provider, tools: [theme]});

    const stopped = await send(chat, 'use Dracula', controller.signal);
    const next = await send(chat, 'use Nord');

    expect(stopped.phase).toEqual({kind: 'stopped'});
    expect(next.phase).toEqual({kind: 'answered'});
    expect(next.text).toBe('Done.');
    expect(fake.opened).toHaveLength(1);
    expect(fake.opened[0].inputs.map(input => input.kind)).toEqual([
      'text',
      'text',
    ]);
  });

  it('starts a new conversation, and says so, when the old one is full', async () => {
    const fake = fakeProvider([
      answer('Darker.'),
      new ContextFullError(),
      answer('Lighter.'),
    ]);
    const chat = createChat({
      provider: fake.provider,
      tools: [],
      brief: () => ({theme: 'Dracula'}),
    });

    await send(chat, 'make it darker');
    const second = await send(chat, 'now make it lighter');

    expect(fake.opened).toHaveLength(2);
    expect(fake.opened[0].destroy).toHaveBeenCalledOnce();
    expect(fake.opened[1].inputs).toEqual([
      {
        kind: 'text',
        text: 'now make it lighter',
        history: [stateStep('state-2', {theme: 'Dracula'})],
      },
    ]);
    expect(second.entries).toMatchObject([
      {kind: 'chat-full'},
      {kind: 'call', tool: 'get_editor_state', id: 'state-2'},
    ]);
    expect(second.phase).toEqual({kind: 'answered'});
    expect(second.text).toBe('Lighter.');
  });

  it('fails a request that does not fit a new conversation', async () => {
    const fake = fakeProvider([new ContextFullError()]);
    const chat = createChat({provider: fake.provider, tools: []});

    const last = await send(chat, 'a very long request');

    expect(fake.opened).toHaveLength(1);
    expect(last.phase).toEqual({
      kind: 'failed',
      message: "The request does not fit in the model's context.",
    });
  });

  it('does not run the calls again when the context fills after them', async () => {
    const theme = tool('apply_theme');
    const fake = fakeProvider([
      answer('Hello.'),
      [call('c1', 'apply_theme'), done('tool-calls')],
      new ContextFullError(),
      answer('Fresh.'),
    ]);
    const chat = createChat({provider: fake.provider, tools: [theme]});

    await send(chat, 'hello');
    const full = await send(chat, 'use Dracula');
    const next = await send(chat, 'use Nord');

    expect(theme.execute).toHaveBeenCalledOnce();
    expect(full.phase).toMatchObject({kind: 'failed'});
    expect(fake.opened).toHaveLength(2);
    expect(fake.opened[0].destroy).toHaveBeenCalledOnce();
    expect(next.text).toBe('Fresh.');
  });
});
