import {getFrameState} from '@codeimage/store/editor/frame';
import type {Control, ControlId, EditorControlsModel} from '../model';
import type {ListedModel} from './listed-model';
import {isChoice, shownTheme} from './listed-model';

export interface Command {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  /** Shown at the end of the row: the state of a switch, or a shortcut. */
  readonly note?: string;
  /** True when the command is the value in use. */
  readonly current?: boolean;
  /** Shows the command on the canvas through the model's preview session. */
  readonly preview?: () => void;
  /** Saves the command, or runs it when it has nothing to preview. */
  readonly run: () => void;
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
  model: EditorControlsModel,
  reveal: ((id: ControlId) => void) | undefined,
): Command[] {
  const label = control.label();

  if (control.kind === 'toggle') {
    const on = control.value();
    return [
      {
        group,
        id: control.id,
        label: `Toggle ${label.toLowerCase()}`,
        note: on ? 'On' : 'Off',
        preview: () => control.preview(!on),
        run: () => control.set(!on),
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
      preview: () => control.preview(option.key),
      run: () => control.set(option.key),
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
      preview: () => control.preview(stop),
      run: () => control.set(stop),
    }));
  }

  if (control.kind === 'background') {
    const frame = getFrameState();
    const value = control.value();
    const fills = [
      ...control.gradients.map((fill, index) => ({
        fill,
        name: `gradient ${index + 1}`,
      })),
      ...control.colors.map(fill => ({fill, name: fill})),
    ];
    fills.unshift({
      fill: control.ambient().value,
      name: control.ambient().label,
    });
    return fills.map(({fill, name}) => ({
      group,
      id: `${control.id}=${fill}`,
      label: `${label}: ${name}`,
      current: fill === value,
      preview: () => model.preview(() => frame.setBackground(fill)),
      run: () => control.set(fill),
    }));
  }

  // A number or an upload has no list of values to offer. The command shows
  // where the control lives, in a layout that can say so.
  if (!reveal) return [];
  return [
    {
      group,
      id: control.id,
      label: `${label}…`,
      run: () => reveal(control.id),
    },
  ];
}

/**
 * Every theme, every option of every visible control, and the actions. Call
 * it once when the menu opens: previews change the values it reads, and a
 * list that reorders under the highlight cannot be navigated.
 */
export function buildCommands(input: {
  model: EditorControlsModel;
  listed: ListedModel;
  actions: readonly Action[];
  /** Commands that are not about the image, such as the layout. They follow the actions. */
  settings: readonly Command[];
  reveal: ((id: ControlId) => void) | undefined;
}): Command[] {
  const {model, listed, actions, settings, reveal} = input;
  const shown = shownTheme(model);

  return [
    ...actions.map((action, index): Command => ({
      id: `action=${index}`,
      group: 'Actions',
      label: action.label,
      note: action.note,
      run: action.run,
    })),
    ...settings,
    ...model.themes().map((theme): Command => ({
      id: `theme=${theme.id}`,
      group: 'Theme',
      label: `Theme: ${theme.name}`,
      current: theme.id === shown?.id,
      preview: theme.preview,
      run: theme.apply,
    })),
    ...listed.sections.flatMap(section =>
      section.controls
        .filter(control => control.visible())
        .flatMap(control => [
          ...controlCommands(control, section.label(), model, reveal),
          ...(reveal &&
          (control.id === 'frame.aspectRatio' ||
            control.id === 'font.family' ||
            control.kind === 'range' ||
            control.kind === 'background')
            ? [
                {
                  id: `${control.id}.picker`,
                  group: section.label(),
                  label: `${control.label()}…`, // i18n
                  run: () => reveal(control.id),
                },
              ]
            : []),
        ]),
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
