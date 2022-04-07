import {Component, createMemo, JSXElement} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {BaseTerminalProps} from '../TerminalHost';
import {appEnvironment} from '../../../core/configuration';
import {Box} from '@codeimage/ui';
import * as styles from '../terminal.css';
import {CodeImageLogo} from '../../Icons/CodeImageLogo';
import {FadeInOutTransition} from '../../../../../../packages/ui/src/lib/primitives/Transition/Transition';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: Component<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const {terminalThemes} = appEnvironment;

  const terminal = createMemo(
    () =>
      terminalThemes.entries[
        props.type as typeof appEnvironment['terminalThemes']['keys'][number]
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
