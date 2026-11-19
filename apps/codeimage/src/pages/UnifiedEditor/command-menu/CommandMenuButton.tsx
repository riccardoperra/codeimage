import type {JSX} from '@solidjs/web';
import {untrack} from 'solid-js';
import {NewDot} from '../../../components/WhatsNew/NewDot';
import {commandMenu} from './state';

interface CommandMenuTrigger {
  readonly onClick: () => void;
  readonly 'aria-haspopup': 'dialog';
  readonly 'aria-expanded': 'true' | 'false';
}

export function CommandMenuButton(props: {
  children: (trigger: CommandMenuTrigger) => JSX.Element;
}): JSX.Element {
  const trigger: CommandMenuTrigger = {
    onClick: commandMenu.open,
    'aria-haspopup': 'dialog',
    get 'aria-expanded'() {
      return commandMenu.isOpen() ? 'true' : 'false';
    },
  };
  return (
    <NewDot at="command-menu">{untrack(() => props.children(trigger))}</NewDot>
  );
}
