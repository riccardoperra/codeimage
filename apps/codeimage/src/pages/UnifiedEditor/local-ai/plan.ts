import type {AgentTool, ToolResult} from '../agent-tools/tools';
import type {Parsed, TabEntry, describeControl} from '../agent-tools/values';
import {describeTabs} from '../agent-tools/values';

/** A fenced block lifted out of the request, which the plan names by `id`. */
export interface CodeBlock {
  /** `CODE_1`, `CODE_2`, in the order of the request. */
  readonly id: string;
  readonly code: string;
  /** The fence's info string, such as `ts`: a hint, not a language id. */
  readonly hint?: string;
}

export interface PlanStep {
  readonly tool: string;
  readonly args: Record<string, unknown>;
}

export interface Plan {
  readonly steps: readonly PlanStep[];
}

export interface StepResult {
  readonly tool: string;
  readonly result: ToolResult;
}

const FENCE = /```([\s\S]*?)```/g;
const PLACEHOLDER = /^CODE_\d+$/;

/**
 * Replaces each fenced block of the request with `CODE_n`, so that the model
 * plans with a short name and never has to copy the code.
 */
export function extractCodeBlocks(request: string): {
  readonly text: string;
  readonly blocks: readonly CodeBlock[];
} {
  const blocks: CodeBlock[] = [];
  const text = request.replace(FENCE, (_, body: string) => {
    const id = `CODE_${blocks.length + 1}`;
    const newline = body.indexOf('\n');
    if (newline === -1) blocks.push({id, code: body.trim()});
    else {
      const hint = body.slice(0, newline).trim().split(/\s+/)[0];
      blocks.push({
        id,
        code: body.slice(newline + 1).replace(/\n$/, ''),
        ...(hint ? {hint} : {}),
      });
    }
    return id;
  });
  return {text, blocks};
}

/** The tools a plan may call: the ones that act. Reading is the prompt's job. */
export const plannable = (tools: readonly AgentTool[]) =>
  tools.filter(tool => !tool.annotations?.readOnlyHint);

/** The JSON Schema the model's answer must follow. Small, for Gemini Nano. */
export function planSchema(tools: readonly AgentTool[]) {
  return {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tool: {type: 'string', enum: tools.map(tool => tool.name)},
            args: {type: 'object'},
          },
          required: ['tool', 'args'],
        },
      },
    },
    required: ['steps'],
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The model's answer as a plan, or why it is not one. */
export function parsePlan(answer: string): Parsed<Plan> {
  let raw: unknown;
  try {
    raw = JSON.parse(answer);
  } catch {
    return {ok: false, error: 'The model did not answer with JSON.'};
  }
  const steps = isRecord(raw) ? raw.steps : undefined;
  if (
    !Array.isArray(steps) ||
    !steps.every(step => isRecord(step) && typeof step.tool === 'string')
  )
    return {ok: false, error: 'The model did not answer with a plan.'};
  return {
    ok: true,
    value: {
      steps: steps.map(step => ({
        tool: step.tool,
        args: isRecord(step.args) ? step.args : {},
      })),
    },
  };
}

/** The step's arguments with each `CODE_n` replaced by its code. */
function withCode(
  args: Record<string, unknown>,
  blocks: readonly CodeBlock[],
): Parsed<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value !== 'string' || !PLACEHOLDER.test(value.trim())) {
      out[key] = value;
      continue;
    }
    const block = blocks.find(block => block.id === value.trim());
    if (!block)
      return {ok: false, error: `The request has no code block ${value}.`};
    out[key] = block.code;
  }
  return {ok: true, value: out};
}

/**
 * Runs the plan's steps in order through the tools, as an agent would, and
 * stops at the first that fails. `onStep` sees each result as it lands.
 */
