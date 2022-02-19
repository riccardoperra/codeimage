import * as styles from './Toolbar.css';
import {Button} from '../ui/Button/Button';
import {sprinkles} from '../../theme/sprinkles.css';
import {Component} from 'solid-js';
import {useUIState} from '../../state/ui';
import {ThemeToggleButton} from './ThemeToggleButton';
import {Box} from '../ui/Box/Box';

export const Toolbar: Component<{
  canvasRef: HTMLElement | undefined;
}> = () => {
  const uiState = useUIState();

  return (
    <div class={styles.wrapper}>
      <Box marginLeft={'auto'}>
        <Box class={styles.actionBox}>
          <ThemeToggleButton
            theme={uiState.themeMode}
            onThemeToggle={uiState.toggleThemeMode}
          />

          <Button theme="secondary" variant="solid">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </Button>

          <Button variant={'solid'} theme={'primary'}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{height: '20px', width: '20px'}}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <Box as={'span'} marginLeft={'2'}>
              Export
            </Box>
          </Button>
        </Box>
      </Box>
    </div>
  );
};
