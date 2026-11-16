import {type Pair} from './cases';
import {type Case} from './types';
import {RENAME_FROM, EIGHT} from './fixtures';
export function textCases(pair: Pair): Case[] {
  return [
    {
      name: 'edge-recolor',
      input: pair(
        {code: 'const x = foo;\nconst y = bar.baz;'},
        {code: '// call\nconst x = foo();\nconst y = bar.baz();'},
      ),
    },
    {
      name: 'edge-focus-diff',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 1, kind: 'added'},
              {line: 2, kind: 'highlight'},
              {line: 3, kind: 'removed'},
            ],
            focusedLines: [2],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 2, kind: 'added'},
              {line: 3, kind: 'highlight'},
            ],
            focusedLines: [3],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-mark-edit',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
        {
          code: RENAME_FROM.replace('sum + item', 'sum + item * 2'),
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [2]},
        },
      ),
    },
    {
      name: 'edge-focus-change',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {
            lines: [
              {line: 2, kind: 'highlight'},
              {line: 5, kind: 'added'},
            ],
            focusedLines: [1, 2],
          },
        },
        {
          code: `// totals\n${RENAME_FROM}`,
          marks: {
            lines: [
              {line: 3, kind: 'highlight'},
              {line: 6, kind: 'added'},
            ],
            focusedLines: [5, 6],
          },
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-focus-off',
      input: pair(
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [5]},
        },
        {
          code: RENAME_FROM,
          marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: []},
        },
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-line-start',
      input: pair(
        {code: EIGHT, lineNumberStart: 1},
        {code: EIGHT, lineNumberStart: 98},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-plain-text',
      input: pair(
        {code: 'hello   world\n  indented <tag> & more'},
        {code: 'hello world\nnew line\n  indented <tag> & more'},
        {languageId: 'plain-text'},
      ),
    },
    ...[false, true].map(showLineNumbers => ({
      name: `edge-plain-blank-${showLineNumbers ? 'gutter' : 'lines'}`,
      input: pair(
        {code: 'alpha\n\nbeta\n\ngamma'},
        {code: 'alpha\n\n\nbeta\n\ngamma\n\ndelta'},
        {languageId: 'plain-text', options: {showLineNumbers}},
      ),
    })),
  ];
}
