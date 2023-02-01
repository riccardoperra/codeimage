import {useI18n} from '@codeimage/locale';
import {Button, DropdownMenuV2, MenuButton, SvgIcon} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {Item} from '@solid-aria/collection';
import {For} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

interface LanguageSelectorButtonProps {
  locales: readonly string[];
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}

export const LanguageSelectorButton = (props: LanguageSelectorButtonProps) => {
  const [t, {tUnsafe}] = useI18n<AppLocaleEntries>();

  function onUpdateLanguage(locale: string): void {
    props.onLocaleChange(locale);
    getUmami().trackEvent(locale, `change-app-language`);
  }

  return (
    <>
      <DropdownMenuV2
        selectionMode={'single'}
        onAction={item => onUpdateLanguage(item as string)}
        selectedKeys={[props.currentLocale]}
        menuButton={
          <MenuButton
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
          </MenuButton>
        }
      >
        <For each={props.locales}>
          {locale => <Item key={locale}>{tUnsafe(`locales.${locale}`)}</Item>}
        </For>
      </DropdownMenuV2>
    </>
  );
};
