import {createConfiguration, SUPPORTED_LOCALES} from '@codeimage/config';
import {version} from '../../package.json';
import {
  SUPPORTED_FONTS,
  SUPPORTED_FONTS_DICTIONARY,
} from './configuration/font';

export const [appEnvironment] = createConfiguration({
  version,
  locales: SUPPORTED_LOCALES,
  themes: [],
  languages: [],
  editorPadding: [16, 32, 64, 128],
  fonts: SUPPORTED_FONTS,
  defaultState: {
    editor: {
      code:
        'function Counter() {\n' +
        '  const [count, setCount] = createSignal(0);\n' +
        '  \n' +
        '  setInterval(\n' +
        '    () => setCount(count() + 1),\n' +
        '    1000\n' +
        '  );\n' +
        '\n' +
        '  return <div>The count is {count()}</div>\n' +
        '}' +
        '\n',
      // TODO: should be auto
      languageId: 'typescript',
      font: SUPPORTED_FONTS_DICTIONARY['jetbrains-mono'],
    },
  } as const,
});
