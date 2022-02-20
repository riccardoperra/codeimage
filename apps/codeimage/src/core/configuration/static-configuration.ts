import {AppStaticConfiguration} from './configuration';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../../components/Terminal/macOS/MacOsTerminal';
import {lightTheme, oneDarkTheme, materialOceanTheme} from '@codeimage/theme';
import {version} from '../../../package.json';

export const staticConfiguration: AppStaticConfiguration = {
  terminalThemes: {
    keys: ['macOs', 'windows'],
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
  themes: [oneDarkTheme, lightTheme, materialOceanTheme],
  version,
  locales: ['it', 'en'],
};
