import {useI18n} from '@codeimage/locale';
import {
  Button,
  DropdownItem,
  DropdownMenu,
  FadeInOutTransition,
  SvgIcon,
  useFloating,
} from '@codeimage/ui';
import {offset} from '@floating-ui/dom';
import {Popover, PopoverButton} from 'solid-headless';
import {For} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

interface LanguageSelectorButtonProps {
  locales: readonly string[];
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}

export const LanguageSelectorButton = (props: LanguageSelectorButtonProps) => {
  const [t, {tUnsafe}] = useI18n<AppLocaleEntries>();
  const floating = useFloating({
    placement: 'bottom-start',
    middleware: [offset(10)],
  });

  function onUpdateLanguage(locale: string): void {
    props.onLocaleChange(locale);
    umami.trackEvent(locale, `change-app-language`);
  }

  return (
    <Popover>
      {({isOpen, setState}) => (
        <>
          <PopoverButton
            ref={floating.setReference}
            as={Button}
            aria-label={t('toolbar.changeLanguage')}
            variant={'solid'}
            theme={'secondary'}
          >
            <SvgIcon
              xmlns="http://www.w3.org/2000/svg"
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
            </SvgIcon>
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
                      onUpdateLanguage(locale);
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
