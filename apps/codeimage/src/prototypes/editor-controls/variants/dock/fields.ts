import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {getUmami} from '@core/constants/umami';
import {provideState} from 'statebuilder';
import type {
  Control,
  ControlId,
  EditorControlsModel,
  Section,
  SegmentedControl,
  SelectControl,
  ToggleControl,
} from '../../model';
import type {Previewable} from './preview';
import {choicePreview, shownTheme, syntaxThemePreview} from './preview';

export type PanelId =
  | 'themes'
  | 'background'
  | 'padding'
  | 'language'
  | 'font'
  | 'more'
  | 'commands';

export type GroupId = 'frame' | 'window' | 'code';

interface Place {
  readonly panel: PanelId;
  /** The More group that shows the control as a row. */
  readonly group?: GroupId;
}

const inGroup = (group: GroupId): Place => ({panel: 'more', group});

/**
 * Where every control of the model lives in the dock. The record is keyed by
 * `ControlId`, so a control added to the model does not compile until it has
 * a place. Rows of a group follow the order of this list.
 */
export const PLACES: Record<ControlId, Place> = {
  // The production colour picker sets both the background and its image.
  'frame.background': {panel: 'background'},
  'frame.backgroundImage': {panel: 'background'},
  'frame.padding': {panel: 'padding'},
  'editor.language': {panel: 'language'},
  'font.family': {panel: 'font'},
  'font.weight': {panel: 'font'},
  'font.ligatures': {panel: 'font'},

  'frame.visible': inGroup('frame'),
  'frame.opacity': inGroup('frame'),
  'frame.radius': inGroup('frame'),
  'frame.aspectRatio': inGroup('frame'),

  'window.header': inGroup('window'),
  'window.style': inGroup('window'),
  // As today, the tab accent is a checkbox inside the window style picker.
  'window.accent': {panel: 'more'},
  'window.backgroundType': inGroup('window'),
  'window.reflection': inGroup('window'),
  'window.watermark': inGroup('window'),
  'window.border': inGroup('window'),
  'window.shadow': inGroup('window'),

  'editor.theme': inGroup('code'),
  'editor.formatter': inGroup('code'),
  'editor.lineNumbers': inGroup('code'),
  'editor.lineNumberStart': inGroup('code'),
};

export const GROUPS: readonly {id: GroupId; label: string}[] = [
  {id: 'frame', label: 'Frame'},
  {id: 'window', label: 'Window'},
  {id: 'code', label: 'Code'},
];

export type ChoiceControl = SegmentedControl | SelectControl;

export const isChoice = (control: Control): control is ChoiceControl =>
  control.kind === 'select' || control.kind === 'segmented';

/** Choices that show all options in the row, as a segmented field. The rest are selects. */
export const SEGMENTED_CHOICES: ReadonlySet<ControlId> = new Set([
  'frame.padding',
  'frame.radius',
]);

// Two-option choices of the model that are an on/off question.
const SWITCHES: Partial<
  Record<ControlId, {label: string; on: string; off: string}>
> = {
  'window.backgroundType': {
    label: 'Alternative background',
    on: 'true',
    off: 'false',
  },
  'window.border': {label: 'Glass border', on: 'glass', off: 'none'},
};

const LABELS: Partial<Record<ControlId, string>> = {
  'window.style': 'Window style',
  // The dock's Theme also sets the background. This one keeps it.
  'editor.theme': 'Syntax theme',
};

const WINDOW_STYLE_LABELS: Record<
  (typeof AVAILABLE_TERMINAL_THEMES.keys)[number],
  string
> = {
  macOs: 'macOS',
  macOsGrayTheme: 'macOS gray',
  macOsOutlineTheme: 'macOS outline',
  windows: 'Windows',
};

