import {setLocale, toggleThemeMode, uiStore} from '@codeimage/store/ui';
import {Box, HStack} from '@codeimage/ui';
import {Component} from 'solid-js';
import {appEnvironment} from '../../core/configuration';
import {ExportButton} from './ExportButton';
import {ExportInNewTabButton} from './ExportNewTabButton';
import {GenerateLinkButton} from './GenerateLinkButton';
import {LanguageSelectorButton} from './LanguageSelectorButton';
import {ShareButton} from './ShareButton';
import {ThemeToggleButton} from './ThemeToggleButton';
import * as styles from './Toolbar.css';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = props => {
  const {locales} = appEnvironment;

  return (
    <div class={styles.wrapper}>
      <Box class={styles.actionBox}>
        <LanguageSelectorButton
          locales={locales}
          currentLocale={uiStore.locale}
          onLocaleChange={setLocale}
        />

        <ThemeToggleButton
          theme={uiStore.themeMode}
          onThemeToggle={toggleThemeMode}
        />

        <HStack marginLeft={'auto'} spacing={'2'}>
          <Box display={'inlineBlock'}>
            <ShareButton />
          </Box>
          <ExportInNewTabButton canvasRef={props.canvasRef} />
          <ExportButton canvasRef={props.canvasRef} />
        </HStack>
      </Box>
    </div>
  );
};
