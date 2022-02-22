import {LanguageDefinition} from './configuration';

export const supportedLanguages: readonly LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'Javascript',
    plugin: () =>
      import('@codemirror/lang-javascript').then(
        ({javascriptLanguage}) => javascriptLanguage,
      ),
  },
  {
    id: 'typescript',
    label: 'Typescript',
    plugin: () =>
      import('@codemirror/lang-javascript').then(({javascript}) =>
        javascript({jsx: true, typescript: true}),
      ),
  },
  {
    id: 'java',
    label: 'Java',
    plugin: () => import('@codemirror/lang-java').then(({java}) => java()),
  },
  {
    id: 'css',
    label: 'Css',
    plugin: () => import('@codemirror/lang-css').then(({css}) => css()),
  },
  {
    id: 'html',
    label: 'Html',
    plugin: () =>
      import('@codemirror/lang-html').then(({html}) =>
        html({matchClosingTags: true, autoCloseTags: true}),
      ),
  },
  {
    id: 'python',
    label: 'Python',
    plugin: () =>
      import('@codemirror/lang-python').then(({python}) => python()),
  },
];
