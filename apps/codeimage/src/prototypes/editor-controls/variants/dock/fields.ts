import type {ListedModel} from '../../command-menu/listed-model';
import {createListedModel} from '../../command-menu/listed-model';
import type {Control, ControlId, EditorControlsModel} from '../../model';

export type PanelId =
  | 'themes'
  | 'background'
  | 'padding'
  | 'language'
  | 'font'
  | 'more';

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
  'window.surface': inGroup('window'),
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

export interface Fields extends ListedModel {
  readonly group: (id: GroupId) => readonly Control[];
}

/** The listed model, with the rows of each More group in the order of `PLACES`. */
export function createFields(model: EditorControlsModel): Fields {
  const listed = createListedModel(model);
  const byId = new Map(
    listed.sections.flatMap(section => section.controls).map(c => [c.id, c]),
  );
  return {
    ...listed,
    group: id =>
      (Object.keys(PLACES) as ControlId[])
        .filter(controlId => PLACES[controlId].group === id)
        .flatMap(controlId => byId.get(controlId) ?? []),
  };
}
