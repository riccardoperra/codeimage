import type {TokenLine} from '@core/snapshot/tokenize';
import {syncTokenKeys, toKeyedTokens} from '@shikijs/magic-move/core';
import type {
  Cell,
  GlyphWidths,
  Gutter,
  Mark,
  MarkTransition,
  Scene,
  Step,
  StepBox,
  Token,
  TokenTransition,
  Transition,
} from './model';

// Matches `tab-size` in the static layout.
const TAB_SIZE = 4;

type Placed<T> = {item: T; cell: Cell};

type CodeToken = {
  content: string;
  offset: number;
  classes: string;
  cell: Cell;
  key?: string;
};

const NO_WIDTHS: GlyphWidths = new Map();

const segmenter = new Intl.Segmenter();

export const isAscii = (text: string) => /^[\t\n\r -~]*$/.test(text);

export const graphemes = (text: string) =>
  isAscii(text)
    ? text.split('')
    : Array.from(segmenter.segment(text), ({segment}) => segment);

const columnsAfter = (col: number, text: string, widths: GlyphWidths) =>
  graphemes(text).reduce(
    (col, grapheme) =>
      grapheme === '\t'
        ? col + TAB_SIZE - (col % TAB_SIZE)
        : col + (widths.get(grapheme) ?? 1),
    col,
  );

const lineText = (line: TokenLine) => line.map(span => span.text).join('');

// Whitespace only adds width, so it moves the cells and is never a token.
// Splitting at whitespace keeps `=>` and `===` whole for ligatures.
function codeTokens(lines: TokenLine[], widths: GlyphWidths): CodeToken[][] {
  let offset = 0;
  return lines.map((line, row) => {
    const tokens: CodeToken[] = [];
    let col = 0;
    for (const span of line) {
      for (const [piece] of span.text.matchAll(/\s+|\S+/g)) {
        if (/\S/.test(piece)) {
          tokens.push({
            content: piece,
            offset,
            classes: span.classes,
            cell: {line: row, col},
          });
        }
        col = columnsAfter(col, piece, widths);
        offset += piece.length;
      }
    }
    offset += 1;
    return tokens;
  });
}

// Items with a key in both steps move, and `keep` merges the two. The others
// leave or enter.
function pairPlaced<T extends {key: string}, Moved = unknown>(
  from: Placed<T>[],
  to: Placed<T>[],
  keep: (before: T, after: T) => T & Moved,
): Transition<T, Moved>[] {
  const targets = new Map(to.map(placed => [placed.item.key, placed]));
  const kept = new Set<string>();
  const transitions: Transition<T, Moved>[] = [];
  for (const {item, cell} of from) {
    const target = targets.get(item.key);
    if (target) {
      kept.add(item.key);
      transitions.push({
        ...keep(item, target.item),
        kind: 'move',
        from: cell,
        to: target.cell,
      });
    } else {
      transitions.push({...item, kind: 'leave', from: cell});
    }
  }
  for (const {item, cell} of to) {
    if (!kept.has(item.key))
      transitions.push({...item, kind: 'enter', to: cell});
  }
  return transitions;
}

const after = <T>(_: T, item: T) => item;

const recolor = (before: Token, token: Token) =>
  before.classes === token.classes
    ? token
    : {...token, fromClasses: before.classes};

export function pairSteps(
  from: TokenLine[],
  to: TokenLine[],
  widths = NO_WIDTHS,
): TokenTransition[] {
  const keyed = (lines: TokenLine[], salt: string) => {
    const tokens = codeTokens(lines, widths);
    // Distinct salts keep the keys of unmatched tokens apart.
    const info = toKeyedTokens(lines.map(lineText).join('\n'), tokens, salt);
    return {info, tokens: tokens.flat()};
  };
  const source = keyed(from, 'from');
  const target = keyed(to, 'to');
  syncTokenKeys(source.info, target.info, {enhanceMatching: true});
  const placed = (token: CodeToken): Placed<Token> => ({
    item: {key: token.key!, text: token.content, classes: token.classes},
    cell: token.cell,
  });
  return pairPlaced(
    source.tokens.map(placed),
    target.tokens.map(placed),
    recolor,
  );
}

