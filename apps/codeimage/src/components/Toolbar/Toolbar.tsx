import * as styles from './Toolbar.css';
import {Component} from 'solid-js';
import {ThemeToggleButton} from './ThemeToggleButton';
import {Box} from '../ui/Box/Box';
import {LanguageSelectorButton} from './LanguageSelectorButton';
import {EnvironmentProvider} from '../../core/configuration';
import {ExportButton} from './ExportButton';
import {ShareButton} from './ShareButton';
import {setLocale, toggleThemeMode, ui$} from '@codeimage/store/ui';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {inject} from 'solid-use';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const environment = inject(EnvironmentProvider);
  const uiState = fromObservableObject(ui$);

  return (
    <div class={styles.wrapper}>
      <Box class={styles.actionBox}>
        <LanguageSelectorButton
          locales={environment.locales}
          currentLocale={uiState.locale}
          onLocaleChange={setLocale}
        />

        <ThemeToggleButton
          theme={uiState.themeMode}
          onThemeToggle={toggleThemeMode}
        />

        <Box marginLeft={'auto'}>
          <Box display={'inlineBlock'} marginRight={'2'}>
            <ShareButton />
          </Box>
          <ExportButton canvasRef={props.canvasRef} />
        </Box>
      </Box>
    </div>
  );
};
