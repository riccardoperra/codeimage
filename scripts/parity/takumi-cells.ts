import {
  createAmbientBackground,
  createWindowPalette,
} from '../../apps/codeimage/src/components/Terminal/windowPalette';
import type {SnapshotInput} from '../../packages/render/dist/index.mjs';
import {supportedThemeIds} from '../../packages/render/dist/index.mjs';

export const SCALE = 2;
export const MAX_MARKS_DIFF_PERCENT = 0.01;

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
  avatar?: 'fixture' | 'offline';
  checkMarks?: boolean;
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

export async function matrix(fixtureUrl: string): Promise<Cell[]> {
  const themes = await supportedThemeIds();
  const p10: Cell[] = [];
  for (const themeId of ['githubDark', 'githubLight']) {
    for (const type of ['card', 'editor', 'shell']) {
      for (const surface of ['solid', 'wash'])
        p10.push({
          name: `P10 ${type} ${themeId} ${surface}`,
          document: snapshot(themeId, {
            terminal: {type, surface},
            editor: {tabName: 'src/app/index.tsx'},
          }),
        });
    }
    p10.push({
      name: `P10 macOs ${themeId} wash hairline`,
      document: snapshot(themeId, {
        terminal: {surface: 'wash', borderType: 'hairline'},
      }),
    });
    for (const style of ['minimal', 'pill', 'card']) {
      for (const icon of [false, true])
        p10.push({
          name: `P10 ${style} ${themeId} icon-${icon}`,
          document: snapshot(themeId, {
            frame: {
              background: themeId === 'githubDark' ? '#121212' : '#f5f5f5',
              exportTarget: 'x-landscape',
              signature: {
                handle: 'octocat',
                name: 'Zoë Łukasz',
                style,
                platform: icon ? 'github' : null,
              },
            },
          }),
        });
    }
  }
  const card = {
    handle: 'octocat',
    name: 'The Octocat',
    style: 'card',
    platform: 'github',
    avatar: 'profile',
    position: 'bottom-center',
  };
  p10.push(
    {
      name: 'P10 card fixture avatar bottom-center',
      avatar: 'fixture',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    {
      name: 'P10 card offline initials',
      avatar: 'offline',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'x-landscape', signature: card},
      }),
    },
    ...['light', 'dark'].map(tone => ({
      name: `P10 signature over ${tone} image`,
      document: snapshot('githubDark', {
        frame: {
          background: `link:${fixtureUrl}/${tone}.png`,
          exportTarget: 'x-landscape',
          signature: {...card, avatar: null},
        },
      }),
    })),
    {
      name: 'P10 terminal alias',
      document: snapshot('githubDark', {
        terminal: {type: 'terminal', surface: 'wash'},
      }),
    },
    {
      name: 'P10 bare padding zero',
      document: snapshot('githubDark', {
        terminal: {type: 'card', showHeader: false},
        frame: {padding: 0, radius: 0},
      }),
    },
    {
      name: 'P10 ambient two tabs',
      document: (() => {
        const document = snapshot('githubDark', {
          frame: {
            background: createAmbientBackground(
              createWindowPalette({
                background: '#0d1117',
                text: '#c9d1d9',
                accent: '#58a6ff',
              }),
            ),
          },
          terminal: {type: 'editor', surface: 'wash'},
        });
        document.editor.editors.push({
          ...document.editor.editors[0],
          id: 'second',
          tabName: 'other.ts',
        });
        return document;
      })(),
    },
    {
      name: 'P10 square sixty lines',
      document: snapshot('githubDark', {
        frame: {exportTarget: 'square', signature: {...card, avatar: null}},
        editor: {code: 'const value = 1;\n'.repeat(60)},
      }),
    },
  );
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
