import type {LanguageModelApi, Session} from './language-model';
import {chromeLanguageModel, log} from './language-model';
import {
  chunks,
  conversation,
  createBaseSessions,
  isRecord,
  newText,
  plainSchema,
} from './prompt-api';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
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

/** What a session that calls tools expects, whatever its tools. */
export const NATIVE_PROBE = {expectedInputs: INPUTS, expectedOutputs: OUTPUTS};

const errorMessage = (output: unknown) =>
  typeof output === 'string' ? output : JSON.stringify(output);

/** Turns one streamed answer into events. */
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
      const delta = newText(text, part.value);
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

const declare = ({name, description, inputSchema}: ToolSpec) => ({
  name,
  description,
  inputSchema: plainSchema(inputSchema) as object,
});

/** What availability() and create() both take, as the explainer asks. */
const coreOptions = (tools: readonly ToolSpec[]) => ({
  tools: tools.map(declare),
  ...NATIVE_PROBE,
});

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

  async function* turn(chrome: Session, input: TurnInput, signal: AbortSignal) {
    if (input.kind === 'text') {
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

  const clone = api && createBaseSessions(api);

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
      if (!clone) throw new Error('This browser has no on-device model.');
      const chrome = await clone(
        {
          initialPrompts: [{role: 'system', content: system}],
          ...coreOptions(tools),
        },
        signal,
      );
      return conversation(chrome, (input, signal) =>
        turn(chrome, input, signal),
      );
    },
  };
}

/** The provider the bar uses: this browser's Prompt API. */
export const chromeProvider = createChromeProvider(
  chromeLanguageModel,
  globalThis as ToolClasses,
);
