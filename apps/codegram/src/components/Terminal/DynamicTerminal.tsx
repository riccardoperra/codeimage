import {Component, JSXElement} from 'solid-js';
import {AVAILABLE_TERMINAL} from '../../core/constants/terminal';
import {Dynamic} from 'solid-js/web';
import {TerminalProps} from './Terminal';
import {omitProps} from 'solid-use';

interface DynamicTerminalProps extends TerminalProps {
  type: string;
}

export const DynamicTerminal: Component<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const terminals = AVAILABLE_TERMINAL;

  return (
    <Dynamic
      component={
        terminals.find(terminal => terminal.name === props.type)!.component
      }
      {...omitProps(props, ['type'])}
    >
      {props.children}
    </Dynamic>
  );
};
