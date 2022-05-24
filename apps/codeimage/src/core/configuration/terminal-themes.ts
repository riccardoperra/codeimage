import {MacOsTerminal} from '../../components/Terminal/macOS/MacOsTerminal';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';

export const AVAILABLE_TERMINAL_THEMES = {
  keys: ['macOs', 'windows'] as const,
  entries: {
    windows: {
      name: 'windows',
      component: WindowsTerminal,
    },
    macOs: {
      name: 'macOs',
      component: MacOsTerminal,
    },
  },
};
