import {describe, expect, it, vi} from 'vitest';
import {createChromeProvider} from './chrome-provider';
import {plainSchema} from './prompt-api';
import type {LanguageModelApi, Session} from './language-model';
import type {ModelEvent, ModelSession} from './model';
import {ContextFullError} from './model';

vi.spyOn(console, 'info').mockImplementation(() => {});

const streamOf = (chunks: readonly unknown[]) =>
  new ReadableStream<unknown>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

class Success {
  constructor(readonly init: object) {}
}
class Failure {
  constructor(readonly init: object) {}
}

function fakeChrome(
  turns: readonly (readonly unknown[] | Error)[],
  {
    rejectTools = false,
    context = {},
  }: {
    rejectTools?: boolean;
    context?: Pick<
      Session,
      'contextUsage' | 'contextWindow' | 'inputUsage' | 'inputQuota'
    >;
  } = {},
) {
  const prompts: unknown[] = [];
  const appended: unknown[] = [];
  /** What the clone holds, in order: appends and prompts. */
  const timeline: string[] = [];
  const created: object[] = [];
  const clones = vi.fn();
  const destroyed = vi.fn();
  const session = (): Session => ({
    ...context,
    promptStreaming: input => {
      prompts.push(input);
      timeline.push('prompt');
      const turn = turns[prompts.length - 1] ?? [];
      if (turn instanceof Error)
        return new ReadableStream({
          start: controller => controller.error(turn),
        });
      return streamOf(turn);
    },
    append: async input => {
      appended.push(input);
      timeline.push('append');
    },
    clone: async () => {
      clones();
      return {...session(), destroy: destroyed};
    },
    destroy() {},
  });
  const api: LanguageModelApi = {
    availability: vi.fn(async (options?: object) => {
      if (rejectTools && options && 'tools' in options)
        throw new TypeError('tools');
      return 'available' as const;
    }),
    create: async options => {
      created.push(options);
      return session();
    },
  };
  return {api, prompts, appended, timeline, created, clones, destroyed};
}

const collect = async (
  session: ModelSession,
  input: Parameters<ModelSession['stream']>[0],
) => {
  const events: ModelEvent[] = [];
  for await (const event of session.stream(input, new AbortController().signal))
    events.push(event);
  return events;
};

const TOOLS = [
  {
    name: 'apply_theme',
    description: 'Applies a theme.',
    inputSchema: {type: 'object'},
  },
];

