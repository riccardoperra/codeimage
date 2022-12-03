import {Box, FadeInOutTransition} from '@codeimage/ui';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';

import {children, createMemo, JSXElement, ParentComponent} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {CodeImageLogoV2} from '../../Icons/CodeImageLogoV2';
import * as styles from '../terminal.css';
import {BaseTerminalProps} from '../TerminalHost';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: ParentComponent<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;

  const terminal = createMemo(
    () =>
      terminalThemes.entries[
        props.type as typeof terminalThemes['keys'][number]
      ].component,
  );

  const resolvedChildren = children(() => props.children);

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {resolvedChildren()}

      <FadeInOutTransition show={props.showWatermark}>
        <Box class={styles.watermark}>
          <CodeImageLogoV2 width={125} withGradient={false} />
        </Box>
      </FadeInOutTransition>
    </Dynamic>
  );
};
