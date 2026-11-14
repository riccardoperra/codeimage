import type {TokenLine} from '@core/snapshot/tokenize';
import {syncTokenKeys, toKeyedTokens} from '@shikijs/magic-move/core';
import type {
  Cell,
  GlyphWidths,
  Scene,
  Step,
  StepBox,
  TokenTransition,
} from './model';

// Matches `tab-size` in the static layout.
const TAB_SIZE = 4;

type Placed = {key: string; text: string; classes: string; cell: Cell};

type CodeToken = {
  content: string;
  offset: number;
  classes: string;
  cell: Cell;
  key?: string;
};

const NO_WIDTHS: GlyphWidths = new Map();

const segmenter = new Intl.Segmenter();

export const isAscii = (text: string) => /^[\t\n -~]*$/.test(text);

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

function pairPlaced(from: Placed[], to: Placed[]): TokenTransition[] {
  const targets = new Map(to.map(token => [token.key, token]));
  const kept = new Set<string>();
  const transitions: TokenTransition[] = [];
  for (const {key, text, classes, cell} of from) {
    const target = targets.get(key);
    if (target) {
      kept.add(key);
      transitions.push({
        kind: 'move',
        key,
        text,
        classes: target.classes,
        ...(target.classes === classes ? {} : {fromClasses: classes}),
        from: cell,
        to: target.cell,
      });
    } else {
      transitions.push({kind: 'leave', key, text, classes, from: cell});
    }
  }
  for (const {key, text, classes, cell} of to) {
    if (!kept.has(key)) {
      transitions.push({kind: 'enter', key, text, classes, to: cell});
    }
  }
  return transitions;
}

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
  const placed = (token: CodeToken): Placed => ({
    key: token.key!,
    text: token.content,
    classes: token.classes,
    cell: token.cell,
  });
  return pairPlaced(source.tokens.map(placed), target.tokens.map(placed));
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

function stepBox(
  step: Step,
  lineNumbers: boolean,
  widths: GlyphWidths,
): StepBox {
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
    gutterColumns: lineNumbers ? gutterColumns(step) : 0,
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
function gutterTokens(step: Step, box: StepBox): Placed[] {
  return step.lines.map((_, row) => {
    const text = String(step.lineNumberStart + row);
    return {
      key: `gutter:${text}`,
      text,
      classes: '',
      cell: {line: row, col: box.gutterColumns - text.length},
    };
  });
}

// Lines with the same kind and text pair in order.
function markTokens(step: Step): Placed[] {
  const seen = new Map<string, number>();
  return [...markKinds(step)]
    .sort(([a], [b]) => a - b)
    .map(([row, kind]) => {
      const text = lineText(step.lines[row]);
      const occurrence = seen.get(`${kind}:${text}`) ?? 0;
      seen.set(`${kind}:${text}`, occurrence + 1);
      return {
        key: `mark:${kind}:${occurrence}:${text}`,
        text,
        classes: kind,
        cell: {line: row, col: 0},
      };
    });
}

export function pairScene(
  from: Step,
  to: Step,
  lineNumbers: boolean,
  widths = NO_WIDTHS,
): Scene {
  const fromBox = stepBox(from, lineNumbers, widths);
  const toBox = stepBox(to, lineNumbers, widths);
  return {
    code: pairSteps(from.lines, to.lines, widths),
    gutter: lineNumbers
      ? pairPlaced(gutterTokens(from, fromBox), gutterTokens(to, toBox))
      : null,
    marks: pairPlaced(markTokens(from), markTokens(to)),
    from: fromBox,
    to: toBox,
  };
}
