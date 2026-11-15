import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {provideState} from 'statebuilder';
import type {
  Control,
  ControlId,
  EditorControlsModel,
  Section,
  SegmentedControl,
  SelectControl,
  ThemeEntry,
  ToggleControl,
} from '../model';

export type ChoiceControl = SegmentedControl | SelectControl;

export const isChoice = (control: Control): control is ChoiceControl =>
  control.kind === 'select' || control.kind === 'segmented';

/** The theme the canvas shows. An unknown stored id renders as the first theme. */
export function shownTheme(model: EditorControlsModel): ThemeEntry | undefined {
  const themes = model.themes();
  return themes.find(theme => theme.active()) ?? themes[0];
}

// Two-option choices of the model that are an on/off question.
const SWITCHES: Partial<
  Record<ControlId, {label: string; on: string; off: string}>
> = {
  'window.backgroundType': {
    label: 'Alternative background',
    on: 'true',
    off: 'false',
  },
};

const LABELS: Partial<Record<ControlId, string>> = {
  'window.style': 'Window style',
  // Picking a theme also sets the background. This one keeps it.
  'editor.theme': 'Syntax theme',
};

export interface ListedModel {
  readonly sections: readonly Section[];
  readonly control: <K extends Control['kind']>(
    id: ControlId,
    kind: K,
  ) => Extract<Control, {kind: K}> | undefined;
  readonly choice: (id: ControlId) => ChoiceControl | undefined;
  /** Name of the font in use, which may be a system font outside the options. */
  readonly fontName: () => string;
}

/**
 * The model with every control that has values as a list of them. The model
 * hands out the font as a production picker, which cannot be listed. Here it is
 * also a plain choice over the same store, so that a command menu can offer and
 * preview each font. The choice that is an on/off question becomes a switch
 * with a name that says what turns on.
 */
export function createListedModel(model: EditorControlsModel): ListedModel {
  const editor = getRootEditorStore();
  const config = provideState(EditorConfigStore);

  const fontFamily = (base: Control): SelectControl => ({
    kind: 'select',
    id: base.id,
    label: base.label,
    visible: base.visible,
    disabled: () => false,
    options: () =>
      config.get.fonts.map(font => ({key: font.id, label: font.name})),
    value: () => editor.computed.selectedFont()?.id ?? '',
    set: id => {
      model.endPreview();
      editor.actions.setFontId(id);
    },
    preview: id => model.preview(() => editor.actions.setFontId(id)),
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
    preview: on => base.preview(on ? spec.on : spec.off),
  });

  const adapt = (base: Control): Control => {
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

  return {
    sections,
    control: (id, kind) => {
      const found = byId.get(id);
      return found?.kind === kind
        ? (found as Extract<Control, {kind: typeof kind}>)
        : undefined;
    },
    choice: id => {
      const found = byId.get(id);
      return found && isChoice(found) ? found : undefined;
    },
    fontName: () => editor.computed.selectedFont()?.name ?? '',
  };
}
