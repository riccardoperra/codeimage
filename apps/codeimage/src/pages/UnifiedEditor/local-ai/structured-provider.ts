import type {LanguageModelApi, Session} from './language-model';
import {chromeLanguageModel, LANGUAGES, log} from './language-model';
import type {
  Availability,
  ModelEvent,
  ModelProvider,
  ModelToolResult,
  ToolSpec,
  ToolStep,
  TurnInput,
} from './model';
import {
  chunks,
  conversation,
  createBaseSessions,
  isRecord,
  newText,
  plainSchema,
} from './prompt-api';

/** One reply of the model, which is one step of the protocol. */
export type Step =
  | {readonly kind: 'reason'; readonly text: string}
  | {
      readonly kind: 'tool';
      readonly name: string;
      readonly args: Record<string, unknown>;
    }
  | {readonly kind: 'answer'; readonly text: string};

const REASON_LENGTH = 200;
const ANSWER_LENGTH = 300;

export const CONTINUE = 'Continue with the next step.';
export const RETRY = 'Reply with one valid JSON step.';

// The grammar needs no descriptions, and additionalProperties keeps a small
// model from inventing arguments.
const GRAMMAR_KEYS: ReadonlySet<string> = new Set([
  'type',
  'properties',
  'required',
  'enum',
  'minimum',
  'maximum',
  'items',
  'additionalProperties',
]);

const textStep = (kind: 'reason' | 'answer', maxLength: number) => ({
  type: 'object',
  properties: {
    kind: {type: 'string', enum: [kind]},
    text: {type: 'string', maxLength},
  },
  required: ['kind', 'text'],
  additionalProperties: false,
});

/**
 * The responseConstraint of a turn: one branch per tool, so that the grammar
 * holds each tool's arguments to its own schema.
 */
export function stepSchema(
  tools: readonly ToolSpec[],
  withReason: boolean,
): object {
  return {
    oneOf: [
      ...(withReason ? [textStep('reason', REASON_LENGTH)] : []),
      ...tools.map(tool => ({
        type: 'object',
        properties: {
          kind: {type: 'string', enum: ['tool']},
          name: {type: 'string', enum: [tool.name]},
          args: plainSchema(tool.inputSchema, GRAMMAR_KEYS),
        },
        required: ['kind', 'name', 'args'],
        additionalProperties: false,
      })),
      textStep('answer', ANSWER_LENGTH),
    ],
  };
}

const firstSentence = (text: string) => text.split(/(?<=\.)\s/)[0];

/** The shared instructions, the tools as text, and the protocol. */
export function structuredSystem(
  system: string,
  tools: readonly ToolSpec[],
): string {
  return [
    system,
    'Tools, each with its arguments as JSON Schema:',
    ...tools.map(
      tool =>
        `- ${tool.name}: ${firstSentence(tool.description)} Args: ${JSON.stringify(plainSchema(tool.inputSchema))}`,
    ),
    'Reply with exactly one JSON step per turn:',
    '- {"kind":"reason","text":"..."} to think in one short sentence before you act',
    '- {"kind":"tool","name":"<tool>","args":{...}} to call one tool. Its result comes back as {"tool":"<tool>","ok":true,"result":...} or {"tool":"<tool>","ok":false,"error":"..."}',
    '- {"kind":"answer","text":"..."} when you are done',
  ].join('\n');
}

export function parseStep(
  text: string,
  tools: readonly ToolSpec[],
): Step | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  const {kind, name, args} = value;
  if (
    (kind === 'reason' || kind === 'answer') &&
    typeof value.text === 'string'
  )
    return {kind, text: value.text};
  if (
    kind === 'tool' &&
    typeof name === 'string' &&
    tools.some(tool => tool.name === name)
  )
    return {
      kind,
      name,
      args: isRecord(args) && !Array.isArray(args) ? args : {},
    };
  return undefined;
}

const toolStep = (name: string, args: unknown) =>
  JSON.stringify({kind: 'tool', name, args});

const resultLine = ({name, ok, output}: ModelToolResult) =>
  JSON.stringify(
    ok ? {tool: name, ok, result: output} : {tool: name, ok, error: output},
  );

/**
 * Chrome's on-device model through the plain Prompt API: no native tools, the
 * model replies with JSON steps that a per-turn responseConstraint holds to
 * the protocol.
 */
export function createStructuredProvider(
  api: LanguageModelApi | undefined,
): ModelProvider {
  const clone = api && createBaseSessions(api);

  async function reply(
    chrome: Session,
    prompt: string,
    schema: object,
    signal: AbortSignal,
  ) {
    let text = '';
    const stream = chrome.promptStreaming(prompt, {
      signal,
      responseConstraint: schema,
      // The system prompt already describes the steps, and the schema would
      // take thousands of tokens of context on every turn.
      omitResponseConstraintInput: true,
    });
    for await (const chunk of chunks(stream)) {
      if (typeof chunk === 'string') text += newText(text, chunk);
      else log('ignored an output chunk', chunk);
    }
    log('model step', text);
    return text;
  }

  return {
    async availability(): Promise<Availability> {
      if (!api) return 'unavailable';
      try {
        return await api.availability(LANGUAGES);
      } catch (error) {
        log('availability() threw', error);
        return 'unavailable';
      }
    },
    async open({system, tools, signal}) {
      if (!clone) throw new Error('This browser has no on-device model.');
      const chrome = await clone(
        {
          initialPrompts: [
            {role: 'system', content: structuredSystem(system, tools)},
          ],
          ...LANGUAGES,
        },
        signal,
      );
      log(
        'responseConstraint size',
        JSON.stringify(stepSchema(tools, true)).length,
      );
      let calls = 0;

      const stepTurns = (steps: readonly ToolStep[]) =>
        steps.flatMap(({call, result}) => [
          {role: 'assistant', content: toolStep(call.name, call.args)},
          {role: 'user', content: resultLine(result)},
        ]);

      // At most one reason and one retry per turn, so a turn always ends.
      async function* turn(
        input: TurnInput,
        signal: AbortSignal,
      ): AsyncGenerator<ModelEvent> {
        let prompt: string;
        if (input.kind === 'text') {
          if (input.history?.length) {
            log('append() the history', JSON.stringify(input.history));
            await chrome.append(stepTurns(input.history), {signal});
          }
          prompt = input.text;
        } else {
          prompt = input.results.map(resultLine).join('\n');
        }
        let reasoned = false;
        let retried = false;
        for (;;) {
          log('prompt', prompt);
          const text = await reply(
            chrome,
            prompt,
            stepSchema(tools, !reasoned),
            signal,
          );
          const step = parseStep(text, tools);
          if (!step || (step.kind === 'reason' && reasoned)) {
            if (retried)
              throw new Error(
                'The model did not reply with a valid JSON step.',
              );
            retried = true;
            prompt = RETRY;
          } else if (step.kind === 'reason') {
            reasoned = true;
            yield {type: 'text-delta', text: step.text};
            yield {type: 'reasoned'};
            prompt = CONTINUE;
          } else if (step.kind === 'tool') {
            const call = {id: `s-${++calls}`, name: step.name, args: step.args};
            log('model called', JSON.stringify(call));
            yield {type: 'tool-call', call};
            yield {type: 'done', reason: 'tool-calls'};
            return;
          } else {
            yield {type: 'text-delta', text: step.text};
            yield {type: 'done', reason: 'stop'};
            return;
          }
        }
      }

      return conversation(chrome, turn);
    },
  };
}

export const structuredProvider = createStructuredProvider(chromeLanguageModel);