export async function runPlan(
  plan: Plan,
  tools: readonly AgentTool[],
  blocks: readonly CodeBlock[],
  onStep: (step: StepResult) => void,
): Promise<StepResult[]> {
  const results: StepResult[] = [];
  for (const step of plan.steps) {
    const tool = tools.find(tool => tool.name === step.tool);
    const args = withCode(step.args, blocks);
    const result: ToolResult = !tool
      ? {ok: false, error: `Unknown tool "${step.tool}".`}
      : !args.ok
        ? {ok: false, error: args.error}
        : await tool.execute(args.value);
    const done = {tool: step.tool, result};
    results.push(done);
    onStep(done);
    if (!result.ok) break;
  }
  return results;
}

type DescribedControl = ReturnType<typeof describeControl>;

// Listed on their own lines of the prompt: all themes, featured languages.
const LISTED_APART = new Set(['editor.theme', 'editor.language']);

/** One line per setting: `frame.padding: 0|16|32|64|128 (now 64)`. */
export function describeSettings(
  controls: readonly DescribedControl[],
): string[] {
  return controls
    .filter(control => !LISTED_APART.has(control.id))
    .map(control => {
      const values = (() => {
        switch (control.kind) {
          case 'segmented':
          case 'select': {
            const keys = control.options.map(option => option.value);
            return keys.length > 10
              ? `${keys.slice(0, 10).join('|')}|…`
              : keys.join('|');
          }
          case 'range':
          case 'number':
            return `${control.min} to ${control.max}`;
          case 'toggle':
            return 'true|false';
          case 'background':
            return 'a CSS color or gradient';
        }
      })();
      return `${control.id}: ${values} (now ${String(control.value)})`;
    });
}

/** What the model needs to know about the editor, read when a request runs. */
export interface EditorSnapshot {
  readonly themes: readonly string[];
  readonly languages: readonly string[];
  /** One line per setting, as `describeSettings` writes them. */
  readonly settings: readonly string[];
  readonly tabs: readonly TabEntry[];
}

const firstSentence = (text: string) =>
  text.match(/^.*?\.(?=\s|$)/)?.[0] ?? text;

/** `export_image(format?: png|jpeg|svg, …)`: a tool's arguments, compactly. */
function signature(tool: AgentTool) {
  const properties = isRecord(tool.inputSchema.properties)
    ? tool.inputSchema.properties
    : {};
  const required = Array.isArray(tool.inputSchema.required)
    ? tool.inputSchema.required
    : [];
  const args = Object.entries(properties).map(([name, schema]) => {
    const values =
      isRecord(schema) && Array.isArray(schema.enum)
        ? `: ${schema.enum.join('|')}`
        : '';
    return `${name}${required.includes(name) ? '' : '?'}${values}`;
  });
  return `${tool.name}(${args.join(', ')})`;
}

/** The instructions of a session, with the editor as it is now. */
export function systemPrompt(
  tools: readonly AgentTool[],
  editor: EditorSnapshot,
): string {
  return [
    'You turn a request about the CodeImage code screenshot editor into a plan: a list of tool calls that run in order.',
    'Answer with {"steps": [{"tool": name, "args": {...}}]}. Use only what the request asks for.',
    'When the request has code, it shows as CODE_1, CODE_2. Pass that name as the "code" argument, never the code itself.',
    '',
    'Tools:',
    ...tools.map(
      tool => `- ${signature(tool)}: ${firstSentence(tool.description)}`,
    ),
    '',
    `Themes for apply_theme: ${editor.themes.join(', ')}.`,
    `Languages (more exist): ${editor.languages.join(', ')}.`,
    `Tabs: ${describeTabs(editor.tabs)}.`,
    'Settings for set_controls "values", as id: valid values (now):',
    ...editor.settings,
  ].join('\n');
}

/** The request as the model reads it, with what each code block was fenced as. */
export function requestPrompt(text: string, blocks: readonly CodeBlock[]) {
  const fenced = blocks
    .filter(block => block.hint)
    .map(block => `${block.id} was fenced as "${block.hint}".`);
  return [text.trim(), ...fenced].join('\n');
}
