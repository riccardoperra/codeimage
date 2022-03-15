import {LanguageDefinition} from '../types/language-def';

export const SUPPORTED_LANGUAGES: readonly LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'Javascript',
    plugin: () =>
      import('@codemirror/lang-javascript').then(({javascript}) =>
        javascript({jsx: true}),
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
    id: 'php',
    label: 'PHP',
    plugin: () => import('@codemirror/lang-php').then(({php}) => php()),
  },
  {
    id: 'python',
    label: 'Python',
    plugin: () =>
      import('@codemirror/lang-python').then(({python}) => python()),
  },
  {
    id: 'markdown',
    label: 'Markdown',
    plugin: () =>
      import('@codemirror/lang-markdown').then(({markdown}) => markdown()),
  },
  {
    id: 'rust',
    label: 'Rust',
    plugin: () => import('@codemirror/lang-rust').then(({rust}) => rust()),
  },
  {
    id: 'cpp',
    label: 'C++',
    plugin: () => import('@codemirror/lang-cpp').then(({cpp}) => cpp()),
  },
  {
    id: 'sql',
    label: 'SQL',
    plugin: () => import('@codemirror/lang-sql').then(({sql}) => sql()),
  },
];
