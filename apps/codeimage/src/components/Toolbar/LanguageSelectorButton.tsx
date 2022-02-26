import {Popover, PopoverButton} from 'solid-headless';
import {Button} from '../ui/Button/Button';
import {For} from 'solid-js';
import {useFloating} from '../../core/floating-ui/floating-ui';
import {offset} from '@floating-ui/dom';
import {useI18n} from '@codeimage/locale';
import {DropdownItem} from '../ui/Dropdown/DropdownItem';
import {DropdownMenu} from '../ui/Dropdown/DropdownMenu';
import {AppLocaleEntries} from '../../i18n';
import {FadeInOutTransition} from '../ui/Transition/Transition';

interface LanguageSelectorButtonProps {
  locales: string[];
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}

export const LanguageSelectorButton = (props: LanguageSelectorButtonProps) => {
  const [, {tUnsafe}] = useI18n<AppLocaleEntries>();
  const floating = useFloating({
    placement: 'bottom-start',
    middleware: [offset(10)],
  });

  return (
    <Popover>
      {({isOpen, setState}) => (
        <>
          <PopoverButton
            ref={floating.setReference}
            as={Button}
            variant={'solid'}
            theme={'secondary'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </PopoverButton>

          <FadeInOutTransition show={isOpen()}>
            <DropdownMenu
              ref={floating.setFloating}
              unmount={false}
              style={{
                position: floating.strategy,
                left: `${floating.x ?? 0}px`,
                top: `${floating.y ?? 0}px`,
              }}
            >
              <For each={props.locales}>
                {locale => (
                  <DropdownItem
                    active={props.currentLocale === locale}
                    onClick={() => {
                      props.onLocaleChange(locale);
                      setState(false);
                    }}
                  >
                    {tUnsafe(`locales.${locale}`)}
                  </DropdownItem>
                )}
              </For>
            </DropdownMenu>
          </FadeInOutTransition>
        </>
      )}
    </Popover>
  );
};
