import {Component, createMemo, JSXElement, ParentComponent} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {BaseTerminalProps} from '../TerminalHost';
import {appEnvironment} from '../../../core/configuration';
import {Box, FadeInOutTransition} from '@codeimage/ui';
import * as styles from '../terminal.css';
import {CodeImageLogo} from '../../Icons/CodeImageLogo';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: ParentComponent<DynamicTerminalProps> = (
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
