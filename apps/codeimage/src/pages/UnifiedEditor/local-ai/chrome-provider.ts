import type {LanguageModelApi, Session} from './language-model';
import {chromeLanguageModel, log} from './language-model';
import {ContextFullError, ModelStartError} from './model';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
  ModelSession,
  ModelToolResult,
  ToolSpec,
  ToolStep,
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
    const part =
      typeof chunk === 'string' ? {type: 'text', value: chunk} : chunk;
    if (!isRecord(part)) {
      log('ignored an output chunk', chunk);
      continue;
    }
    if (part.type === 'text' && typeof part.value === 'string') {
      log('model text', part.value);
      const delta =
        text && part.value.startsWith(text)
          ? part.value.slice(text.length)
          : part.value;
      text += delta;
      if (delta) yield {type: 'text-delta', text: delta};
    } else if (part.type === 'tool-call' && isRecord(part.value)) {
      calls = true;
      const call = {
        id: String(part.value.callId ?? ''),
        name: String(part.value.name),
        args: part.value.arguments ?? {},
      };
      // Chrome's LanguageModelToolCall keeps its fields on getters, which the
      // console shows as an opaque object.
      log(
        'model called',
        JSON.stringify({
          callId: call.id,
          name: call.name,
          arguments: call.args,
        }),
      );
      yield {type: 'tool-call', call};
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

/** What availability() and create() both take, as the explainer asks. */
const coreOptions = (tools: readonly ToolSpec[]) => ({
  tools: tools.map(declare),
  expectedInputs: INPUTS,
  expectedOutputs: OUTPUTS,
});

const describeError = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

/**
 * Past this share of the context window a conversation ends before its next
 * request, which would otherwise push its oldest turns out unseen.
 */
export const FULL_AT = 0.85;

function contextOf(session: Session) {
  if (session.contextWindow)
    return {used: session.contextUsage ?? 0, size: session.contextWindow};
  if (session.inputQuota)
    return {used: session.inputUsage ?? 0, size: session.inputQuota};
  return undefined;
}

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

  const toolResponse = ({callId, name, ok, output}: ModelToolResult) => ({
    type: 'tool-response',
    value: ok
      ? wrap('LanguageModelToolSuccess', {
          callId,
          name,
          result: [{type: 'object', value: output}],
        })
      : wrap('LanguageModelToolError', {
          callId,
          name,
          errorMessage: errorMessage(output),
        }),
  });

  // A turn of calls, then the turn of their results, as the model makes them.
  const stepTurns = (steps: readonly ToolStep[]) => [
    {
      role: 'assistant' as const,
      content: steps.map(({call}) => ({
        type: 'tool-call',
        value: wrap('LanguageModelToolCall', {
          callId: call.id,
          name: call.name,
          arguments: call.args,
        }),
      })),
    },
    {
      role: 'user' as const,
      content: steps.map(({result}) => toolResponse(result)),
    },
  ];

  // One session per system prompt and tools, which each conversation clones,
  // so that Chrome reads the instructions and tools once.
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
      ...coreOptions(tools),
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

  function session(chrome: Session): ModelSession {
    let requests = 0;
    async function* turn(input: TurnInput, signal: AbortSignal) {
      if (input.kind === 'text') {
        const context = contextOf(chrome);
        if (requests > 0 && context && context.used > context.size * FULL_AT) {
          log('the context is full', context);
          throw new ContextFullError();
        }
        requests++;
        if (input.history?.length) {
          log('append() the history', JSON.stringify(input.history));
          await chrome.append(stepTurns(input.history), {signal});
        }
        log('prompt', input.text);
      } else {
        log('tool results sent back', JSON.stringify(input.results));
      }
      const prompt =
        input.kind === 'text'
          ? input.text
          : [{role: 'user', content: input.results.map(toolResponse)}];
      yield* answerEvents(chunks(chrome.promptStreaming(prompt, {signal})));
    }
    return {
      async *stream(input, signal) {
        try {
          yield* turn(input, signal);
        } catch (error) {
          if (error instanceof Error && error.name === 'QuotaExceededError')
            throw new ContextFullError({cause: error});
          throw error;
        } finally {
          const context = contextOf(chrome);
          if (context) log('context', `${context.used}/${context.size}`);
        }
      },
      destroy: () => {
        log('destroy() the clone');
        chrome.destroy();
      },
    };
  }

  return {
    async availability(tools): Promise<Availability> {
      if (!api) return 'unavailable';
      const {tools: _, ...withoutTools} = coreOptions(tools);
      try {
        return await api.availability(coreOptions(tools));
      } catch (error) {
        log('availability() rejected tools, asking without them', error);
      }
      try {
        return await api.availability(withoutTools);
      } catch (error) {
        log('availability() threw', error);
        return 'unavailable';
      }
    },
    async open({system, tools, signal}) {
      if (!api) throw new Error('This browser has no on-device model.');
      const base = await baseSession(api, system, tools);
      log('clone() the base session');
      return session(await base.clone({signal}));
    },
  };
}

/** The provider the bar uses: this browser's Prompt API. */
export const chromeProvider = createChromeProvider(
  chromeLanguageModel,
  globalThis as ToolClasses,
);
