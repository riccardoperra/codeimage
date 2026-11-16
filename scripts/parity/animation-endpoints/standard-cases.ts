import {type Pair} from './types';
import {type Case} from './types';
import {
  RENAME_FROM,
  SHORT,
  EIGHT,
  LIGATURES_FROM,
  LIGATURES_TO,
  FALLBACK_FROM,
  FALLBACK_TO,
} from './fixtures';
export function standardCases(pair: Pair): Case[] {
  return [
    {
      name: 'rename',
      input: pair(
        {code: RENAME_FROM},
        {code: RENAME_FROM.replaceAll('computeTotal', 'sumItems')},
      ),
    },
    {
      name: 'grow',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\n${Array.from({length: 20}, (_, index) => `const line${index} = greeting.length * ${index};`).join('\n')}`,
        },
      ),
    },
    {
      name: 'gutter',
      input: pair(
        {code: EIGHT},
        {code: `import {a} from 'a';\nimport {b} from 'b';\n\n${EIGHT}`},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'marks',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 2, kind: 'added'},
              {line: 5, kind: 'highlight'},
            ],
            focusedLines: [],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 1, kind: 'removed'},
              {line: 3, kind: 'added'},
            ],
            focusedLines: [],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'focus',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {lines: [{line: 3, kind: 'highlight'}], focusedLines: [3]},
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'ligatures',
      input: pair(
        {code: LIGATURES_FROM},
        {code: LIGATURES_TO},
        {
          options: {fontId: 'geist-mono', enableLigatures: true},
        },
      ),
    },
    {
      name: 'ligatures-off',
      input: pair(
        {code: LIGATURES_FROM},
        {code: LIGATURES_TO},
        {
          options: {fontId: 'geist-mono', enableLigatures: false},
        },
      ),
    },
    {name: 'fallback', input: pair({code: FALLBACK_FROM}, {code: FALLBACK_TO})},
    ...[
      'dracula',
      'githubLight',
      'fleetDark',
      'nightOwlTheme',
      'synthwave84',
    ].map(themeId => ({
      name: `theme-${themeId}`,
      input: pair(
        {code: RENAME_FROM},
        {
          code: `// totals\n${RENAME_FROM.replaceAll('computeTotal', 'sumItems')}`,
        },
        {
          options: {themeId, showLineNumbers: true},

          terminal: {background: '', textColor: ''},
        },
      ),
    })),
    ...['macOs', 'windows', 'macOsGrayTheme', 'macOsOutlineTheme'].map(
      type => ({
        name: `terminal-${type}`,
        input: pair(
          {code: SHORT},
          {code: `${SHORT}\nconsole.log(greeting.length);`},
          {
            terminal: {type},
          },
        ),
      }),
    ),
    {
      name: 'identity',
      input: pair(
        {code: RENAME_FROM},
        {code: RENAME_FROM},
        {options: {showLineNumbers: true}},
      ),
      identity: true,
    },
  ];
}
