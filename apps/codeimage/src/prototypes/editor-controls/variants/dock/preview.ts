import type {
  EditorControlsModel,
  SegmentedControl,
  SelectControl,
  ThemeEntry,
} from '../../model';

/** A change the dock can show on the canvas through the model, then keep. */
export interface Change {
  /** Marks the option the canvas is previewing. */
  readonly key: string;
  /** Shows the change without saving it. `model.endPreview()` takes it back. */
  readonly preview: () => void;
  readonly keep: () => void;
}

/** The theme the canvas shows. An unknown stored id renders as the first theme. */
export function shownTheme(model: EditorControlsModel): ThemeEntry | undefined {
  const themes = model.themes();
  return themes.find(theme => theme.active()) ?? themes[0];
}

export const themeChange = (theme: ThemeEntry): Change => ({
  key: `theme=${theme.id}`,
  preview: theme.preview,
  keep: theme.apply,
});

export const choiceChange = (
  control: SegmentedControl | SelectControl,
  key: string,
): Change => ({
  key: `${control.id}=${key}`,
  preview: () => control.preview(key),
  keep: () => control.set(key),
});
