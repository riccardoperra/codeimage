import * as styles from './Toolbar.css';
import {Component} from 'solid-js';
import {useUIState} from '../../state/ui';
import {ThemeToggleButton} from './ThemeToggleButton';
import {Box} from '../ui/Box/Box';
import {LanguageSelectorButton} from './LanguageSelectorButton';
import {useStaticConfiguration} from '../../core/configuration';
import {ExportButton} from './ExportButton';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const staticConfiguration = useStaticConfiguration();
  const uiState = useUIState();

  return (
    <div class={styles.wrapper}>
      <Box class={styles.actionBox}>
        <LanguageSelectorButton
          locales={staticConfiguration.locales}
          currentLocale={uiState.locale}
          onLocaleChange={locale => uiState.setLocale(locale)}
        />

        <ThemeToggleButton
          theme={uiState.themeMode}
          onThemeToggle={uiState.toggleThemeMode}
        />

        <Box marginLeft={'auto'}>
          <ExportButton canvasRef={props.canvasRef} />
        </Box>
      </Box>
    </div>
  );
};
