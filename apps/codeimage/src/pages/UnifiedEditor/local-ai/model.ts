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
  | {readonly kind: 'text'; readonly text: string}
  | {
      readonly kind: 'tool-results';
      readonly results: readonly ModelToolResult[];
    };

export type ModelEvent =
  | {readonly type: 'text-delta'; readonly text: string}
  | {readonly type: 'tool-call'; readonly call: ModelToolCall}
  | {readonly type: 'done'; readonly reason: 'stop' | 'tool-calls'};

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
    /** Calls the session starts with, as if the model had made them. */
    readonly history?: readonly ToolStep[];
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
