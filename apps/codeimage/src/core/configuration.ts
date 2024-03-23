import {createConfiguration, SUPPORTED_LOCALES} from '@codeimage/config';
import {version} from '../../package.json';
import {SUPPORTED_FONTS_DICTIONARY} from './configuration/font';

export const [appEnvironment] = createConfiguration({
  version,
  locales: SUPPORTED_LOCALES,
  themes: [],
  languages: [],
  editorPadding: [
    {label: '0', value: "0"},
    {label: '16', value: "16"},
    {label: '32', value: "32"},
    {label: '64', value: "64"},
    {label: '128', value: "128"},
  ],
  editorRadius: [
    {label: '0', value: 0},
    {label: '8', value: 8},
    {label: '16', value: 16},
    {label: '24', value: 24},
  ],
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
