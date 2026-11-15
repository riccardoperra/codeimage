import {describe, expect, it, vi} from 'vitest';
import type {AgentTool, ToolResult} from '../agent-tools/tools';
import type {StepResult} from './plan';
import {
  describeSettings,
  extractCodeBlocks,
  parsePlan,
  planSchema,
  plannable,
  runPlan,
  systemPrompt,
} from './plan';

function tool(
  name: string,
  result: ToolResult = {ok: true},
  readOnly = false,
): AgentTool & {execute: ReturnType<typeof vi.fn>} {
  return {
    name,
    title: name,
    description: `Does ${name}. More detail that the prompt leaves out.`,
    inputSchema: {
      type: 'object',
      properties: {
        code: {type: 'string'},
        format: {type: 'string', enum: ['png', 'svg']},
      },
      required: ['code'],
    },
    annotations: readOnly ? {readOnlyHint: true} : undefined,
    execute: vi.fn(async () => result),
  };
}

describe('extractCodeBlocks', () => {
  it('replaces each fenced block with a placeholder and keeps its code and hint', () => {
    const {text, blocks} = extractCodeBlocks(
      'add ```ts\nconst a = 1;\nconst b = 2;\n``` then ```print(1)``` please',
    );
    expect(text).toBe('add CODE_1 then CODE_2 please');
    expect(blocks).toEqual([
      {id: 'CODE_1', code: 'const a = 1;\nconst b = 2;', hint: 'ts'},
      {id: 'CODE_2', code: 'print(1)'},
    ]);
  });

  it('leaves a request without fences as it is', () => {
    expect(extractCodeBlocks('use Dracula')).toEqual({
      text: 'use Dracula',
      blocks: [],
    });
  });
});

describe('parsePlan', () => {
  it('reads the steps, defaulting missing arguments to none', () => {
    expect(
      parsePlan('{"steps":[{"tool":"a","args":{"x":1}},{"tool":"b"}]}'),
    ).toEqual({
      ok: true,
      value: {
        steps: [
          {tool: 'a', args: {x: 1}},
          {tool: 'b', args: {}},
        ],
      },
    });
  });

  it('rejects an answer that is not a plan', () => {
    expect(parsePlan('sure!').ok).toBe(false);
    expect(parsePlan('{"steps":"none"}').ok).toBe(false);
    expect(parsePlan('{"steps":[{"args":{}}]}').ok).toBe(false);
  });
});

describe('planSchema', () => {
  it('lets the model name only the tools that act', () => {
    const tools = plannable([
      tool('get_editor_state', {ok: true}, true),
      tool('apply_theme'),
      tool('export_image'),
    ]);
    expect(
      planSchema(tools).properties.steps.items.properties.tool.enum,
    ).toEqual(['apply_theme', 'export_image']);
  });
});

describe('runPlan', () => {
  it('runs the steps in order with the code in place of its placeholder', async () => {
    const addTab = tool('add_tab');
    const exportImage = tool('export_image');
    const seen: StepResult[] = [];
    const results = await runPlan(
      {
        steps: [
          {tool: 'add_tab', args: {code: 'CODE_1', name: 'a.py'}},
          {tool: 'export_image', args: {format: 'png'}},
        ],
      },
      [addTab, exportImage],
      [{id: 'CODE_1', code: 'print(1)'}],
      step => seen.push(step),
    );
    expect(addTab.execute).toHaveBeenCalledWith({
      code: 'print(1)',
      name: 'a.py',
    });
    expect(exportImage.execute).toHaveBeenCalledWith({format: 'png'});
    expect(results.map(step => step.result.ok)).toEqual([true, true]);
    expect(seen).toEqual(results);
  });

  it('stops at the first step that fails', async () => {
    const failing = tool('apply_theme', {ok: false, error: 'Unknown theme'});
    const after = tool('export_image');
    const results = await runPlan(
      {
        steps: [
          {tool: 'apply_theme', args: {}},
          {tool: 'export_image', args: {}},
        ],
      },
      [failing, after],
      [],
      () => {},
    );
    expect(results).toEqual([
      {tool: 'apply_theme', result: {ok: false, error: 'Unknown theme'}},
    ]);
    expect(after.execute).not.toHaveBeenCalled();
  });

  it('fails an unknown tool or code block without calling anything', async () => {
    const addTab = tool('add_tab');
    const unknown = await runPlan(
      {steps: [{tool: 'delete_everything', args: {}}]},
      [addTab],
      [],
      () => {},
    );
    expect(unknown[0].result).toMatchObject({ok: false});
    const missing = await runPlan(
      {steps: [{tool: 'add_tab', args: {code: 'CODE_2'}}]},
      [addTab],
      [{id: 'CODE_1', code: 'x'}],
      () => {},
    );
    expect(missing[0].result).toMatchObject({ok: false});
    expect(addTab.execute).not.toHaveBeenCalled();
  });
});

describe('systemPrompt', () => {
  it('names every tool with its arguments, and the editor as it is', () => {
    const prompt = systemPrompt([tool('add_tab'), tool('export_image')], {
      themes: ['Dracula', 'Night Owl'],
      languages: ['typescript', 'python'],
      settings: describeSettings([
        {
          id: 'frame.padding',
          kind: 'segmented',
          label: 'Padding',
          value: '64',
          options: ['0', '32', '64'].map(value => ({value, label: value})),
        },
        {
          id: 'editor.theme',
          kind: 'select',
          label: 'Theme',
          value: 'dracula',
          options: [{value: 'dracula', label: 'Dracula'}],
        },
      ]),
      tabs: [
        {index: 0, name: 'index.tsx', language: 'typescript', active: true},
      ],
    });
    expect(prompt).toContain('add_tab(code, format?: png|svg): Does add_tab.');
    expect(prompt).not.toContain('More detail');
    expect(prompt).toContain('Dracula, Night Owl');
    expect(prompt).toContain('frame.padding: 0|32|64 (now 64)');
    expect(prompt).not.toContain('editor.theme:');
    expect(prompt).toContain('0 "index.tsx" (active)');
  });
});