function markKinds(step: Step) {
  return new Map(
    step.marks.lines
      .filter(mark => mark.line >= 1 && mark.line <= step.lines.length)
      .map(mark => [mark.line - 1, mark.kind]),
  );
}

// CodeMirror sizes the gutter for the largest number with as many digits as
// the line count.
function gutterColumns(step: Step) {
  const largest = 10 ** String(step.lines.length).length - 1;
  return String(largest + step.lineNumberStart - 1).length;
}

function stepBox(step: Step, widths: GlyphWidths): StepBox {
  const kinds = markKinds(step);
  const indent = [...kinds.values()].some(kind => kind !== 'highlight') ? 2 : 0;
  return {
    rows: step.lines.length,
    columns:
      indent +
      Math.max(
        0,
        ...step.lines.map(line => columnsAfter(0, lineText(line), widths)),
      ),
    indent,
    dimmed: dimmedRows(step),
  };
}

// Focus is on when a focused line is inside the code. It then dims every
// other row, as StaticCodeView does.
function dimmedRows(step: Step): Set<number> {
  const rows = step.lines.map((_, row) => row);
  const focused = new Set(step.marks.focusedLines.map(line => line - 1));
  return new Set(
    rows.some(row => focused.has(row))
      ? rows.filter(row => !focused.has(row))
      : [],
  );
}

// A number keeps its key, so it moves only when its row or the gutter width
// changes and is never drawn twice.
function gutterNumbers(step: Step, columns: number): Placed<Token>[] {
  return step.lines.map((_, row) => {
    const text = String(step.lineNumberStart + row);
    return {
      item: {key: `gutter:${text}`, text, classes: ''},
      cell: {line: row, col: columns - text.length},
    };
  });
}

function pairGutters(from: Step, to: Step): Gutter {
  const fromColumns = gutterColumns(from);
  const toColumns = gutterColumns(to);
  return {
    numbers: pairPlaced(
      gutterNumbers(from, fromColumns),
      gutterNumbers(to, toColumns),
      after,
    ),
    fromColumns,
    toColumns,
  };
}

// Lines with the same kind and text pair in order.
function markTokens(step: Step): Placed<Mark>[] {
  const seen = new Map<string, number>();
  return [...markKinds(step)]
    .sort(([a], [b]) => a - b)
    .map(([row, kind]) => {
      const text = lineText(step.lines[row]);
      const occurrence = seen.get(`${kind}:${text}`) ?? 0;
      seen.set(`${kind}:${text}`, occurrence + 1);
      return {
        item: {key: `mark:${kind}:${occurrence}:${text}`, mark: kind},
        cell: {line: row, col: 0},
      };
    });
}

// Text keys alone would fade a mark out and back in on its row when a step
// edits the marked line, so leftover marks of one kind on one row pair too.
function pairMarks(from: Step, to: Step): MarkTransition[] {
  const source = markTokens(from);
  const target = markTokens(to);
  const sourceKeys = new Set(source.map(({item}) => item.key));
  const targetKeys = new Set(target.map(({item}) => item.key));
  const row = ({item, cell}: Placed<Mark>) => `${item.mark}:${cell.line}`;
  const unmatched = new Map(
    source
      .filter(({item}) => !targetKeys.has(item.key))
      .map(mark => [row(mark), mark.item.key]),
  );
  return pairPlaced(
    source,
    target.map(mark =>
      sourceKeys.has(mark.item.key)
        ? mark
        : {
            ...mark,
            item: {
              ...mark.item,
              key: unmatched.get(row(mark)) ?? mark.item.key,
            },
          },
    ),
    after,
  );
}

export function pairScene(
  from: Step,
  to: Step,
  lineNumbers: boolean,
  widths = NO_WIDTHS,
): Scene {
  return {
    code: pairSteps(from.lines, to.lines, widths),
    gutter: lineNumbers ? pairGutters(from, to) : null,
    marks: pairMarks(from, to),
    from: stepBox(from, widths),
    to: stepBox(to, widths),
  };
}
