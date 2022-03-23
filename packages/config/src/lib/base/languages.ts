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
        content: () => import('material-icon-theme/icons/javascript.svg?raw'),
        matcher: /^.*\.(js)$/,
      },
      {
        name: 'jsx',
        content: () => import('material-icon-theme/icons/react.svg?raw'),
        matcher: /^.*\.(jsx)$/,
      },
      {
        name: 'test-jsx',
        content: () => import('material-icon-theme/icons/test-jsx.svg?raw'),
        matcher: /^.*\.(spec.jsx)$/,
      },
      {
        name: 'test-js',
        content: () => import('material-icon-theme/icons/test-ts.svg?raw'),
        matcher: /^.*\.(spec.js)$/,
      },
      {
        name: 'vue',
        content: () => import('material-icon-theme/icons/vue.svg?raw'),
        matcher: /^.*\.(vue)$/,
      },
      {
        name: 'redux-store',
        content: () => import('material-icon-theme/icons/redux-store.svg?raw'),
        matcher: /^.*\.*?(store.js)$/,
      },
      {
        name: 'redux-reducer',
        content: () =>
          import('material-icon-theme/icons/redux-reducer.svg?raw'),
        matcher: /^.*\.*?(reducer.js)$/,
      },
      {
        name: 'redux-action',
        content: () => import('material-icon-theme/icons/redux-action.svg?raw'),
        matcher: /^.*\.*?(action.js)$/,
      },
      {
        name: 'redux-selector',
        content: () =>
          import('material-icon-theme/icons/redux-selector.svg?raw'),
        matcher: /^.*\.*?(selector.js)$/,
      },
      {
        name: 'svelte',
        content: () => import('material-icon-theme/icons/svelte.svg?raw'),
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
        content: () => import('material-icon-theme/icons/typescript.svg?raw'),
        matcher: /^.*\.(ts)$/,
      },
      {
        name: 'tsx',
        content: () => import('material-icon-theme/icons/react_ts.svg?raw'),
        matcher: /^.*\.(tsx)$/,
      },
      {
        name: 'test-tsx',
        content: () => import('material-icon-theme/icons/test-jsx.svg?raw'),
        matcher: /^.*\.(spec.jsx|spec.tsx)$/,
      },
      {
        name: 'test-ts',
        content: () => import('material-icon-theme/icons/test-ts.svg?raw'),
        matcher: /^.*\.(spec.js|spec.ts)$/,
      },
      {
        name: 'vue',
        content: () => import('material-icon-theme/icons/vue.svg?raw'),
        matcher: /^.*\.(vue)$/,
      },
      {
        name: 'redux-store',
        content: () => import('material-icon-theme/icons/redux-store.svg?raw'),
        matcher: /^.*\.*?(store.ts)$/,
      },
      {
        name: 'redux-reducer',
        content: () =>
          import('material-icon-theme/icons/redux-reducer.svg?raw'),
        matcher: /^.*\.*?(reducer.ts)$/,
      },
      {
        name: 'redux-action',
        content: () => import('material-icon-theme/icons/redux-action.svg?raw'),
        matcher: /^.*\.*?(action.ts)$/,
      },
      {
        name: 'redux-selector',
        content: () =>
          import('material-icon-theme/icons/redux-selector.svg?raw'),
        matcher: /^.*\.*?(selector.ts)$/,
      },
      {
        name: 'ng-component',
        content: () =>
          import('material-icon-theme/icons/angular-component.svg?raw'),
        matcher: /^.*\.(component.ts)$/,
      },
      {
        name: 'ng-pipe',
        content: () => import('material-icon-theme/icons/angular-pipe.svg?raw'),
        matcher: /^.*\.(pipe.ts)$/,
      },
      {
        name: 'ng-guard',
        content: () =>
          import('material-icon-theme/icons/angular-guard.svg?raw'),
        matcher: /^.*\.(guard.ts)$/,
      },
      {
        name: 'ng-directive',
        content: () =>
          import('material-icon-theme/icons/angular-directive.svg?raw'),
        matcher: /^.*\.(directive.ts)$/,
      },
      {
        name: 'ng-resolver',
        content: () =>
          import('material-icon-theme/icons/angular-resolver.svg?raw'),
        matcher: /^.*\.(resolver.ts)$/,
      },
      {
        name: 'ng-service',
        content: () =>
          import('material-icon-theme/icons/angular-service.svg?raw'),
        matcher: /^.*\.(service.ts)$/,
      },
      {
        name: 'svelte',
        content: () => import('material-icon-theme/icons/svelte.svg?raw'),
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
        content: () => import('material-icon-theme/icons/javaclass.svg?raw'),
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
        content: () => import('material-icon-theme/icons/css.svg?raw'),
        matcher: /^.*\.(css)$/,
      },
      {
        name: 'sass',
        content: () => import('material-icon-theme/icons/sass.svg?raw'),
        matcher: /^.*\.(scss|sass)$/,
      },
      {
        name: 'less',
        content: () => import('material-icon-theme/icons/less.svg?raw'),
        matcher: /^.*\.(less)$/,
      },
      {
        name: 'stylus',
        content: () => import('material-icon-theme/icons/stylus.svg?raw'),
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
        content: () => import('material-icon-theme/icons/html.svg?raw'),
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
        content: () => import('material-icon-theme/icons/php.svg?raw'),
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
        content: () => import('material-icon-theme/icons/python.svg?raw'),
        matcher: /^.*\.(py)$/,
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
        content: () => import('material-icon-theme/icons/markdown.svg?raw'),
        matcher: /^.*\.(md)$/,
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
        content: () => import('material-icon-theme/icons/rust.svg?raw'),
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
        content: () => import('material-icon-theme/icons/cpp.svg?raw'),
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
