import * as styles from './Toolbar.css';
import {Component} from 'solid-js';
import {useUIState} from '../../state/ui';
import {ThemeToggleButton} from './ThemeToggleButton';
import {Box} from '../ui/Box/Box';
import {LanguageSelectorButton} from './LanguageSelectorButton';
import {useStaticConfiguration} from '../../core/configuration/ConfigurationProvider';
import {ExportButton} from './ExportButton';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const staticConfiguration = useStaticConfiguration();
  const uiState = useUIState();

  return (
    <div class={styles.wrapper}>
      <Box marginLeft={'auto'}>
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

          <ExportButton canvasRef={props.canvasRef} />
        </Box>
      </Box>
    </div>
  );
};
