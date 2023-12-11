import {MacOsTerminal} from '../../components/Terminal/MacOsTerminal/MacOsTerminal';
import {MacOsTerminalGrayTheme} from '../../components/Terminal/MacOsTerminal/MacOsTerminalGrayTheme';
import {MacOsTerminalOutlineTheme} from '../../components/Terminal/MacOsTerminal/MacOsTerminalOutlineTheme';
import {WindowsTerminal} from '../../components/Terminal/WindowsTerminal/WindowsTerminal';

export const AVAILABLE_TERMINAL_THEMES = {
  keys: ['macOs', 'macOsGrayTheme', 'macOsOutlineTheme', 'windows'] as const,
  entries: {
    windows: {
      name: 'windows',
      component: WindowsTerminal,
    },
    macOs: {
      name: 'macOs',
      component: MacOsTerminal,
    },
    macOsGrayTheme: {
      name: 'macOsGrayTheme',
      component: MacOsTerminalGrayTheme,
    },
    macOsOutlineTheme: {
      name: 'macOsOutlineTheme',
      component: MacOsTerminalOutlineTheme,
    },
  },
};
