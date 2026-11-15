import type {AgentTool, ToolResult} from '../agent-tools/tools';
import type {
  ModelProvider,
  ModelSession,
  ModelToolCall,
  ModelToolResult,
  TurnInput,
} from './model';
import {ModelStartError} from './model';

/** Turns a request may take before the run stops waiting for an answer. */
export const MAX_TURNS = 6;

export const SYSTEM_PROMPT = [
  'You edit a code screenshot in CodeImage by calling tools.',
  'The current editor state is already provided, with its tabs and valid setting values. Call get_editor_state again only after you change something and need to check it.',
  'Call list_themes when you need a theme name.',
  'Pass code exactly as the user wrote it.',
  'Do only what the user asks. When you are done, answer in one short sentence.',
].join('\n');

/** The tool whose answer seeds each session, so the model starts informed. */
const STATE_TOOL = 'get_editor_state';

export type CallStatus =
  | {readonly status: 'running'}
  | {readonly status: 'done'}
  | {readonly status: 'failed'; readonly error: string};

/** What the run shows in its list, in order. */
export type Entry =
  /** Text the model wrote before calling tools. */
  | {readonly kind: 'note'; readonly text: string}
  | ({
      readonly kind: 'call';
      readonly id: string;
      readonly tool: string;
      readonly args: unknown;
      readonly readOnly: boolean;
    } & CallStatus);

export type Phase =
  /** Waiting for the model. */
  | {readonly kind: 'thinking'}
  | {readonly kind: 'calling'}
  | {readonly kind: 'answered'}
  | {readonly kind: 'turn-limit'}
  | {readonly kind: 'unavailable'}
  | {readonly kind: 'cannot-start'; readonly reason: ModelStartError['reason']}
  | {readonly kind: 'failed'; readonly message: string}
  | {readonly kind: 'stopped'};

export type Ending = Exclude<Phase, {kind: 'thinking' | 'calling'}>;

export interface Run {
  readonly phase: Phase;
  readonly entries: readonly Entry[];
  /** The model's text in the current turn: the answer once it is answered. */
  readonly text: string;
}

type AgentEvent =
  | {readonly type: 'turn'}
  | {readonly type: 'text'; readonly text: string}
  | {
      readonly type: 'call';
      readonly call: ModelToolCall;
      readonly readOnly: boolean;
    }
  | {readonly type: 'settled'; readonly id: string; readonly status: CallStatus}
  | {readonly type: 'end'; readonly phase: Ending};

export const initialRun: Run = {
  phase: {kind: 'thinking'},
  entries: [],
  text: '',
};

export function reduce(run: Run, event: AgentEvent): Run {
  switch (event.type) {
    case 'turn':
      return {...run, phase: {kind: 'thinking'}};
    case 'text':
      return {...run, text: run.text + event.text};
    case 'call': {
      const note = run.text.trim();
      return {
        phase: {kind: 'calling'},
        text: '',
        entries: [
          ...run.entries,
          ...(note ? [{kind: 'note' as const, text: note}] : []),
          {
            kind: 'call',
            id: event.call.id,
            tool: event.call.name,
            args: event.call.args,
            readOnly: event.readOnly,
            status: 'running',
          },
        ],
      };
    }
    case 'settled':
      return {
        ...run,
        phase: {kind: 'thinking'},
        entries: run.entries.map(entry =>
          entry.kind === 'call' && entry.id === event.id
            ? {...entry, ...event.status}
            : entry,
        ),
      };
    case 'end':
      return {...run, phase: event.phase, text: run.text.trim()};
  }
}

async function execute(
  tools: readonly AgentTool[],
  call: ModelToolCall,
): Promise<ToolResult> {
  const tool = tools.find(tool => tool.name === call.name);
  if (!tool) return {ok: false, error: `Unknown tool "${call.name}".`};
  try {
    return await tool.execute(call.args);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function toModel(callId: string, result: ToolResult): ModelToolResult {
  if (!result.ok) return {callId, ok: false, output: result.error};
  const {ok: _, ...output} = result;
  return {callId, ok: true, output};
}

/**
 * Sends the request to the model with the tools, runs each call it makes and
 * sends the results back, turn after turn, until it answers. `onChange` sees
 * every state of the run.
 */
export async function runAgent(
  options: {
    readonly provider: ModelProvider;
    readonly tools: readonly AgentTool[];
    readonly request: string;
    readonly signal: AbortSignal;
    readonly maxTurns?: number;
  },
  onChange: (run: Run) => void,
): Promise<Run> {
  const {provider, tools, signal, maxTurns = MAX_TURNS} = options;
  let run = initialRun;
  const dispatch = (event: AgentEvent) => {
    run = reduce(run, event);
    onChange(run);
    return run;
  };
  const end = (phase: Ending) => dispatch({type: 'end', phase});

  onChange(run);
  let session: ModelSession | undefined;
  try {
    if ((await provider.availability()) !== 'available')
      return end({kind: 'unavailable'});
    // Read by us, not by the model, so the list leaves it out.
    const state = tools.some(tool => tool.name === STATE_TOOL)
      ? {id: 'state-0', name: STATE_TOOL, args: {}}
      : undefined;
    const history = state
      ? [{call: state, result: toModel(state.id, await execute(tools, state))}]
      : [];
    session = await provider.open({
      system: SYSTEM_PROMPT,
      history,
      tools: tools.map(({name, description, inputSchema}) => ({
        name,
        description,
        inputSchema,
      })),
      signal,
    });
    let input: TurnInput = {kind: 'text', text: options.request};
    for (let turn = 1; ; turn++) {
      const results: ModelToolResult[] = [];
      let reason: 'stop' | 'tool-calls' = 'stop';
      for await (const event of session.stream(input, signal)) {
        if (signal.aborted) break;
        if (event.type === 'text-delta') {
          dispatch({type: 'text', text: event.text});
        } else if (event.type === 'tool-call') {
          const tool = tools.find(tool => tool.name === event.call.name);
          dispatch({
            type: 'call',
            call: event.call,
            readOnly: tool?.annotations?.readOnlyHint === true,
          });
          const result = await execute(tools, event.call);
          dispatch({
            type: 'settled',
            id: event.call.id,
            status: result.ok
              ? {status: 'done'}
              : {status: 'failed', error: result.error},
          });
          results.push(toModel(event.call.id, result));
        } else {
          reason = event.reason;
        }
      }
      if (signal.aborted) return end({kind: 'stopped'});
      if (reason === 'stop' || results.length === 0)
        return end({kind: 'answered'});
      if (turn >= maxTurns) return end({kind: 'turn-limit'});
      dispatch({type: 'turn'});
      input = {kind: 'tool-results', results};
    }
  } catch (error) {
    if (signal.aborted) return end({kind: 'stopped'});
    if (error instanceof ModelStartError)
      return end({kind: 'cannot-start', reason: error.reason});
    return end({
      kind: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    session?.destroy();
  }
}
