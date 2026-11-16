import {describe, expect, it, vi} from 'vitest';
import type {
  BackgroundControl,
  RangeControl,
  SelectControl,
  ThemeEntry,
  ToggleControl,
} from '../model';
import {
  controlSchema,
  parseControlValue,
  resolveOption,
  resolveTab,
  resolveTheme,
  settingName,
  unavailableReason,
} from './values';

const languages = [
  {key: 'typescript', label: 'TypeScript'},
  {key: 'python', label: 'Python'},
];

function select(id: SelectControl['id'], options = languages): SelectControl {
  return {
    kind: 'select',
    id,
    label: () => id,
    visible: () => true,
    disabled: () => false,
    options: () => options,
    value: () => options[0].key,
    set: vi.fn(),
    preview: vi.fn(),
  };
}

function range(): RangeControl {
  return {
    kind: 'range',
    id: 'frame.opacity',
    label: () => 'Opacity',
    visible: () => true,
    value: () => 100,
    set: vi.fn(),
    preview: vi.fn(),
    min: 0,
    max: 100,
    step: 1,
  };
}

function toggle(visible = true): ToggleControl {
  return {
    kind: 'toggle',
    id: 'frame.visible',
    label: () => 'Visible',
    visible: () => visible,
    value: () => true,
    set: vi.fn(),
    preview: vi.fn(),
  };
}

function background(): BackgroundControl {
  return {
    kind: 'background',
    id: 'frame.background',
    label: () => 'Background',
    visible: () => true,
    value: () => '#000',
    set: vi.fn(),
    preview: vi.fn(),
    endPreview: vi.fn(),
    colors: ['#ffffff', '#ff0000'],
    gradients: ['linear-gradient(red, blue)'],
    ambient: () => ({label: 'Ambient', value: ''}),
  };
}

const theme = (id: string, name: string) =>
  ({id, name, dark: true}) as ThemeEntry;
const themes = [
  theme('dracula', 'Dracula'),
  theme('nightOwl', 'Night Owl'),
  theme('githubLight', 'GitHub Light'),
];

const anyCss = () => true;
const noCss = () => false;

describe('settingName', () => {
  it('names a setting without dots or capitals', () => {
    expect(settingName('frame.padding')).toBe('frame_padding');
    expect(settingName('editor.lineNumberStart')).toBe(
      'editor_line_number_start',
    );
  });
});

describe('resolveOption', () => {
  it('finds an option by key or by label ignoring case', () => {
    expect(resolveOption(languages, 'python')?.key).toBe('python');
    expect(resolveOption(languages, 'typescript')?.key).toBe('typescript');
    expect(resolveOption(languages, ' TYPESCRIPT ')?.key).toBe('typescript');
  });

  it('matches numeric keys given as numbers', () => {
    const padding = [{key: '32', label: '32'}];
    expect(resolveOption(padding, 32)?.key).toBe('32');
  });

  it('finds nothing for an unknown value or a non-string', () => {
    expect(resolveOption(languages, 'cobol')).toBeUndefined();
    expect(resolveOption(languages, true)).toBeUndefined();
  });
});

describe('parseControlValue', () => {
  it('commits a choice by its key, given its label', () => {
    const control = select('editor.language');
    const parsed = parseControlValue(control, 'Python', anyCss);
    expect(parsed.ok && parsed.value.value).toBe('python');
    if (parsed.ok) parsed.value.commit();
    expect(control.set).toHaveBeenCalledWith('python');
  });

  it('rejects an unknown choice and lists valid keys', () => {
    const parsed = parseControlValue(
      select('editor.language'),
      'cobol',
      anyCss,
    );
    expect(parsed).toMatchObject({ok: false});
    expect(!parsed.ok && parsed.error).toContain('typescript, python');
  });

  it('rejects a number outside the bounds instead of clamping it', () => {
    const control = range();
    expect(parseControlValue(control, 101, anyCss).ok).toBe(false);
    expect(parseControlValue(control, -1, anyCss).ok).toBe(false);
    expect(parseControlValue(control, '50', anyCss).ok).toBe(false);
    const parsed = parseControlValue(control, 100, anyCss);
    if (parsed.ok) parsed.value.commit();
    expect(control.set).toHaveBeenCalledWith(100);
  });

  it('takes only booleans for a toggle', () => {
    expect(parseControlValue(toggle(), 'true', anyCss).ok).toBe(false);
    expect(parseControlValue(toggle(), false, anyCss)).toMatchObject({
      ok: true,
      value: {value: false},
    });
  });

  it('takes a preset background, or a CSS value the browser accepts', () => {
    expect(parseControlValue(background(), '#ff0000', noCss).ok).toBe(true);
    expect(
      parseControlValue(background(), 'linear-gradient(red, blue)', noCss).ok,
    ).toBe(true);
    expect(parseControlValue(background(), 'not a color', noCss).ok).toBe(
      false,
    );
    expect(parseControlValue(background(), '#123456', anyCss).ok).toBe(true);
    expect(parseControlValue(background(), '', anyCss).ok).toBe(false);
  });
});

