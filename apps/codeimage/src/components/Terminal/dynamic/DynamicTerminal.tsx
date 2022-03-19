import {Component, createMemo, JSXElement} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {inject, omitProps} from 'solid-use';
import {BaseTerminalProps} from '../TerminalHost';
import {
  EnvironmentProvider,
  staticConfiguration,
} from '../../../core/configuration';
import {Box} from '../../ui/Box/Box';
import * as styles from '../terminal.css';
import {CodeImageLogo} from '../../Icons/CodeImageLogo';
import {FadeInOutTransition} from '../../ui/Transition/Transition';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: Component<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const {terminalThemes} = inject(EnvironmentProvider);

  const terminal = createMemo(
    () =>
      terminalThemes.entries[
        props.type as typeof staticConfiguration['terminalThemes']['keys'][number]
      ].component,
  );

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {props.children}

      <FadeInOutTransition show={props.showWatermark}>
        <Box class={styles.watermark}>
          <CodeImageLogo width={125} />
        </Box>
      </FadeInOutTransition>
    </Dynamic>
  );
};
