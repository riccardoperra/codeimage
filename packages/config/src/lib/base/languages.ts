import {LanguageDefinition} from '../types/language-def';

export const SUPPORTED_LANGUAGES: readonly LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'Javascript',
    plugin: () =>
      import('@codemirror/lang-javascript').then(({javascript}) =>
        javascript({jsx: true}),
      ),
    icons: [
      {
        name: 'js',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/javascript.svg',
        matcher: /^.*\.(js)$/,
      },
      {
        name: 'jsx',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/react.svg',
        matcher: /^.*\.(jsx)$/,
      },
      {
        name: 'test-jsx',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/test-jsx.svg',
        matcher: /^.*\.(spec.jsx)$/,
      },
      {
        name: 'test-js',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/test-ts.svg',
        matcher: /^.*\.(spec.js)$/,
      },
      {
        name: 'vue',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/vue.svg',
        matcher: /^.*\.(vue)$/,
      },
      {
        name: 'redux-store',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-store.svg',
        matcher: /^.*\.*?(store.js)$/,
      },
      {
        name: 'redux-reducer',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-reducer.svg',
        matcher: /^.*\.*?(reducer.js)$/,
      },
      {
        name: 'redux-action',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-action.svg',
        matcher: /^.*\.*?(action.js)$/,
      },
      {
        name: 'redux-selector',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-selector.svg',
        matcher: /^.*\.*?(selector.js)$/,
      },
      {
        name: 'svelte',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/svelte.svg',
        matcher: /^.*\.(svelte)$/,
      },
    ],
  },
  {
    id: 'typescript',
    label: 'Typescript',
    plugin: () =>
      import('@codemirror/lang-javascript').then(({javascript}) =>
        javascript({jsx: true, typescript: true}),
      ),
    icons: [
      {
        name: 'ts',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/typescript.svg',
        matcher: /^.*\.(ts)$/,
      },
      {
        name: 'tsx',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/react_ts.svg',
        matcher: /^.*\.(tsx)$/,
      },
      {
        name: 'test-tsx',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/test-jsx.svg',
        matcher: /^.*\.(spec.jsx|spec.tsx)$/,
      },
      {
        name: 'test-ts',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/test-ts.svg',
        matcher: /^.*\.(spec.js|spec.ts)$/,
      },
      {
        name: 'vue',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/vue.svg',
        matcher: /^.*\.(vue)$/,
      },
      {
        name: 'redux-store',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-store.svg',
        matcher: /^.*\.*?(store.ts)$/,
      },
      {
        name: 'redux-reducer',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-reducer.svg',
        matcher: /^.*\.*?(reducer.ts)$/,
      },
      {
        name: 'redux-action',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-action.svg',
        matcher: /^.*\.*?(action.ts)$/,
      },
      {
        name: 'redux-selector',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redux-selector.svg',
        matcher: /^.*\.*?(selector.ts)$/,
      },
      {
        name: 'ng-component',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-component.svg',
        matcher: /^.*\.(component.ts)$/,
      },
      {
        name: 'ng-pipe',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-pipe.svg',
        matcher: /^.*\.(pipe.ts)$/,
      },
      {
        name: 'ng-guard',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-guard.svg',
        matcher: /^.*\.(guard.ts)$/,
      },
      {
        name: 'ng-directive',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-directive.svg',
        matcher: /^.*\.(directive.ts)$/,
      },
      {
        name: 'ng-resolver',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-resolver.svg',
        matcher: /^.*\.(resolver.ts)$/,
      },
      {
        name: 'ng-service',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/angular-service.svg',
        matcher: /^.*\.(service.ts)$/,
      },
      {
        name: 'svelte',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/svelte.svg',
        matcher: /^.*\.(svelte)$/,
      },
    ],
  },
  {
    id: 'java',
    label: 'Java',
    plugin: () => import('@codemirror/lang-java').then(({java}) => java()),
    icons: [
      {
        name: 'java-class',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/javaclass.svg',
        matcher: /^.*\.(java)$/,
      },
    ],
  },
  {
    id: 'css',
    label: 'Css',
    plugin: () => import('@codemirror/lang-css').then(({css}) => css()),
    icons: [
      {
        name: 'css',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/css.svg',
        matcher: /^.*\.(css)$/,
      },
      {
        name: 'sass',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/sass.svg',
        matcher: /^.*\.(scss|sass)$/,
      },
      {
        name: 'less',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/less.svg',
        matcher: /^.*\.(less)$/,
      },
      {
        name: 'stylus',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/stylus.svg',
        matcher: /^.*\.(stylus)$/,
      },
    ],
  },
  {
    id: 'html',
    label: 'Html',
    plugin: () =>
      import('@codemirror/lang-html').then(({html}) =>
        html({matchClosingTags: true, autoCloseTags: true}),
      ),
    icons: [
      {
        name: 'html',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/html.svg',
        matcher: /^.*\.(html)$/,
      },
    ],
  },
  {
    id: 'php',
    label: 'PHP',
    plugin: () => import('@codemirror/lang-php').then(({php}) => php()),
    icons: [
      {
        name: 'php',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/php.svg',
        matcher: /^.*\.(php)$/,
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    plugin: () =>
      import('@codemirror/lang-python').then(({python}) => python()),
    icons: [
      {
        name: 'python',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/python.svg',
        matcher: /^.*\.(python)$/,
      },
    ],
  },
  {
    id: 'markdown',
    label: 'Markdown',
    plugin: () =>
      import('@codemirror/lang-markdown').then(({markdown}) => markdown()),
    icons: [
      {
        name: 'markdown',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/markdown.svg',
        matcher: /^.*\.(markdown)$/,
      },
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    plugin: () => import('@codemirror/lang-rust').then(({rust}) => rust()),
    icons: [
      {
        name: 'rust',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/rust.svg',
        matcher: /^.*\.(rust)$/,
      },
    ],
  },
  {
    id: 'cpp',
    label: 'C++',
    plugin: () => import('@codemirror/lang-cpp').then(({cpp}) => cpp()),
    icons: [
      {
        name: 'cpp',
        src: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/cpp.svg',
        matcher: /^.*\.(cpp)$/,
      },
    ],
  },
  {
    id: 'sql',
    label: 'SQL',
    plugin: () => import('@codemirror/lang-sql').then(({sql}) => sql()),
    icons: [],
  },
];
