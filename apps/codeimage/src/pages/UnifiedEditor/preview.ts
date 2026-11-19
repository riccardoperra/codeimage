import type {CustomTheme} from '@codeimage/highlight';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {
  EditorUIOptions,
  TerminalState,
} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import type {FrameState} from '@codeimage/store/frame/model';
import type {Accessor} from 'solid-js';
import {flush, createSignal} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';

/** Every value a control or a theme can change, as it was before a preview. */
export interface Snapshot {
  readonly frame: Pick<
    FrameState,
    | 'background'
    | 'opacity'
    | 'padding'
    | 'radius'
    | 'visible'
    | 'aspectRatio'
    | 'exportTarget'
    | 'signature'
  >;
  readonly terminal: TerminalState;
  readonly options: Omit<EditorUIOptions, 'focused'>;
  readonly tab:
    | {
        readonly id: string;
        readonly languageId: string;
        readonly formatter: string | null;
        readonly lineNumberStart: number;
        readonly tabName: string | null;
      }
    | undefined;
}

export interface PreviewSession {
  /** What the canvas showed before the running preview, or null. */
  readonly saved: Accessor<Snapshot | null>;
  readonly showTheme: (theme: CustomTheme, background: boolean) => void;
  /** Shows a write on the canvas without saving it. The previous preview is undone first. */
  readonly show: (write: () => void) => void;
  /** Undoes the running preview. Does nothing when none runs. */
  readonly end: () => void;
  /** Ends any preview, then runs a write that is saved. */
  readonly commit: (write: () => void) => void;
}

export function createPreviewSession(): PreviewSession {
  const frame = getFrameState();
  const terminal = getTerminalState();
  const editor = getRootEditorStore();
  const showTheme = (theme: CustomTheme, background: boolean) => {
    if (background)
      frame.setStore(draft => {
        draft.background = theme.properties.previewBackground;
      });
    terminal.setState(draft => {
      draft.background = theme.properties.terminal.main;
      draft.textColor = theme.properties.terminal.text;
    });
    editor.actions.setThemeId(theme.id);
  };

  const [saved, setSaved] = createSignal<Snapshot | null>(null);

  const take = (): Snapshot => {
    const {
      background,
      opacity,
      padding,
      radius,
      visible,
      aspectRatio,
      exportTarget,
      signature,
    } = frame.store;
    const {focused: _, ...options} = editor.state.options;
    const tab = editor.state.editors.find(item => editor.isActive(item.id));
    return {
      frame: {
        background,
        opacity,
        padding,
        radius,
        visible,
        aspectRatio,
        exportTarget,
        signature,
      },
      terminal: {...terminal.state},
      options,
      tab: tab && {
        id: tab.id,
        languageId: tab.languageId,
        formatter: tab.formatter ?? null,
        lineNumberStart: tab.lineNumberStart,
        tabName: tab.tab.tabName,
      },
    };
  };

  const restore = (snapshot: Snapshot) => {
    frame.setStore(draft => {
      Object.assign(draft, snapshot.frame);
    });
    terminal.setState(draft => {
      Object.assign(draft, snapshot.terminal);
    });
    const tab = snapshot.tab;
    editor.setState(draft => {
      Object.assign(draft.options, snapshot.options);
      const item = draft.editors.find(item => item.id === tab?.id);
      if (!tab || !item) return;
      item.languageId = tab.languageId;
      item.formatter = tab.formatter;
      item.lineNumberStart = tab.lineNumberStart;
      item.tab.tabName = tab.tabName;
    });
  };

  // Untracked commands still update the stores but skip the persistence
  // watchers. The batch runs inside them, so the effects a write triggers
  // (a language change resets the formatter) are not saved either.
  const quietly = (write: () => void) =>
    untrackCommand(() => flush(write), false);

  const end = () => {
    const snapshot = saved();
    if (!snapshot) return;
    quietly(() => {
      setSaved(null);
      restore(snapshot);
    });
  };

  return {
    saved,
    showTheme,
    show: write =>
      quietly(() => {
        const snapshot = saved();
        if (snapshot) restore(snapshot);
        else setSaved(take());
        write();
      }),
    end,
    commit: write => {
      end();
      write();
    },
  };
}