describe('unavailableReason', () => {
  it('blocks hidden controls and disabled choices only', () => {
    expect(unavailableReason(toggle(true))).toBeUndefined();
    expect(unavailableReason(toggle(false))).toBeDefined();
    const disabled = {...select('editor.formatter'), disabled: () => true};
    expect(unavailableReason(disabled)).toBeDefined();
  });
});

describe('controlSchema', () => {
  it('lists a fixed choice as an enum and leaves live choices open', () => {
    expect(controlSchema(select('editor.language')).enum).toEqual([
      'typescript',
      'python',
    ]);
    expect(controlSchema(select('editor.theme')).enum).toBeUndefined();
  });

  it('bounds numbers', () => {
    expect(controlSchema(range())).toMatchObject({
      type: 'number',
      minimum: 0,
      maximum: 100,
    });
  });
});

describe('resolveTheme', () => {
  it('finds a theme by id or name ignoring case', () => {
    expect(resolveTheme(themes, 'NIGHTOWL')).toMatchObject({
      ok: true,
      theme: {id: 'nightOwl'},
    });
    expect(resolveTheme(themes, 'night owl')).toMatchObject({
      ok: true,
      theme: {id: 'nightOwl'},
    });
  });

  it('suggests close names for an unknown theme', () => {
    expect(resolveTheme(themes, 'github dark')).toEqual({
      ok: false,
      suggestions: ['GitHub Light'],
    });
  });

  it('suggests every name when nothing is close', () => {
    expect(resolveTheme(themes, 'solarized')).toEqual({
      ok: false,
      suggestions: ['Dracula', 'Night Owl', 'GitHub Light'],
    });
  });
});

describe('resolveTab', () => {
  const tabs = [
    {index: 0, name: 'index.tsx', language: 'typescript', active: true},
    {index: 1, name: 'main.py', language: 'python', active: false},
  ];

  it('finds a tab by 0-based index or by name ignoring case', () => {
    expect(resolveTab(tabs, {index: 1})).toEqual({ok: true, value: tabs[1]});
    expect(resolveTab(tabs, {name: ' MAIN.PY '})).toEqual({
      ok: true,
      value: tabs[1],
    });
  });

  it('lists the tabs when none matches', () => {
    for (const input of [{index: 2}, {index: -1}, {index: 0.5}, {name: 'x'}]) {
      const found = resolveTab(tabs, input);
      expect(found.ok).toBe(false);
      expect(!found.ok && found.error).toContain(
        '0 "index.tsx" (active), 1 "main.py"',
      );
    }
  });

  it('reads nothing, a blank or "current" as the active tab', () => {
    for (const input of [
      {},
      {name: ''},
      {name: '  '},
      {name: 'current'},
      {name: 'Active'},
      {name: 'current', index: 1},
    ])
      expect(resolveTab(tabs, input)).toEqual({ok: true, value: tabs[0]});
  });

  it('prefers a matching name over the index, and an index over a wrong name', () => {
    expect(resolveTab(tabs, {index: 0, name: 'main.py'})).toEqual({
      ok: true,
      value: tabs[1],
    });
    expect(resolveTab(tabs, {index: 1, name: 'nope.ts'})).toEqual({
      ok: true,
      value: tabs[1],
    });
  });

  it('fails without an active tab when nothing names one', () => {
    const idle = tabs.map(tab => ({...tab, active: false}));
    expect(resolveTab(idle, {}).ok).toBe(false);
  });
});
