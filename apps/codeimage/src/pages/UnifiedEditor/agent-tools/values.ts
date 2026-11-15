import type {ChoiceOption, Control, ControlId, ThemeEntry} from '../model';

/** A control an agent can read and set: every kind but the production pickers. */
export type AgentControl = Exclude<Control, {kind: 'custom'}>;

export type Parsed<T> =
  | {readonly ok: true; readonly value: T}
  | {readonly ok: false; readonly error: string};

const normalize = (text: string) => text.trim().toLowerCase();

/** The option whose key, or whose label ignoring case, is the raw value. */
export function resolveOption(
  options: readonly ChoiceOption[],
  raw: unknown,
): ChoiceOption | undefined {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const text = String(raw);
  return (
    options.find(option => option.key === text) ??
    options.find(option => normalize(option.label) === normalize(text))
  );
}

export function describeOptions(options: readonly ChoiceOption[], limit = 12) {
  const listed = options
    .slice(0, limit)
    .map(option => option.key)
    .join(', ');
  return options.length > limit
    ? `${listed} and ${options.length - limit} more`
    : listed;
}

/** What `get_editor_state` reports for a control. */
export function describeControl(control: AgentControl) {
  const base = {id: control.id, kind: control.kind, label: control.label()};
  switch (control.kind) {
    case 'segmented':
    case 'select':
      return {
        ...base,
        value: control.value(),
        options: control
          .options()
          .map(option => ({value: option.key, label: option.label})),
      };
    case 'range':
      return {
        ...base,
        value: control.value(),
        min: control.min,
        max: control.max,
        step: control.step,
      };
    case 'number':
      return {
        ...base,
        value: control.value(),
        min: control.min,
        max: control.max,
      };
    case 'toggle':
    case 'background':
      return {...base, value: control.value()};
  }
}

/**
 * Why an agent cannot set the control now, if it cannot. A hidden row is one
 * the sidebar does not show, such as opacity while the frame is hidden.
 */
export function unavailableReason(control: AgentControl): string | undefined {
  if (!control.visible())
    return `"${control.id}" is hidden in the current state (for example frame.opacity while frame.visible is false).`;
  if (
    (control.kind === 'select' || control.kind === 'segmented') &&
    control.disabled()
  )
    return `"${control.id}" has a single option and cannot change now.`;
  return undefined;
}

/** A parsed value, and the write that commits it to its control. */
export interface ControlWrite {
  readonly value: boolean | number | string;
  readonly commit: () => void;
}

/**
 * Parses an agent's value for a control. Choices take an option key or label,
 * numbers must lie within the bounds, and a background must be a preset or a
 * CSS background the browser accepts.
 */
export function parseControlValue(
  control: AgentControl,
  raw: unknown,
  isCssBackground: (value: string) => boolean,
): Parsed<ControlWrite> {
  const write = <T extends ControlWrite['value']>(
    value: T,
    set: (value: T) => void,
  ) => ({ok: true, value: {value, commit: () => set(value)}}) as const;
  switch (control.kind) {
    case 'toggle':
      return typeof raw === 'boolean'
        ? write(raw, control.set)
        : {ok: false, error: `"${control.id}" takes true or false.`};
    case 'segmented':
    case 'select': {
      const option = resolveOption(control.options(), raw);
      return option
        ? write(option.key, control.set)
        : {
            ok: false,
            error: `"${control.id}" takes one of: ${describeOptions(control.options())}.`,
          };
    }
    case 'range':
    case 'number':
      if (typeof raw !== 'number' || !Number.isFinite(raw))
        return {ok: false, error: `"${control.id}" takes a number.`};
      if (raw < control.min || raw > control.max)
        return {
          ok: false,
          error: `"${control.id}" takes a number from ${control.min} to ${control.max}; got ${raw}.`,
        };
      return write(raw, control.set);
    case 'background': {
      const value = typeof raw === 'string' ? raw.trim() : '';
      const preset =
        control.colors.includes(value) || control.gradients.includes(value);
      return value && (preset || isCssBackground(value))
        ? write(value, control.set)
        : {
            ok: false,
            error: `"${control.id}" takes a CSS color or gradient, such as ${control.colors.slice(0, 3).join(', ')}.`,
          };
    }
  }
}

