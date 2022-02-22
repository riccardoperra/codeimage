import {AppStaticConfiguration} from './configuration';
import {WindowsTerminal} from '../../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../../components/Terminal/macOS/MacOsTerminal';
import {
  draculaTheme,
  lightTheme,
  materialOceanTheme,
  oneDarkTheme,
} from '@codeimage/theme';
import {version} from '../../../package.json';
import {supportedLanguages} from './languages';

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
  themes: [oneDarkTheme, lightTheme, materialOceanTheme, draculaTheme],
  version,
  languages: supportedLanguages,
  locales: ['it', 'en'],
};
