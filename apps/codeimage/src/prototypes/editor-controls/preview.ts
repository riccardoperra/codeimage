import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {
  EditorUIOptions,
  TerminalState,
} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import type {FrameState} from '@codeimage/store/frame/model';
import type {Accessor} from 'solid-js';
import {batch, createSignal} from 'solid-js';
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
    frame.setStore(state => ({...state, ...snapshot.frame}));
    terminal.setState(state => ({...state, ...snapshot.terminal}));
    editor.setState('options', options => ({...options, ...snapshot.options}));
    const tab = snapshot.tab;
    if (!tab) return;
    const index = editor.state.editors.findIndex(item => item.id === tab.id);
    if (index < 0) return;
    editor.setState('editors', index, item => ({
      ...item,
      languageId: tab.languageId,
      formatter: tab.formatter,
      lineNumberStart: tab.lineNumberStart,
      tab: {...item.tab, tabName: tab.tabName},
    }));
  };

  // Untracked commands still update the stores but skip the persistence
  // watchers. The batch runs inside them, so the effects a write triggers
  // (a language change resets the formatter) are not saved either.
  const quietly = (write: () => void) =>
    untrackCommand(() => batch(write), false);

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
