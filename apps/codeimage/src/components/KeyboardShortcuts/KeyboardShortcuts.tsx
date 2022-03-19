import {createMemo, createSignal, For, JSXElement} from 'solid-js';
import {Button} from '../ui/Button/Button';
import {HintIcon} from '../Icons/Hint';
import {Box} from '../ui/Box/Box';
import {HStack} from '../ui/Box/Stack';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';
import {Popover, PopoverButton} from 'solid-headless';
import {PopoverPanel} from '../ui/Dropdown/DropdownMenu';
import {useFloating} from '../../core/floating-ui/floating-ui';
import * as styles from './KeyboardShortcuts.css';
import {FadeInOutTransition} from '../ui/Transition/Transition';
import {offset} from '@floating-ui/dom';
import {PortalHostInjector} from '../ui/PortalHost/PortalHost';
import {useFrameState} from '../../state/frame';
import {useUIState} from '../../state/ui';
import {useTerminalState} from '../../state/terminal';
import {useStaticConfiguration} from '../../core/configuration';
import {updateTheme} from '../../state/state';
import {useEditorState} from '../../state/editor';
import {useHotkey} from '../../hooks/use-hotkey';

export interface KeyboardShortcut {
  label: string;
  key: string[];
}

export function KeyboardShortcuts(): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const [show, setShow] = createSignal(false);

  const frame = useFrameState();
  const editor = useEditorState();
  const ui = useUIState();
  const terminal = useTerminalState();
  const configuration = useStaticConfiguration();

  const shortcuts = createMemo<KeyboardShortcut[]>(() => [
    {label: t('shortcut.focusCodeEditor'), key: ['F']},
    {label: t('shortcut.unFocusCodeEditor'), key: ['Esc']},
    {label: t('shortcut.toggleBackground'), key: ['B']},
    {label: t('shortcut.toggleDarkMode'), key: ['D']},
    {label: t('shortcut.toggleHeader'), key: ['H']},
    {label: t('shortcut.selectLanguage'), key: ['L']},
    {label: t('shortcut.changePadding'), key: ['P']},
    {label: t('shortcut.pickRandomTheme'), key: ['R']},
    {label: t('shortcut.export'), key: ['Ctrl', 'S']},
    {label: t('shortcut.copyLink'), key: ['Ctrl', 'Shift', 'C']},
    {label: t('shortcut.openShortcuts'), key: ['?']},
  ]);

  const label = createMemo(() =>
    show() ? t('shortcut.esc') : t('shortcut.buttonAction'),
  );

  const floating = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  useHotkey(document.body, {
    F: event => {
      if (editor.focused) return;
      event.preventDefault();
      editor.setFocus(true);
    },
    Escape: () => {
      if (editor.focused) {
        if (!document.activeElement) return;
        (document.activeElement as HTMLElement).blur();
      } else {
        setShow(false);
      }
    },
    B: () => {
      if (editor.focused) return;
      frame.toggleVisibility();
    },
    D: () => {
      if (editor.focused) return;
      ui.toggleThemeMode();
    },
    H: () => {
      if (editor.focused) return;
      terminal.toggleShowHeader();
    },
    W: () => {
      if (editor.focused) return;
      terminal.toggleWatermark();
    },
    R: () => {
      if (editor.focused) return;
      const index = Math.floor(Math.random() * configuration.themes.length);
      const theme = configuration.themes[index];
      updateTheme(theme);
    },
    // ATTENTION: does it work for all keyboards? https://github.com/jamiebuilds/tinykeys/issues/155
    'Shift+?': () => {
      if (editor.focused) return;
      setShow(show => !show);
    },
  });

  return (
    <Popover>
      <>
        <Box paddingLeft={'4'} paddingTop={'3'}>
          <PopoverButton
            ref={floating.setReference}
            as={Button}
            theme={'secondary'}
            type={'button'}
            variant={'solid'}
            onClick={() => setShow(true)}
          >
            <HStack spacing={'2'}>
              <HintIcon />
              {label()}
            </HStack>
          </PopoverButton>
        </Box>

        <FadeInOutTransition show={show()}>
          <PortalHostInjector>
            <FadeInOutTransition childTransition={true}>
              <div class={styles.overlay} onClick={() => setShow(false)} />
            </FadeInOutTransition>
          </PortalHostInjector>
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
