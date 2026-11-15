import type {JSX} from 'solid-js';
import {untrack} from 'solid-js';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import {commandMenu} from './state';

interface CommandMenuTrigger {
  readonly onClick: () => void;
  readonly 'aria-haspopup': 'dialog';
  readonly 'aria-expanded': boolean;
}

export function CommandMenuButton(props: {
  children: (trigger: CommandMenuTrigger) => JSX.Element;
}): JSX.Element {
  const trigger: CommandMenuTrigger = {
    onClick: commandMenu.open,
    'aria-haspopup': 'dialog',
    get 'aria-expanded'() {
      return commandMenu.isOpen();
    },
  };
  return (
    <NewDot at="command-menu">{untrack(() => props.children(trigger))}</NewDot>
  );
}
