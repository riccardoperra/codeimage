import {Component} from 'solid-js';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../../components/Terminal/macOS/MacOsTerminal';
import {BaseTerminalProps} from '../../components/Terminal/TerminalHost';

export const AVAILABLE_TERMINAL: TerminalDefinition[] = [
  {
    name: 'MacOS',
    component: MacOsTerminal,
  },
  {
    name: 'Windows',
    component: WindowsTerminal,
  },
];

export interface TerminalDefinition {
  name: string;
  component: Component<BaseTerminalProps>;
}
