/**
 * What the editor needs from a language model that calls tools, whatever runs
 * it. A provider owns the wire format: call ids, result wrappers, streaming.
 */

/** Whether the model can run here, in the Prompt API's words. */
export type Availability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

export interface ToolSpec {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: object;
}

export interface ModelToolCall {
  readonly id: string;
  readonly name: string;
  readonly args: unknown;
}

export interface ModelToolResult {
  /** The model's own id for the call, sent back as is, even when empty. */
  readonly callId: string;
  readonly name: string;
  readonly ok: boolean;
  /** What the tool returned, or the error message when `ok` is false. */
  readonly output: unknown;
}

/** A call and the result that answered it. */
export interface ToolStep {
  readonly call: ModelToolCall;
  readonly result: ModelToolResult;
}

export type TurnInput =
  | {
      readonly kind: 'text';
      readonly text: string;
      /** Calls to add before the text, as if the model had made them. */
      readonly history?: readonly ToolStep[];
    }
  | {
      readonly kind: 'tool-results';
      readonly results: readonly ModelToolResult[];
    };

export type ModelEvent =
  | {readonly type: 'text-delta'; readonly text: string}
  | {readonly type: 'tool-call'; readonly call: ModelToolCall}
  /** The text since the last call was the model's reasoning, not its answer. */
  | {readonly type: 'reasoned'}
  | {readonly type: 'done'; readonly reason: 'stop' | 'tool-calls'};

/**
 * One conversation: each text turn continues from the turns before it. A
 * stream throws ContextFullError when the session has no room for the turn.
 */
export interface ModelSession {
  stream(input: TurnInput, signal: AbortSignal): AsyncIterable<ModelEvent>;
  destroy(): void;
}

export interface ModelProvider {
  /** Whether a session with these tools can run, asked as `open()` asks. */
  availability(tools: readonly ToolSpec[]): Promise<Availability>;
  open(input: {
    readonly system: string;
    readonly tools: readonly ToolSpec[];
    readonly signal: AbortSignal;
  }): Promise<ModelSession>;
}

/**
 * `open()` could not start a session: the model lacks the resources to run,
 * such as disk space, or cannot run with tools here.
 */
export class ModelStartError extends Error {
  constructor(
    readonly reason: 'resources' | 'unsupported',
    options?: {cause?: unknown},
  ) {
    super(`The model could not start (${reason}).`, options);
    this.name = 'ModelStartError';
  }
}

/** The session's context has no room left for the turn. */
export class ContextFullError extends Error {
  constructor(options?: {cause?: unknown}) {
    super("The request does not fit in the model's context.", options);
    this.name = 'ContextFullError';
  }
}
