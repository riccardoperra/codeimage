import type {SnapshotDocument} from './document';

export const sampleDocument: SnapshotDocument = {
  $version: '1.10.0',
  $snippetId: null,
  format: 'png',
  scale: 2,
  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
    signature: null,
  },
  terminal: {
    type: 'macOs',
    surface: 'solid',
    showHeader: true,
    accentVisible: true,
    shadow: '0 20px 40px rgba(0,0,0,.3)',
    background: '#282a36',
    textColor: '#f8f8f2',
    showWatermark: true,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: 'glass',
  },
  editor: {
    options: {
      fontId: 'jetbrains-mono',
      fontWeight: 400,
      showLineNumbers: true,
      themeId: 'dracula',
      enableLigatures: true,
    },
    editors: [
      {
        id: 'main',
        code: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n',
        tabName: 'hello.ts',
        languageId: 'typescript',
        lineNumberStart: 1,
      },
    ],
  },
};