describe('createChromeProvider', () => {
  it('asks again without tools when availability() rejects them', async () => {
    const fake = fakeChrome([], {rejectTools: true});
    const provider = createChromeProvider(fake.api, {});
    expect(await provider.availability(TOOLS)).toBe('available');
    expect(fake.api.availability).toHaveBeenCalledTimes(2);
  });

  it('asks availability() with the tools and types that create() gets', async () => {
    const fake = fakeChrome([]);
    const provider = createChromeProvider(fake.api, {});
    const tools = [
      ...TOOLS,
      {
        name: 'read_tab',
        description: 'Reads a tab.',
        inputSchema: {type: 'object', properties: {name: {type: 'string'}}},
      },
    ];
    await provider.availability(tools);
    await provider.open({
      system: '',
      tools,
      signal: new AbortController().signal,
    });
    const [asked] = vi.mocked(fake.api.availability).mock.calls[0] as [
      Record<string, unknown>,
    ];
    const created = fake.created[0] as Record<string, unknown>;
    expect(asked).toEqual({
      tools: created.tools,
      expectedInputs: created.expectedInputs,
      expectedOutputs: created.expectedOutputs,
    });
    expect((asked.tools as {name: string}[]).map(tool => tool.name)).toEqual([
      'apply_theme',
      'read_tab',
    ]);
  });

  it('declares the tools and tool turns when it opens a session', async () => {
    const fake = fakeChrome([]);
    await createChromeProvider(fake.api, {}).open({
      system: 'Edit the screenshot.',
      tools: TOOLS,
      signal: new AbortController().signal,
    });
    expect(fake.created[0]).toMatchObject({
      initialPrompts: [{role: 'system', content: 'Edit the screenshot.'}],
      tools: TOOLS,
      expectedInputs: [
        {type: 'text', languages: ['en']},
        {type: 'tool-call'},
        {type: 'tool-response'},
      ],
      expectedOutputs: [{type: 'text', languages: ['en']}, {type: 'tool-call'}],
    });
  });

  it('clones one base session per conversation', async () => {
    const fake = fakeChrome([]);
    const provider = createChromeProvider(fake.api, {});
    const open = () =>
      provider.open({
        system: 'Edit the screenshot.',
        tools: TOOLS,
        signal: new AbortController().signal,
      });
    const first = await open();
    first.destroy();
    await open();

    expect(fake.created).toHaveLength(1);
    expect(fake.clones).toHaveBeenCalledTimes(2);
    expect(fake.destroyed).toHaveBeenCalledOnce();
  });

  it('appends the history before each request it comes with', async () => {
    const fake = fakeChrome([[], []]);
    const session = await createChromeProvider(fake.api, {
      LanguageModelToolSuccess: Success,
    }).open({system: '', tools: TOOLS, signal: new AbortController().signal});
    const state = (id: string, tabs: string[]) => ({
      call: {id, name: 'get_editor_state', args: {}},
      result: {callId: id, name: 'get_editor_state', ok: true, output: {tabs}},
    });

    await collect(session, {
      kind: 'text',
      text: 'make it darker',
      history: [state('state-0', ['index.ts'])],
    });
    await collect(session, {
      kind: 'text',
      text: 'now lighter',
      history: [state('state-1', ['main.py'])],
    });

    expect(fake.timeline).toEqual(['append', 'prompt', 'append', 'prompt']);
    expect(fake.prompts).toEqual(['make it darker', 'now lighter']);
    expect(JSON.stringify(fake.created[0])).not.toContain('index.ts');
    expect(fake.appended[1]).toStrictEqual([
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            value: {callId: 'state-1', name: 'get_editor_state', arguments: {}},
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool-response',
            value: new Success({
              callId: 'state-1',
              name: 'get_editor_state',
              result: [{type: 'object', value: {tabs: ['main.py']}}],
            }),
          },
        ],
      },
    ]);
  });

  it.each([
    [{contextUsage: 900, contextWindow: 1000}, true],
    [{inputUsage: 900, inputQuota: 1000}, true],
    [{contextUsage: 800, contextWindow: 1000}, false],
    [{}, false],
  ])(
    'with %o after a request, says the next one does not fit: %s',
    async (context, full) => {
      const fake = fakeChrome([[], []], {context});
      const session = await createChromeProvider(fake.api, {}).open({
        system: '',
        tools: TOOLS,
        signal: new AbortController().signal,
      });
      await collect(session, {kind: 'text', text: 'one'});
      const next = collect(session, {kind: 'text', text: 'two'});
      if (full) await expect(next).rejects.toBeInstanceOf(ContextFullError);
      else await next;
      expect(fake.prompts).toEqual(full ? ['one'] : ['one', 'two']);
    },
  );

  it('reads a QuotaExceededError as a full context', async () => {
    const fake = fakeChrome([
      new DOMException('The input is too large.', 'QuotaExceededError'),
    ]);
    const session = await createChromeProvider(fake.api, {}).open({
      system: '',
      tools: TOOLS,
      signal: new AbortController().signal,
    });
    await expect(
      collect(session, {kind: 'text', text: 'go'}),
    ).rejects.toBeInstanceOf(ContextFullError);
  });

  it('streams text deltas, cumulative text and tool calls as events', async () => {
    const fake = fakeChrome([
      [
        {type: 'text', value: 'Setting'},
        {type: 'text', value: 'Setting the theme'},
        ' now.',
        {
          type: 'tool-call',
          value: {
            callId: 'x1',
            name: 'apply_theme',
            arguments: {theme: 'Dracula'},
          },
        },
      ],
      [{type: 'text', value: 'Done.'}],
    ]);
    const session = await createChromeProvider(fake.api, {}).open({
      system: '',
      tools: TOOLS,
      signal: new AbortController().signal,
    });

    expect(await collect(session, {kind: 'text', text: 'use Dracula'})).toEqual(
      [
        {type: 'text-delta', text: 'Setting'},
        {type: 'text-delta', text: ' the theme'},
        {type: 'text-delta', text: ' now.'},
        {
          type: 'tool-call',
          call: {id: 'x1', name: 'apply_theme', args: {theme: 'Dracula'}},
        },
        {type: 'done', reason: 'tool-calls'},
      ],
    );
    expect(
      await collect(session, {
        kind: 'tool-results',
        results: [
          {
            callId: 'x1',
            name: 'apply_theme',
            ok: true,
            output: {theme: 'Dracula'},
          },
        ],
      }),
    ).toEqual([
      {type: 'text-delta', text: 'Done.'},
      {type: 'done', reason: 'stop'},
    ]);
    expect(fake.prompts[0]).toBe('use Dracula');
  });

  it('reads a call without an id as an empty id', async () => {
    const fake = fakeChrome([
      [{type: 'tool-call', value: {name: 'apply_theme', arguments: {}}}],
    ]);
    const session = await createChromeProvider(fake.api, {}).open({
      system: '',
      tools: TOOLS,
      signal: new AbortController().signal,
    });
    expect(await collect(session, {kind: 'text', text: 'go'})).toContainEqual({
      type: 'tool-call',
      call: {id: '', name: 'apply_theme', args: {}},
    });
  });

  it('sends results back in Chrome wrappers with their ids as given', async () => {
    const fake = fakeChrome([[], []]);
    const session = await createChromeProvider(fake.api, {
      LanguageModelToolSuccess: Success,
      LanguageModelToolError: Failure,
    }).open({system: '', tools: TOOLS, signal: new AbortController().signal});
    await collect(session, {kind: 'text', text: 'go'});
    await collect(session, {
      kind: 'tool-results',
      results: [
        {callId: '', name: 'apply_theme', ok: true, output: {theme: 'Dracula'}},
        {
          callId: '',
          name: 'export_image',
          ok: false,
          output: 'Another export is running.',
        },
      ],
    });

    expect(fake.prompts[1]).toStrictEqual([
      {
        role: 'user',
        content: [
          {
            type: 'tool-response',
            value: new Success({
              callId: '',
              name: 'apply_theme',
              result: [{type: 'object', value: {theme: 'Dracula'}}],
            }),
          },
          {
            type: 'tool-response',
            value: new Failure({
              callId: '',
              name: 'export_image',
              errorMessage: 'Another export is running.',
            }),
          },
        ],
      },
    ]);
  });
});