export interface Fields {
  readonly sections: readonly Section[];
  readonly control: <K extends Control['kind']>(
    id: ControlId,
    kind: K,
  ) => Extract<Control, {kind: K}> | undefined;
  readonly choice: (id: ControlId) => ChoiceControl | undefined;
  readonly group: (id: GroupId) => readonly Control[];
  readonly preview: (control: ChoiceControl, key: string) => Previewable;
  /** Name of the font in use, which may be a system font outside the options. */
  readonly fontName: () => string;
}

/**
 * The model as the dock reads it. The model hands out the window style and
 * the font as production pickers, which cannot be listed. Here they are also
 * plain choices over the same stores, so that the command menu can offer and
 * preview each window style and each font.
 */
export function createFields(model: EditorControlsModel): Fields {
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);

  const windowStyle = (base: Control): SelectControl => ({
    kind: 'select',
    id: base.id,
    label: base.label,
    visible: base.visible,
    disabled: () => false,
    options: () =>
      AVAILABLE_TERMINAL_THEMES.keys.map(key => ({
        key,
        label: WINDOW_STYLE_LABELS[key],
      })),
    value: () => terminal.state.type,
    set: type => {
      terminal.setType(type);
      getUmami().track('change-terminal-type', {type});
    },
  });

  const fontFamily = (base: Control): SelectControl => ({
    kind: 'select',
    id: base.id,
    label: base.label,
    visible: base.visible,
    disabled: () => false,
    options: () =>
      config.get.fonts.map(font => ({key: font.id, label: font.name})),
    value: () => editor.computed.selectedFont()?.id ?? '',
    set: editor.actions.setFontId,
  });

  const asSwitch = (
    base: ChoiceControl,
    spec: {label: string; on: string; off: string},
  ): ToggleControl => ({
    kind: 'toggle',
    id: base.id,
    label: () => spec.label,
    visible: base.visible,
    value: () => base.value() === spec.on,
    set: on => base.set(on ? spec.on : spec.off),
  });

  const adapt = (base: Control): Control => {
    if (base.id === 'window.style') return windowStyle(base);
    if (base.id === 'font.family') return fontFamily(base);
    if (base.id === 'editor.theme' && base.kind === 'select') {
      // The stored id can be one the registry does not know. The editor then
      // draws the first theme, so that is the value to show.
      return {...base, value: () => shownTheme(model)?.id ?? base.value()};
    }
    const spec = SWITCHES[base.id];
    if (spec && isChoice(base)) return asSwitch(base, spec);
    return base;
  };

  const relabel = (control: Control): Control => {
    const label = LABELS[control.id];
    return label ? {...control, label: () => label} : control;
  };

  const sections = model.sections.map(section => ({
    ...section,
    controls: section.controls.map(control => relabel(adapt(control))),
  }));
  const byId = new Map(
    sections.flatMap(section => section.controls).map(c => [c.id, c]),
  );

  const control: Fields['control'] = (id, kind) => {
    const found = byId.get(id);
    return found?.kind === kind
      ? (found as Extract<Control, {kind: typeof kind}>)
      : undefined;
  };

  return {
    sections,
    control,
    choice: id => {
      const found = byId.get(id);
      return found && isChoice(found) ? found : undefined;
    },
    group: id =>
      (Object.keys(PLACES) as ControlId[])
        .filter(controlId => PLACES[controlId].group === id)
        .flatMap(controlId => byId.get(controlId) ?? []),
    preview: (choice, key) => {
      if (choice.id === 'editor.theme' && choice.kind === 'select') {
        return syntaxThemePreview(model, choice, key);
      }
      if (choice.id === 'font.family') {
        // Changing the font can reset the weight, so the weight is part of the undo.
        return choicePreview(choice, key, () => {
          const font = choice.value();
          const weight = editor.state.options.fontWeight;
          return () => {
            choice.set(font);
            editor.actions.setFontWeight(weight);
          };
        });
      }
      return choicePreview(choice, key);
    },
    fontName: () => editor.computed.selectedFont()?.name ?? '',
  };
}
