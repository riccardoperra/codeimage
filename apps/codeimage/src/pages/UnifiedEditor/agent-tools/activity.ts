import {createSignal} from 'solid-js';
import type {AgentTool} from './tools';

export type ToolSource = 'webmcp' | 'devtools' | 'local-ai';

export type CallStatus =
  | {readonly status: 'running'}
  | {readonly status: 'done'}
  | {readonly status: 'failed'; readonly error: string};

export type ToolCall = {
  readonly id: number;
  /** The tool name as the agent invoked it, such as `apply_theme`. */
  readonly tool: string;
  readonly summary: string;
  readonly source: ToolSource;
  /** A call that only reads, drawn quieter. */
  readonly readOnly: boolean;
} & CallStatus;

/** The words a summary needs, in the page's language. */
export interface SummaryWords {
  readonly lines: (count: number) => string;
  readonly toggle: (on: boolean) => string;
  readonly delivery: (delivery: string) => string;
}

/** The calls kept on screen. Older ones leave as new ones arrive. */
export const MAX_CALLS = 10;

const [calls, setCalls] = createSignal<readonly ToolCall[]>([]);
let nextId = 0;

/** What agents have called recently, oldest first. */
export const activity = {
  calls,
  running: () => calls().some(call => call.status === 'running'),
  start(call: Omit<ToolCall, 'id' | 'status'>): number {
    const id = ++nextId;
    setCalls(list =>
      [...list, {...call, id, status: 'running' as const}].slice(-MAX_CALLS),
    );
    return id;
  },
  settle(id: number, outcome: Exclude<CallStatus, {status: 'running'}>) {
    setCalls(list =>
      list.map(call => (call.id === id ? {...call, ...outcome} : call)),
    );
  },
  /** Forgets every call: the next one starts a new batch. */
  clear: () => setCalls([]),
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const lines = (code: unknown, words: SummaryWords) =>
  typeof code === 'string' ? words.lines(code.split('\n').length) : undefined;

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

// "frame.lineNumberStart" reads as "line number start".
const settingName = (id: string) =>
  (id.split('.').pop() ?? id).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

const MAX_SETTINGS = 3;

/**
 * A short account of a call's arguments for the person watching. It never
 * repeats the code, only how many lines it has.
 */
export function summarize(
  tool: string,
  input: unknown,
  words: SummaryWords,
): string {
  const args = isRecord(input) ? input : {};
  const parts: (string | undefined)[] = [];
  switch (tool) {
    case 'set_code':
      parts.push(text(args.language), lines(args.code, words));
      break;
    case 'add_tab':
      parts.push(text(args.name), text(args.language), lines(args.code, words));
      break;
    case 'select_tab':
      parts.push(
        text(args.name) ??
          (typeof args.index === 'number' ? `#${args.index + 1}` : undefined),
      );
      break;
    case 'apply_theme':
      parts.push(text(args.theme));
      break;
    case 'set_controls': {
      if (!isRecord(args.values)) break;
      const entries = Object.entries(args.values);
      const shown = entries.slice(0, MAX_SETTINGS).map(([id, value]) => {
        const shownValue =
          typeof value === 'boolean'
            ? words.toggle(value)
            : typeof value === 'string' || typeof value === 'number'
              ? String(value)
              : undefined;
        return [settingName(id), shownValue].filter(Boolean).join(' ');
      });
      const more = entries.length - shown.length;
      return [...shown, ...(more > 0 ? [`+${more}`] : [])].join(', ');
    }
    case 'export_image':
      parts.push(
        typeof args.format === 'string' ? args.format.toUpperCase() : undefined,
        typeof args.scale === 'number' ? `${args.scale}x` : undefined,
        words.delivery(
          typeof args.delivery === 'string' ? args.delivery : 'download',
        ),
      );
      break;
  }
  return parts.filter(Boolean).join(' · ');
}

/**
 * The same tools, each recording its calls in `activity` so the page can
 * show what an agent does. Results pass through unchanged.
 */
export function withActivity(
  tools: readonly AgentTool[],
  source: ToolSource,
  words: SummaryWords,
): AgentTool[] {
  return tools.map(tool => ({
    ...tool,
    execute: async input => {
      const id = activity.start({
        tool: tool.name,
        summary: summarize(tool.name, input, words),
        source,
        readOnly: tool.annotations?.readOnlyHint === true,
      });
      try {
        const result = await tool.execute(input);
        activity.settle(
          id,
          result.ok
            ? {status: 'done'}
            : {status: 'failed', error: result.error},
        );
        return result;
      } catch (error) {
        activity.settle(id, {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  }));
}
