import {Component} from 'solid-js';
import {Terminal, TerminalProps} from '../../components/Terminal/Terminal';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';

export const AVAILABLE_TERMINAL: TerminalDefinition[] = [
  {
    name: 'MacOS',
    component: Terminal,
  },
  {
    name: 'Windows',
    component: WindowsTerminal,
  },
];

export interface TerminalDefinition {
  name: string;
  component: Component<TerminalProps>;
}