// Choices whose options change while the page runs: themes load one by one and
// the formatters follow the language. A schema enum built at registration
// would reject their later values, so these list them in get_editor_state.
const LIVE_OPTIONS: ReadonlySet<ControlId> = new Set([
  'editor.theme',
  'editor.formatter',
]);

/** The JSON Schema of a control's value in `set_controls`. */
export function controlSchema(control: AgentControl): Record<string, unknown> {
  const label = control.label();
  switch (control.kind) {
    case 'toggle':
      return {type: 'boolean', description: label};
    case 'segmented':
    case 'select':
      return LIVE_OPTIONS.has(control.id)
        ? {
            type: 'string',
            description: `${label}. An option value from get_editor_state.`,
          }
        : {
            type: 'string',
            enum: control.options().map(option => option.key),
            description: `${label}. ${control
              .options()
              .map(option => `${option.key} = ${option.label}`)
              .join(', ')}.`,
          };
    case 'range':
    case 'number':
      return {
        type: 'number',
        minimum: control.min,
        maximum: control.max,
        description: label,
      };
    case 'background':
      return {
        type: 'string',
        description: `${label}. Any CSS color or gradient. Preset colors: ${control.colors.join(', ')}. Preset gradients: ${control.gradients.join('; ')}.`,
      };
  }
}

/** The theme whose id or name is the query, ignoring case, or close matches. */
export function resolveTheme(
  themes: readonly ThemeEntry[],
  query: string,
):
  | {readonly ok: true; readonly theme: ThemeEntry}
  | {readonly ok: false; readonly suggestions: readonly string[]} {
  const wanted = normalize(query);
  const theme =
    themes.find(theme => normalize(theme.id) === wanted) ??
    themes.find(theme => normalize(theme.name) === wanted);
  if (theme) return {ok: true, theme};
  const words = wanted.split(/[\s_-]+/).filter(Boolean);
  const close = themes.filter(theme => {
    const name = normalize(`${theme.name} ${theme.id}`);
    return words.length > 0 && words.some(word => name.includes(word));
  });
  return {
    ok: false,
    suggestions: (close.length ? close : themes).map(theme => theme.name),
  };
}

/** A tab as `get_editor_state` reports it. */
export interface TabEntry {
  readonly index: number;
  readonly name: string;
  readonly language: string;
  readonly active: boolean;
}

export const describeTabs = (tabs: readonly TabEntry[]) =>
  tabs
    .map(
      tab =>
        `${tab.index} "${tab.name || 'untitled'}"${tab.active ? ' (active)' : ''}`,
    )
    .join(', ');

/** The tab an agent names by its 0-based index or by its name, ignoring case. */
export function resolveTab(
  tabs: readonly TabEntry[],
  input: {readonly index?: unknown; readonly name?: unknown},
): Parsed<TabEntry> {
  const {index, name} = input;
  const missing = (what: string): Parsed<TabEntry> => ({
    ok: false,
    error: `${what} Tabs: ${describeTabs(tabs)}.`,
  });
  if ((index === undefined) === (name === undefined))
    return missing('Pass either "index" or "name".');
  if (index !== undefined) {
    const tab =
      typeof index === 'number' && Number.isInteger(index)
        ? tabs[index]
        : undefined;
    return tab
      ? {ok: true, value: tab}
      : missing(`No tab at index ${String(index)}.`);
  }
  const tab =
    typeof name === 'string'
      ? tabs.find(tab => normalize(tab.name) === normalize(name))
      : undefined;
  return tab
    ? {ok: true, value: tab}
    : missing(`No tab named "${String(name)}".`);
}
