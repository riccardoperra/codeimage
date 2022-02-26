import {
  createConfiguration,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {WindowsTerminal} from '../components/Terminal/windows/WindowsTerminal';
import {MacOsTerminal} from '../components/Terminal/macOS/MacOsTerminal';
import {version} from '../../package.json';

export const [staticConfiguration, useStaticConfiguration] =
  createConfiguration({
    version,
    locales: SUPPORTED_LOCALES,
    themes: SUPPORTED_THEMES,
    languages: SUPPORTED_LANGUAGES,
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
  });
