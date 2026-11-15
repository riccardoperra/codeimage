import {Box, FadeInOutTransition} from '@codeimage/ui';
import {parseWindowType} from '@core/configuration/windowTypes';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';

import type {JSXElement, ParentComponent} from 'solid-js';
import {children, createMemo} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use/props';
import {CodeImageLogoV2} from '../../Icons/CodeImageLogoV2';
import {createTabTheme} from '../Tabs/createTabTheme';
import * as styles from '../terminal.css';
import type {BaseTerminalProps} from '../TerminalHost';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: ParentComponent<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;
  const tabTheme = createTabTheme(() => props.themeId);

  const terminal = createMemo(
    () => terminalThemes.entries[parseWindowType(props.type)].component,
  );

  const resolvedChildren = children(() => props.children);

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {resolvedChildren()}

      <FadeInOutTransition show={props.showWatermark}>
        <Box class={styles.watermark}>
          {/* The logo's light rule also matches on the SVG itself, because
              Takumi draws inline SVG apart from the terminal around it. */}
          <CodeImageLogoV2
            width={125}
            withGradient={false}
            data-theme-mode={tabTheme().darkMode ? 'dark' : 'light'}
          />
        </Box>
      </FadeInOutTransition>
    </Dynamic>
  );
};
