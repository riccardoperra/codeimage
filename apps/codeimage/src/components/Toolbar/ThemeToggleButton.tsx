import {Component} from 'solid-js';
import {Button, SvgIcon, themeVars} from '@codeimage/ui';
import {GlobalUiState} from '@codeimage/store/ui';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';

interface ThemeTogglerProps {
  theme: GlobalUiState['themeMode'];
  onThemeToggle: () => void;
}

export const ThemeToggleButton: Component<ThemeTogglerProps> = props => {
  const [t] = useI18n<AppLocaleEntries>();
  const isLight = () => props.theme === 'light';

  const strokeColor = () =>
    isLight()
      ? themeVars.backgroundColor.blue['700']
      : themeVars.backgroundColor.yellow['400'];

  return (
    <Button
      aria-label={t('toolbar.toggleTheme')}
      theme="secondary"
      variant="solid"
      size={'xs'}
      onClick={() => props.onThemeToggle()}
    >
      <SvgIcon
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill={strokeColor()}
      >
        {isLight() ? (
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        ) : (
          <path
            fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd"
          />
        )}
      </SvgIcon>
    </Button>
  );
};
