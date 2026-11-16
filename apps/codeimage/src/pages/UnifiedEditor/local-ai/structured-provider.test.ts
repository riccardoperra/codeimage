import {describe, expect, it, vi} from 'vitest';
import type {LanguageModelApi, Session} from './language-model';
import type {ModelEvent, ModelSession, TurnInput} from './model';
import {pickProvider} from './providers';
import {
  CONTINUE,
  createStructuredProvider,
  RETRY,
  stepSchema,
} from './structured-provider';

vi.spyOn(console, 'info').mockImplementation(() => {});

const streamOf = (chunks: readonly unknown[]) =>
  new ReadableStream<unknown>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

/** Each reply is the chunks one promptStreaming() call yields. */
function fakeChrome(replies: readonly (readonly string[])[]) {
  const prompts: {input: unknown; options: Record<string, unknown>}[] = [];
  const appended: unknown[] = [];
  const created: Record<string, unknown>[] = [];
  const session = (): Session => ({
    promptStreaming: (input, options = {}) => {
      prompts.push({input, options});
      return streamOf(replies[prompts.length - 1] ?? []);
    },
    append: async input => {
      appended.push(input);
    },
    clone: async () => session(),
    destroy() {},
  });
  const api: LanguageModelApi = {
    availability: vi.fn(async () => 'available' as const),
    create: async options => {
      created.push(options);
      return session();
    },
  };
  return {api, prompts, appended, created};
}

const TOOLS = [
  {
    name: 'apply_theme',
    description: 'Applies a theme. Example: {"theme":"Dracula"}.',
    inputSchema: {
      type: 'object',
      properties: {theme: {type: 'string', description: 'A theme name.'}},
      required: ['theme'],
      additionalProperties: false,
    },
  },
  {
    name: 'read_tab',
    description: 'Reads a tab.',
    inputSchema: {type: 'object', properties: {name: {type: 'string'}}},
  },
];

const step = (value: object) => JSON.stringify(value);

async function open(replies: readonly (readonly string[])[]) {
  const fake = fakeChrome(replies);
  const session = await createStructuredProvider(fake.api).open({
    system: 'Edit the screenshot.',
    tools: TOOLS,
    signal: new AbortController().signal,
  });
  return {...fake, session};
}

const collect = async (session: ModelSession, input: TurnInput) => {
  const events: ModelEvent[] = [];
  for await (const event of session.stream(input, new AbortController().signal))
    events.push(event);
  return events;
};

