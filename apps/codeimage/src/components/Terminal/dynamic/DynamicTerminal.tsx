import {Component, createMemo, JSXElement} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';
import {BaseTerminalProps} from '../TerminalHost';
import {
  staticConfiguration,
  useStaticConfiguration,
} from '../../../core/configuration';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: Component<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const {terminalThemes} = useStaticConfiguration();
  const terminal = createMemo(
    () =>
      terminalThemes.entries[
        props.type as typeof staticConfiguration['terminalThemes']['keys'][number]
      ].component,
  );

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {props.children}
    </Dynamic>
  );
};
