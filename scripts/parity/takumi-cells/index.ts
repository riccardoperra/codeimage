import {supportedThemeIds} from '../../../packages/render/dist/index.mjs';
import {type Cell, snapshot, DEFAULT_CODE} from './snapshot';
import {p10Cells} from './p10';
export async function matrix(fixtureUrl: string): Promise<Cell[]> {
  const themes = await supportedThemeIds();
  const p10 = p10Cells(fixtureUrl);
  return [
    ...p10,
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
      checkMarks: true,
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
      checkMarks: true,
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
      checkMarks: true,
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

export {SCALE, MAX_MARKS_DIFF_PERCENT} from './snapshot';