describe('createStructuredProvider', () => {
  it('opens a plain text session with the tools in its instructions', async () => {
    const {created} = await open([]);
    expect(created[0]).not.toHaveProperty('tools');
    expect(created[0]).toMatchObject({
      expectedInputs: [{type: 'text', languages: ['en']}],
      expectedOutputs: [{type: 'text', languages: ['en']}],
    });
    const [{content}] = created[0].initialPrompts as {content: string}[];
    expect(content).toMatch(/^Edit the screenshot\./);
    expect(content).toContain(
      '- apply_theme: Applies a theme. Args: {"type":"object","properties":{"theme":{"type":"string","description":"A theme name."}},"required":["theme"]}',
    );
    expect(content).toContain('Reply with exactly one JSON step per turn');
  });

  it('turns a reason, a tool step and an answer into events', async () => {
    const {session, prompts} = await open([
      [step({kind: 'reason', text: 'The user wants Dracula.'})],
      [step({kind: 'tool', name: 'apply_theme', args: {theme: 'Dracula'}})],
      [step({kind: 'answer', text: 'Applied Dracula.'})],
    ]);

    expect(await collect(session, {kind: 'text', text: 'use dracula'})).toEqual(
      [
        {type: 'text-delta', text: 'The user wants Dracula.'},
        {type: 'reasoned'},
        {
          type: 'tool-call',
          call: {id: 's-1', name: 'apply_theme', args: {theme: 'Dracula'}},
        },
        {type: 'done', reason: 'tool-calls'},
      ],
    );
    expect(
      await collect(session, {
        kind: 'tool-results',
        results: [
          {
            callId: 's-1',
            name: 'apply_theme',
            ok: true,
            output: {theme: 'Dracula'},
          },
        ],
      }),
    ).toEqual([
      {type: 'text-delta', text: 'Applied Dracula.'},
      {type: 'done', reason: 'stop'},
    ]);
    expect(prompts.map(prompt => prompt.input)).toEqual([
      'use dracula',
      CONTINUE,
      '{"tool":"apply_theme","ok":true,"result":{"theme":"Dracula"}}',
    ]);
  });

  it('constrains every prompt and drops the reason branch after a reason', async () => {
    const {session, prompts} = await open([
      [step({kind: 'reason', text: 'Thinking.'})],
      [step({kind: 'answer', text: 'Done.'})],
    ]);
    await collect(session, {kind: 'text', text: 'hi'});
    const kinds = prompts.map(({options}) =>
      (
        options.responseConstraint as {
          oneOf: {properties: {kind: {enum: string[]}}}[];
        }
      ).oneOf.map(branch => branch.properties.kind.enum[0]),
    );
    expect(kinds).toEqual([
      ['reason', 'tool', 'tool', 'answer'],
      ['tool', 'tool', 'answer'],
    ]);
    expect(prompts[0].options.omitResponseConstraintInput).toBe(true);
  });

  it('sends an error result back as JSON text', async () => {
    const {session, prompts} = await open([
      [step({kind: 'answer', text: 'No.'})],
    ]);
    await collect(session, {
      kind: 'tool-results',
      results: [
        {callId: 's-1', name: 'read_tab', ok: false, output: 'No tab.'},
      ],
    });
    expect(prompts[0].input).toBe(
      '{"tool":"read_tab","ok":false,"error":"No tab."}',
    );
  });

  it('appends the history as tool steps and their results', async () => {
    const {session, appended} = await open([
      [step({kind: 'answer', text: 'Ok.'})],
    ]);
    await collect(session, {
      kind: 'text',
      text: 'make it darker',
      history: [
        {
          call: {id: 'state-0', name: 'get_editor_state', args: {}},
          result: {
            callId: 'state-0',
            name: 'get_editor_state',
            ok: true,
            output: {tabs: ['index.ts']},
          },
        },
      ],
    });
    expect(appended).toEqual([
      [
        {
          role: 'assistant',
          content: '{"kind":"tool","name":"get_editor_state","args":{}}',
        },
        {
          role: 'user',
          content:
            '{"tool":"get_editor_state","ok":true,"result":{"tabs":["index.ts"]}}',
        },
      ],
    ]);
  });

  it('asks once more after a malformed step, then fails', async () => {
    const retried = await open([
      ['{"kind":"tool","name":'],
      [step({kind: 'answer', text: 'Fine.'})],
    ]);
    expect(await collect(retried.session, {kind: 'text', text: 'hi'})).toEqual([
      {type: 'text-delta', text: 'Fine.'},
      {type: 'done', reason: 'stop'},
    ]);
    expect(retried.prompts[1].input).toBe(RETRY);

    const failed = await open([['not json'], ['{"kind":"nope"}']]);
    await expect(
      collect(failed.session, {kind: 'text', text: 'hi'}),
    ).rejects.toThrow('The model did not reply with a valid JSON step.');
  });

  it('reads chunks as deltas or as the text so far', async () => {
    const answer = step({kind: 'answer', text: 'Done.'});
    const half = answer.slice(0, 10);
    const deltas = await open([[half, answer.slice(10)]]);
    const cumulative = await open([[half, answer]]);
    for (const {session} of [deltas, cumulative])
      expect(await collect(session, {kind: 'text', text: 'hi'})).toEqual([
        {type: 'text-delta', text: 'Done.'},
        {type: 'done', reason: 'stop'},
      ]);
  });
});

describe('stepSchema', () => {
  it('gives each tool its own branch with its arguments', () => {
    const {oneOf} = stepSchema(TOOLS, true) as {oneOf: object[]};
    expect(oneOf).toContainEqual({
      type: 'object',
      properties: {
        kind: {type: 'string', enum: ['tool']},
        name: {type: 'string', enum: ['apply_theme']},
        args: {
          type: 'object',
          properties: {theme: {type: 'string'}},
          required: ['theme'],
          additionalProperties: false,
        },
      },
      required: ['kind', 'name', 'args'],
      additionalProperties: false,
    });
    expect(oneOf).toHaveLength(TOOLS.length + 2);
  });
});

describe('pickProvider', () => {
  it('keeps a forced choice without asking Chrome', async () => {
    const native = vi.fn(async () => true);
    expect(await pickProvider('structured', native)).toBe('structured');
    expect(await pickProvider('native', native)).toBe('native');
    expect(native).not.toHaveBeenCalled();
  });

  it('takes native when Chrome runs it, and structured otherwise', async () => {
    expect(await pickProvider('auto', async () => true)).toBe('native');
    expect(await pickProvider('auto', async () => false)).toBe('structured');
  });
});
