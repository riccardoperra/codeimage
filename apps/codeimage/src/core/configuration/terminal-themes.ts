import {MacOsTerminal} from '../../components/Terminal/MacOsTerminal/MacOsTerminal';
import {MacOsTerminalGrayTheme} from '../../components/Terminal/MacOsTerminal/MacOsTerminalGrayTheme';
import {MacOsTerminalOutlineTheme} from '../../components/Terminal/MacOsTerminal/MacOsTerminalOutlineTheme';
import {WindowsTerminal} from '../../components/Terminal/WindowsTerminal/WindowsTerminal';

import {
  CardTerminal,
  EditorTerminal,
  ShellTerminal,
} from '../../components/Terminal/WindowStyles/WindowStyles';

export const AVAILABLE_TERMINAL_THEMES = {
  keys: [
    'macOs',
    'macOsGrayTheme',
    'macOsOutlineTheme',
    'windows',
    'card',
    'editor',
    'shell',
  ] as const,
  entries: {
    windows: {
      name: 'windows',
      label: 'frame.windowWindows',
      component: WindowsTerminal,
    },
    macOs: {
      name: 'macOs',
      label: 'frame.windowMacOs',
      component: MacOsTerminal,
    },
    macOsGrayTheme: {
      name: 'macOsGrayTheme',
      label: 'frame.windowMacOsGray',
      component: MacOsTerminalGrayTheme,
    },
    macOsOutlineTheme: {
      name: 'macOsOutlineTheme',
      label: 'frame.windowMacOsOutline',
      component: MacOsTerminalOutlineTheme,
    },
    card: {name: 'card', label: 'frame.windowCard', component: CardTerminal},
    editor: {
      name: 'editor',
      label: 'frame.windowEditor',
      component: EditorTerminal,
    },
    shell: {
      name: 'shell',
      label: 'frame.windowShell',
      component: ShellTerminal,
    },
  },
} as const;
