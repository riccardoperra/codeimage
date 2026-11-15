import {describe, expect, it, vi} from 'vitest';
import type {AgentTool, ToolResult} from '../agent-tools/tools';
import type {Run} from './agent';
import {MAX_TURNS, runAgent} from './agent';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
  ToolSpec,
  TurnInput,
} from './model';
import {ModelStartError} from './model';

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

/** A model that answers each turn with the next scripted list of events. */
function fakeProvider(
  turns: readonly (readonly ModelEvent[])[],
  options: {availability?: Availability; onTurn?: () => void} = {},
) {
  const inputs: TurnInput[] = [];
  const opened: {
    system: string;
    tools: readonly ToolSpec[];
    history: Parameters<ModelProvider['open']>[0]['history'];
  }[] = [];
  const destroy = vi.fn();
  const provider: ModelProvider = {
    availability: async () => options.availability ?? 'available',
    open: async ({system, tools, history}) => {
      opened.push({system, tools, history});
      return {
        async *stream(input) {
          inputs.push(input);
          options.onTurn?.();
          const events = turns[inputs.length - 1];
          if (!events) throw new Error('the model was asked one turn too many');
          yield* events;
        },
        destroy,
      };
    },
  };
  return {provider, inputs, opened, destroy};
}

async function run(
  provider: ModelProvider,
  tools: readonly AgentTool[],
  signal = new AbortController().signal,
) {
  const states: Run[] = [];
  const last = await runAgent(
    {provider, tools, request: 'use Dracula and export', signal},
    state => states.push(state),
  );
  return {last, states};
}

const calls = (run: Run) =>
  run.entries.flatMap(entry =>
    entry.kind === 'call' ? [[entry.tool, entry.status]] : [],
  );

describe('runAgent', () => {
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
      {kind: 'text', text: 'use Dracula and export'},
      {
        kind: 'tool-results',
        results: [
          {
            callId: 'c1',
            ok: true,
            output: {theme: {id: 'dracula', name: 'Dracula'}},
          },
        ],
      },
      {kind: 'tool-results', results: [{callId: 'c2', ok: true, output: {}}]},
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
    expect(fake.destroy).toHaveBeenCalledOnce();
  });

  it('starts the session with the editor state, so the first turn can act', async () => {
    const state = tool('get_editor_state', async () => ({
      ok: true,
      tabs: [{name: 'index.ts', active: true}],
    }));
    const theme = tool('apply_theme');
    const fake = fakeProvider([
      [call('c1', 'apply_theme', {theme: 'Dracula'}), done('tool-calls')],
      [done('stop')],
    ]);

    const {last} = await run(fake.provider, [state, theme]);

    expect(fake.opened[0].history).toEqual([
      {
        call: {id: 'state-0', name: 'get_editor_state', args: {}},
        result: {
          callId: 'state-0',
          ok: true,
          output: {tabs: [{name: 'index.ts', active: true}]},
        },
      },
    ]);
    expect(state.execute).toHaveBeenCalledOnce();
    expect(calls(last)).toEqual([['apply_theme', 'done']]);
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
        {callId: 'c1', ok: false, output: 'Unknown theme "Nope".'},
        {callId: 'c2', ok: false, output: 'Unknown tool "remove_all".'},
      ],
    });
    expect(last.entries).toMatchObject([
      {tool: 'apply_theme', status: 'failed', error: 'Unknown theme "Nope".'},
      {tool: 'remove_all', status: 'failed'},
    ]);
    expect(last.phase).toEqual({kind: 'answered'});
    expect(last.text).toBe('There is no theme Nope.');
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
    expect(fake.destroy).toHaveBeenCalledOnce();
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
    expect(fake.destroy).toHaveBeenCalledOnce();
  });
});
