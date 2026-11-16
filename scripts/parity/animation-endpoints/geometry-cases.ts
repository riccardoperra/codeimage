import {type Pair} from './cases';
import {type Case} from './types';
import {
  SHORT,
  grid,
  CROSS_FROM,
  CROSS_TO,
  numbered,
  LONG_LINES,
} from './fixtures';
export function geometryCases(pair: Pair): Case[] {
  return [
    {
      name: 'edge-escape',
      input: pair(
        {code: 'const a = x < 1 && y > 2;\nconst tag = "<b>&amp;</b>";'},
        {
          code: 'const a = x < 1 && y > 2 || z;\nconst tag = "<i>&lt;</i>";\nconst q = \'"\';',
        },
      ),
    },
    {
      name: 'edge-crlf',
      input: pair(
        {code: 'const a = 1;\r\nconst b = 2;\r\n'},
        {code: 'const a = 1;\r\nconst c = 3;\r\nconst b = 2;\r\n'},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-tabs',
      input: pair(
        {code: 'function f() {\n\treturn 1;\n}'},
        {code: 'function f() {\n\tconst a\t= 2;\n\t\treturn a;\t// done\n}'},
      ),
    },
    {
      name: 'edge-empty-from',
      input: pair(
        {code: ''},
        {code: SHORT},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-empty-to',
      input: pair(
        {code: SHORT},
        {code: ''},
        {options: {showLineNumbers: true}},
      ),
    },
    {
      name: 'edge-blank-lines',
      input: pair({code: 'a;\n\nb;\n'}, {code: 'a;\n\n\n  \nb;\n\n'}),
    },
    {
      name: 'edge-long-line',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\nconst long = [${Array.from({length: 60}, (_, index) => `'item${index}'`).join(', ')}];`,
        },
      ),
    },
    {
      name: 'edge-line-2000',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\nconst longer = [${Array.from({length: 248}, (_, index) => `'v${String(index).padStart(3, '0')}'`).join(', ')}];`,
        },
      ),
    },
    {
      name: 'edge-periodic',
      input: pair({code: grid(8)}, {code: grid(20)}),
    },
    {
      name: 'edge-header-cross',
      input: pair(
        {code: CROSS_FROM},
        {code: CROSS_TO},
        {tabNames: ['animation-before-the-change.ts', 'animation-after.ts']},
      ),
    },
    {
      name: 'edge-glyph-tab',
      input: pair(
        {code: `const a = '世';`},
        {code: `const a = '世界';\nconst b = '界';`},
        {tabNames: ['世', '界']},
      ),
    },
    {
      name: 'edge-target',
      input: pair(
        {code: SHORT},
        {
          code: `${SHORT}\n${Array.from({length: 20}, (_, index) => `const line${index} = greeting.length * ${index};`).join('\n')}`,
        },
        {frame: {exportTarget: 'x-landscape'}},
      ),
    },
    {
      name: 'edge-target-scale',
      input: pair(
        {code: SHORT},
        {code: numbered(45, index => `greeting.length * ${index}`)},
        {frame: {exportTarget: 'x-landscape'}},
      ),
    },
    {
      name: 'edge-target-scale-wide',
      input: pair(
        {code: 'const a = 1;'},
        {code: LONG_LINES},
        {frame: {exportTarget: 'square'}},
      ),
    },
    {
      name: 'edge-target-scale-both',
      input: pair(
        {code: numbered(60, index => `${index}`)},
        {code: LONG_LINES},
        {frame: {exportTarget: 'square'}},
      ),
    },
    {
      name: 'edge-width',
      input: pair(
        {code: SHORT},
        {code: `${SHORT}\nconsole.log(greeting.length);`},
        {width: 900},
      ),
    },
  ];
}
