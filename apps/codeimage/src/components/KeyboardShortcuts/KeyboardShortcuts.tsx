import {createMemo, For, JSXElement, onMount} from 'solid-js';
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
import tinykeys from 'tinykeys';
import {noop} from '../../core/constants/noop';
import {useFrameState} from '../../state/frame';
import {useUIState} from '../../state/ui';

export interface KeyboardShortcut {
  label: string;
  key: string[];
}

export function KeyboardShortcuts(): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();

  const frame = useFrameState();
  const ui = useUIState();

  const shortcuts = createMemo<KeyboardShortcut[]>(() => [
    {label: t('shortcut.focusCodeEditor'), key: ['F']},
    {label: t('shortcut.unFocusCodeEditor'), key: ['Esc']},
    {label: t('shortcut.toggleBackground'), key: ['B']},
    {label: t('shortcut.toggleDarkMode'), key: ['D']},
    {label: t('shortcut.selectLanguage'), key: ['L']},
    {label: t('shortcut.changePadding'), key: ['P']},
    {label: t('shortcut.pickRandomTheme'), key: ['R']},
    {label: t('shortcut.export'), key: ['Ctrl', 'S']},
    {label: t('shortcut.copyLink'), key: ['Ctrl', 'Shift', 'C']},
    {label: t('shortcut.openShortcuts'), key: ['?']},
  ]);

  const floating = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(10)],
  });

  onMount(() => {
    tinykeys(window, {
      F: noop,
      Esc: noop,
      B: () => frame.toggleVisibility(),
      D: () => ui.toggleThemeMode(),
    });
  });

  return (
    <Popover>
      {({isOpen, setState}) => (
        <>
          <Box paddingLeft={'4'} paddingTop={'3'}>
            <PopoverButton
              ref={floating.setReference}
              as={Button}
              theme={'secondary'}
              type={'button'}
              variant={'solid'}
            >
              <HStack spacing={'2'}>
                <HintIcon />
                {t('shortcut.buttonAction')}
              </HStack>
            </PopoverButton>
          </Box>

          <FadeInOutTransition show={isOpen()}>
            <PortalHostInjector>
              <FadeInOutTransition childTransition={true}>
                <div class={styles.overlay} onClick={() => setState(false)} />
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
      )}
    </Popover>
  );
}
