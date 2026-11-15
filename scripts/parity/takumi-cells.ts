import type {SnapshotInput} from '../../packages/render/dist/index.mjs';
import {supportedThemeIds} from '../../packages/render/dist/index.mjs';

export const SCALE = 2;

const DEFAULT_CODE = [
  'function Counter() {',
  '  const [count, setCount] = createSignal(0);',
  '  ',
  '  setInterval(',
  '    () => setCount(count() + 1),',
  '    1000',
  '  );',
  '',
  '  return <div>The count is {count()}</div>',
  '}',
].join('\n');

interface Cell {
  name: string;
  document: SnapshotInput;
  maxDiffPercent?: number;
}

function snapshot(
  themeId: string,
  overrides: {
    frame?: Record<string, unknown>;
    terminal?: Record<string, unknown>;
    options?: Record<string, unknown>;
    editor?: Record<string, unknown>;
  } = {},
): SnapshotInput {
  return {
    $version: '1.10.0',
    $snippetId: null,
    format: 'png',
    scale: SCALE,
    frame: {
      background: null,
      padding: 64,
      radius: 8,
      visible: true,
      opacity: 100,
      ...overrides.frame,
    },
    terminal: {
      type: 'macOs',
      showHeader: true,
      accentVisible: true,
      shadow: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
      background: '',
      textColor: '',
      showWatermark: true,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: 'glass',
      ...overrides.terminal,
    },
    editor: {
      options: {
        fontId: 'jetbrains-mono',
        fontWeight: 400,
        showLineNumbers: false,
        themeId,
        enableLigatures: true,
        ...overrides.options,
      },
      editors: [
        {
          id: 'parity',
          code: DEFAULT_CODE,
          tabName: 'index.tsx',
          languageId: 'typescript',
          lineNumberStart: 1,
          ...overrides.editor,
        },
      ],
    },
  };
}

export async function matrix(): Promise<Cell[]> {
  const themes = await supportedThemeIds();
  return [
    ...themes.map(themeId => ({
      name: `${themeId} / macOs`,
      document: snapshot(themeId),
    })),
    ...['macOsGrayTheme', 'macOsOutlineTheme', 'windows'].map(type => ({
      name: `vsCodeDarkTheme / ${type}`,
      document: snapshot('vsCodeDarkTheme', {terminal: {type}}),
    })),
    {
      name: 'line numbers from 42',
      document: snapshot('dracula', {
        options: {showLineNumbers: true},
        editor: {lineNumberStart: 42},
      }),
    },
    {
      name: 'marks with line numbers',
      maxDiffPercent: 0.01,
      document: snapshot('vsCodeDarkTheme', {
        options: {showLineNumbers: true},
        editor: {
          lineNumberStart: 42,
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'marks without line numbers',
      maxDiffPercent: 0.01,
      document: snapshot('vsCodeDarkTheme', {
        editor: {
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'marks light with line numbers',
      maxDiffPercent: 0.01,
      document: snapshot('githubLight', {
        options: {showLineNumbers: true},
        editor: {
          marks: {
            lines: [
              {line: 2, kind: 'removed'},
              {line: 3, kind: 'added'},
              {line: 5, kind: 'highlight'},
              {line: 6, kind: 'highlight'},
            ],
            focusedLines: [5, 6, 7],
          },
        },
      }),
    },
    {
      name: 'glass reflection',
      document: snapshot('nightOwlTheme', {
        terminal: {showGlassReflection: true},
      }),
    },
    {
      name: 'opacity 50, radius 0',
      document: snapshot('dracula', {
        frame: {opacity: 50, radius: 0},
        terminal: {opacity: 50},
      }),
    },
    {
      name: 'alternative theme, no watermark',
      document: snapshot('githubDark', {
        terminal: {alternativeTheme: true, showWatermark: false},
      }),
    },
    {
      name: 'no header',
      document: snapshot('materialOcean', {terminal: {showHeader: false}}),
    },
    {
      name: 'line wider than 1920 px, width 500',
      document: {
        ...snapshot('dracula', {
          options: {showLineNumbers: true},
          editor: {
            code: `const note = "${'a line the frame must not wrap '.repeat(8)}";\n${DEFAULT_CODE}`,
          },
        }),
        width: 500,
      },
    },
  ];
}
