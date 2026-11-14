import type {Control, EditorControlsModel} from '../../model';
import type {Fields, View} from './fields';
import {isChoice, PLACES} from './fields';
import type {Previewable} from './preview';
import {shownTheme, themePreview} from './preview';

export interface Command {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  /** Shown at the end of the row: the state of a switch, or a shortcut. */
  readonly note?: string;
  /** True when the command is the value in use. */
  readonly current?: boolean;
  /** Highlighting the command shows this on the canvas. Enter keeps it. */
  readonly preview?: Previewable;
  /** For commands with nothing to preview. */
  readonly run?: () => void;
}

export interface Action {
  readonly label: string;
  readonly note?: string;
  readonly run: () => void;
}

const RANGE_STOPS = [0, 0.25, 0.5, 0.75, 1];

function controlCommands(
  control: Control,
  group: string,
  fields: Fields,
  open: (view: View) => void,
): Command[] {
  const label = control.label();
  const base = {group, id: control.id};

  if (control.kind === 'toggle') {
    const on = control.value();
    return [
      {
        ...base,
        label: `Toggle ${label.toLowerCase()}`,
        note: on ? 'On' : 'Off',
        preview: {
          scope: control.id,
          key: control.id,
          apply: () => control.set(!on),
          capture: () => () => control.set(on),
        },
      },
    ];
  }

  if (isChoice(control)) {
    if (control.disabled()) return [];
    const value = control.value();
    return control.options().map(option => ({
      group,
      id: `${control.id}=${option.key}`,
      label: `${label}: ${option.label}`,
      current: option.key === value,
      preview: fields.preview(control, option.key),
    }));
  }

  if (control.kind === 'range') {
    const before = control.value();
    const stops = RANGE_STOPS.map(stop => {
      const raw = control.min + (control.max - control.min) * stop;
      return Math.round(raw / control.step) * control.step;
    });
    return stops.map(stop => ({
      group,
      id: `${control.id}=${stop}`,
      label: `${label}: ${stop}`,
      current: stop === before,
      preview: {
        scope: control.id,
        key: `${control.id}=${stop}`,
        apply: () => control.set(stop),
        capture: () => () => control.set(before),
      },
    }));
  }

  // A number, a colour or an upload has no list of values to offer, so the
  // command opens the place where the control lives.
  return [
    {...base, label: `${label}…`, run: () => open(PLACES[control.id].view)},
  ];
}

/**
 * Every theme, every option of every visible control, and the actions. Call
 * it once when the menu opens: previews change the values it reads, and a
 * list that reorders under the highlight cannot be navigated.
 */
export function buildCommands(input: {
  model: EditorControlsModel;
  fields: Fields;
  actions: readonly Action[];
  open: (view: View) => void;
}): Command[] {
  const {model, fields, actions, open} = input;
  const shown = shownTheme(model);

  return [
    ...actions.map(
      (action, index): Command => ({
        id: `action=${index}`,
        group: 'Actions',
        label: action.label,
        note: action.note,
        run: action.run,
      }),
    ),
    ...model.themes().map(
      (theme): Command => ({
        id: `theme=${theme.id}`,
        group: 'Theme',
        label: `Theme: ${theme.name}`,
        current: theme.id === shown?.id,
        preview: themePreview(model, theme),
      }),
    ),
    ...fields.sections.flatMap(section =>
      section.controls
        .filter(control => control.visible())
        .flatMap(control =>
          controlCommands(control, section.label(), fields, open),
        ),
    ),
  ];
}

export function filterCommands(
  commands: readonly Command[],
  query: string,
): readonly Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;
  return commands.filter(command => {
    const text = `${command.group} ${command.label}`.toLowerCase();
    return words.every(word => text.includes(word));
  });
}
