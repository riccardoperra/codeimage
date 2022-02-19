import {AppStaticConfiguration} from './configuration';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../../components/Terminal/macOS/MacOsTerminal';
import {lightTheme, oneDarkTheme} from '@codegram/theme';

export const staticConfiguration: AppStaticConfiguration = {
  terminalThemes: {
    keys: ['windows', 'macOs'],
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
  },
  themes: [oneDarkTheme, lightTheme],
};
