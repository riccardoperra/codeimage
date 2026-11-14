import type {EditorControlsModel, SelectControl, ThemeEntry} from '../../model';

export type Restore = () => void;

/** A change that can be shown on the canvas and taken back. */
export interface Previewable {
  /** Changes with the same scope overwrite each other, so one baseline covers them all. */
  readonly scope: string;
  readonly key: string;
  readonly apply: () => void;
  /** Reads the state `apply` is about to change and returns how to put it back. */
  readonly capture: () => Restore;
  /** True when `apply` sets only part of its scope, so the previous preview must be undone first. */
  readonly partial?: boolean;
}

export interface PreviewSession {
  /** Shows the change on the canvas. The previous preview is taken back first. */
  readonly preview: (change: Previewable) => void;
  /** Keeps what is on the canvas. */
  readonly commit: () => void;
  /** Puts the canvas back to the last committed state. */
  readonly cancel: () => void;
  readonly pendingKey: () => string | undefined;
}

export function createPreviewSession(
  onChange: (key: string | undefined) => void,
): PreviewSession {
  let pending: {scope: string; key: string; restore: Restore} | undefined;

  const settle = (next: typeof pending) => {
    pending = next;
    onChange(next?.key);
  };

  return {
    preview(change) {
      if (pending?.key === change.key) return;
      if (pending?.scope === change.scope) {
        if (change.partial) pending.restore();
        change.apply();
        settle({...pending, key: change.key});
        return;
      }
      pending?.restore();
      const restore = change.capture();
      change.apply();
      settle({scope: change.scope, key: change.key, restore});
    },
    commit: () => settle(undefined),
    cancel() {
      pending?.restore();
      settle(undefined);
    },
    pendingKey: () => pending?.key,
  };
}

export function choicePreview(
  control: Pick<SelectControl, 'id' | 'value' | 'set'>,
  key: string,
  capture?: () => Restore,
): Previewable {
  return {
    scope: control.id,
    key: `${control.id}=${key}`,
    apply: () => control.set(key),
    capture:
      capture ??
      (() => {
        const previous = control.value();
        return () => control.set(previous);
      }),
  };
}

const THEME_SCOPE = 'theme';

/** The theme the canvas shows. An unknown stored id renders as the first theme. */
export function shownTheme(model: EditorControlsModel): ThemeEntry | undefined {
  const themes = model.themes();
  return themes.find(theme => theme.active()) ?? themes[0];
}

function captureTheme(model: EditorControlsModel): Restore {
  const theme = shownTheme(model);
  const background = model.control('frame.background');
  const fill =
    background?.kind === 'background' ? background.value() : undefined;
  return () => {
    if (background?.kind !== 'background' || fill === undefined) {
      theme?.apply();
      return;
    }
    // Theme changes land one microtask late and bring their own background.
    // Set the background now, so that a later capture reads the restored
    // value, and again after the theme has landed.
    background.set(fill);
    theme?.apply();
    queueMicrotask(() => background.set(fill));
  };
}

export function themePreview(
  model: EditorControlsModel,
  theme: ThemeEntry,
): Previewable {
  return {
    scope: THEME_SCOPE,
    key: `theme=${theme.id}`,
    apply: theme.apply,
    capture: () => captureTheme(model),
  };
}

/** The Editor section's Theme select: the syntax theme without its background. */
export function syntaxThemePreview(
  model: EditorControlsModel,
  control: SelectControl,
  key: string,
): Previewable {
  return {
    scope: THEME_SCOPE,
    key: `${control.id}=${key}`,
    apply: () => control.set(key),
    capture: () => captureTheme(model),
    partial: true,
  };
}