describe('plainSchema', () => {
  it('keeps the keywords the explainer shows and drops the rest', () => {
    expect(
      plainSchema({
        type: 'object',
        additionalProperties: false,
        required: ['values'],
        properties: {
          values: {
            type: 'object',
            additionalProperties: false,
            properties: {
              'frame.padding': {type: 'number', minimum: 0, maximum: 128},
              'window.style': {type: 'string', enum: ['mac', 'windows']},
            },
          },
        },
      }),
    ).toEqual({
      type: 'object',
      required: ['values'],
      properties: {
        values: {
          type: 'object',
          properties: {
            'frame.padding': {type: 'number', minimum: 0, maximum: 128},
            'window.style': {type: 'string', enum: ['mac', 'windows']},
          },
        },
      },
    });
  });
});

describe('a session Chrome cannot create', () => {
  it.each([
    ['InvalidStateError', 'resources'],
    ['NotSupportedError', 'unsupported'],
  ])('reports %s as %s and asks again next time', async (name, reason) => {
    const create = vi.fn<LanguageModelApi['create']>(async () => {
      throw new DOMException('The device is unable to create a session.', name);
    });
    const provider = createChromeProvider(
      {availability: async () => 'available', create},
      {},
    );
    const open = () =>
      provider.open({
        system: '',
        tools: TOOLS,
        signal: new AbortController().signal,
      });

    await expect(open()).rejects.toMatchObject({
      name: 'ModelStartError',
      reason,
    });
    await expect(open()).rejects.toThrow();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
