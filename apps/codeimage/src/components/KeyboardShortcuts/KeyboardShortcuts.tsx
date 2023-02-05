import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {getUiStore} from '@codeimage/store/ui';
import {
  Button,
  FadeInOutTransition,
  PopoverPanel,
  PortalHostContext,
  useFloating,
} from '@codeimage/ui';
import {offset} from '@floating-ui/dom';
import {Popover, PopoverButton} from 'solid-headless';
import {createMemo, createSignal, For, JSXElement} from 'solid-js';
import {useHotkey} from '../../hooks/use-hotkey';
import {AppLocaleEntries} from '../../i18n';
import {HintIcon} from '../Icons/Hint';
import * as styles from './KeyboardShortcuts.css';

export interface KeyboardShortcut {
  label: string;
  key: string[];
}

export function KeyboardShortcuts(): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const [show, setShow] = createSignal(false);
  const editor = getRootEditorStore();
  const frame = getFrameState();
  const ui = getUiStore();
  const terminal = getTerminalState();

  const shortcuts = createMemo<KeyboardShortcut[]>(() => [
    {label: t('shortcut.focusCodeEditor'), key: ['F']},
    {label: t('shortcut.unFocusCodeEditor'), key: ['Esc']},
    {label: t('shortcut.toggleBackground'), key: ['B']},
    {label: t('shortcut.toggleDarkMode'), key: ['D']},
    {label: t('shortcut.toggleHeader'), key: ['H']},
    {label: t('shortcut.changePadding'), key: ['P']},
    {label: t('shortcut.export'), key: ['Ctrl', 'S']},
    {label: t('shortcut.exportNewTab'), key: ['Ctrl', 'O']},
    {label: t('shortcut.copyLink'), key: ['Ctrl', 'Shift', 'C']},
    {label: t('shortcut.copySnippet'), key: ['Ctrl', 'C']},
    {label: t('shortcut.openShortcuts'), key: ['?']},
  ]);

  const label = () => (show() ? t('shortcut.esc') : t('shortcut.buttonAction'));

  const floating = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  const filterHotKey = () =>
    editor.state.options.focused ||
    document.activeElement?.nodeName === 'INPUT';

  useHotkey(document.body, {
    F: event => {
      if (filterHotKey()) return;
      event.preventDefault();
      editor.actions.setFocused(true);
    },
    Escape: () => {
      if (editor.state.options.focused) {
        if (!document.activeElement) return;
        (document.activeElement as HTMLElement).blur();
      } else {
        setShow(false);
      }
    },
    P: () => {
      if (filterHotKey()) return;
      frame.setNextPadding();
    },
    B: () => {
      if (filterHotKey()) return;
      frame.toggleVisibility();
    },
    D: () => {
      if (filterHotKey()) return;
      ui.toggleThemeMode();
    },
    H: () => {
      if (filterHotKey()) return;
      terminal.toggleShowHeader();
    },
    W: () => {
      if (filterHotKey()) return;
      terminal.toggleWatermark();
    },
    // ATTENTION: does it work for all keyboards? https://github.com/jamiebuilds/tinykeys/issues/155
    'Shift+?': () => {
      if (filterHotKey()) return;
      setShow(show => !show);
    },
  });

  return (
    <Popover defaultOpen={false}>
      <>
        <PopoverButton
          ref={floating.setReference}
          as={Button}
          theme={'secondary'}
          type={'button'}
          variant={'solid'}
          size={'xs'}
          leftIcon={<HintIcon size={'sm'} />}
          onClick={() => setShow(true)}
        >
          {label()}
        </PopoverButton>

        <FadeInOutTransition show={show()}>
          <PortalHostContext>
            <FadeInOutTransition childTransition={true}>
              <div class={styles.overlay} onClick={() => setShow(false)} />
            </FadeInOutTransition>
          </PortalHostContext>
          <PopoverPanel
            ref={floating.setFloating}
            style={{
              position: floating.strategy,
              left: `${floating.x}px`,
              top: `${floating.y}px`,
            }}
          >
            <dl class={styles.list}>
              <For each={shortcuts()}>
                {shortcut => (
                  <>
                    <dt class={styles.keyLabel}>{shortcut.label}</dt>
                    <dd class={styles.keyList}>
                      <For each={shortcut.key}>
                        {key => <kbd class={styles.key}>{key}</kbd>}
                      </For>
                    </dd>
                  </>
                )}
              </For>
            </dl>
          </PopoverPanel>
        </FadeInOutTransition>
      </>
    </Popover>
  );
}
