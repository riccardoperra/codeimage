import type {LanguageModelApi, Session} from './language-model';
import {chromeLanguageModel, log} from './language-model';
import {ModelStartError} from './model';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
  ModelSession,
  ModelToolResult,
  ToolSpec,
  TurnInput,
} from './model';

type ResponseClass = new (init: object) => object;

/** The classes Chrome expects for tool calls and results, when it has them. */
export interface ToolClasses {
  readonly LanguageModelToolCall?: ResponseClass;
  readonly LanguageModelToolSuccess?: ResponseClass;
  readonly LanguageModelToolError?: ResponseClass;
}

// tool-call too, so that history can replay the model's own calls.
const INPUTS = [
  {type: 'text', languages: ['en']},
  {type: 'tool-call'},
  {type: 'tool-response'},
];
const OUTPUTS = [{type: 'text', languages: ['en']}, {type: 'tool-call'}];

// availability() takes create()'s options, and the real tools come later.
const TOOL_PROBE = {
  name: 'get_editor_state',
  description: 'Reads the editor.',
  inputSchema: {type: 'object', properties: {}},
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const errorMessage = (output: unknown) =>
  typeof output === 'string' ? output : JSON.stringify(output);

async function* chunks(stream: ReadableStream<unknown>) {
  const reader = stream.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Turns one streamed answer into events. Chrome's docs do not say whether text
 * chunks are deltas or the text so far, so a chunk that repeats what came
 * before adds only its new end.
 */
export async function* answerEvents(
  stream: AsyncIterable<unknown>,
): AsyncGenerator<ModelEvent> {
  let text = '';
  let calls = false;
  for await (const chunk of stream) {
    log('model output chunk', chunk);
    const part =
      typeof chunk === 'string' ? {type: 'text', value: chunk} : chunk;
    if (!isRecord(part)) continue;
    if (part.type === 'text' && typeof part.value === 'string') {
      const delta =
        text && part.value.startsWith(text)
          ? part.value.slice(text.length)
          : part.value;
      text += delta;
      if (delta) yield {type: 'text-delta', text: delta};
    } else if (part.type === 'tool-call' && isRecord(part.value)) {
      calls = true;
      yield {
        type: 'tool-call',
        call: {
          id: String(part.value.callId),
          name: String(part.value.name),
          args: part.value.arguments ?? {},
        },
      };
    } else {
      log('ignored an output part', part);
    }
  }
  yield {type: 'done', reason: calls ? 'tool-calls' : 'stop'};
}

const SCHEMA_KEYS = new Set([
  'type',
  'properties',
  'required',
  'enum',
  'description',
  'minimum',
  'maximum',
  'items',
]);

/**
 * The schema with only the keywords the explainer shows. The tools validate
 * their input anyway, so a dropped keyword such as additionalProperties loses
 * nothing.
 */
export function plainSchema(schema: unknown): unknown {
  if (!isRecord(schema) || Array.isArray(schema)) return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (!SCHEMA_KEYS.has(key)) continue;
    out[key] =
      key === 'properties' && isRecord(value)
        ? Object.fromEntries(
            Object.entries(value).map(([name, inner]) => [
              name,
              plainSchema(inner),
            ]),
          )
        : key === 'items'
          ? plainSchema(value)
          : value;
  }
  return out;
}

const declare = ({name, description, inputSchema}: ToolSpec) => ({
  name,
  description,
  inputSchema: plainSchema(inputSchema) as object,
});

const describeError = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/** Chrome's on-device model through the Prompt API, with native tool calling. */
export function createChromeProvider(
  api: LanguageModelApi | undefined,
  classes: ToolClasses,
): ModelProvider {
  function wrap(name: keyof ToolClasses, value: object) {
    const Class = classes[name];
    if (!Class) log(`${name} is missing, so a plain object goes in`);
    return Class ? new Class(value) : value;
  }

  const toolResponse = (result: ModelToolResult, name: string) => ({
    type: 'tool-response',
    value: result.ok
      ? wrap('LanguageModelToolSuccess', {
          callId: result.callId,
          name,
          result: [{type: 'object', value: result.output}],
        })
      : wrap('LanguageModelToolError', {
          callId: result.callId,
          name,
          errorMessage: errorMessage(result.output),
        }),
  });

  // One session per system prompt and tools, which each request clones, so
  // that Chrome reads the instructions and tools once.
  let base: {key: string; session: Promise<Session>} | undefined;

  function baseSession(
    chrome: LanguageModelApi,
    system: string,
    tools: readonly ToolSpec[],
  ) {
    const key = JSON.stringify([system, tools]);
    if (base?.key === key) return base.session;
    if (base)
      void base.session.then(
        old => old.destroy(),
        () => {},
      );
    const options = {
      initialPrompts: [{role: 'system' as const, content: system}],
      tools: tools.map(declare),
      expectedInputs: INPUTS,
      expectedOutputs: OUTPUTS,
    };
    log('create() the base session with tools', options);
    const session = chrome.create(options).catch((error: unknown) => {
      log('create() failed', describeError(error), error);
      throw new ModelStartError(
        error instanceof DOMException && error.name === 'InvalidStateError'
          ? 'resources'
          : 'unsupported',
        {cause: error},
      );
    });
    const entry = {key, session};
    base = entry;
    session.catch(() => {
      if (base === entry) base = undefined;
    });
    return session;
  }

  function session(chrome: Session): ModelSession & {
    readonly names: Map<string, string>;
  } {
    // A response names its tool, which only the call knew.
    const names = new Map<string, string>();
    return {
      names,
      async *stream(input: TurnInput, signal: AbortSignal) {
        const prompt =
          input.kind === 'text'
            ? input.text
            : [
                {
                  role: 'user',
                  content: input.results.map(result =>
                    toolResponse(result, names.get(result.callId) ?? ''),
                  ),
                },
              ];
        log(
          input.kind === 'text' ? 'prompt' : 'tool results sent back',
          prompt,
        );
        const answer = chunks(chrome.promptStreaming(prompt, {signal}));
        for await (const event of answerEvents(answer)) {
          if (event.type === 'tool-call')
            names.set(event.call.id, event.call.name);
          yield event;
        }
      },
      destroy: () => {
        log('destroy() the clone');
        chrome.destroy();
      },
    };
  }

  return {
    async availability(): Promise<Availability> {
      if (!api) return 'unavailable';
      const options = {expectedInputs: INPUTS, expectedOutputs: OUTPUTS};
      try {
        return await api.availability({...options, tools: [TOOL_PROBE]});
      } catch (error) {
        log('availability() rejected tools, asking without them', error);
      }
      try {
        return await api.availability(options);
      } catch (error) {
        log('availability() threw', error);
        return 'unavailable';
      }
    },
    async open({system, tools, history = [], signal}) {
      if (!api) throw new Error('This browser has no on-device model.');
      const base = await baseSession(api, system, tools);
      log('clone() the base session');
      const chrome = await base.clone({signal});
      const opened = session(chrome);
      if (history.length > 0) {
        const turns = history.flatMap(({call, result}) => [
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                value: wrap('LanguageModelToolCall', {
                  callId: call.id,
                  name: call.name,
                  arguments: call.args,
                }),
              },
            ],
          },
          {role: 'user', content: [toolResponse(result, call.name)]},
        ]);
        log('append() the history', turns);
        try {
          await chrome.append(turns, {signal});
        } catch (error) {
          opened.destroy();
          throw error;
        }
        for (const {call} of history) opened.names.set(call.id, call.name);
      }
      log('session open');
      return opened;
    },
  };
}

/** The provider the bar uses: this browser's Prompt API. */
export const chromeProvider = createChromeProvider(
  chromeLanguageModel,
  globalThis as ToolClasses,
);
