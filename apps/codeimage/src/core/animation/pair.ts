import type {TokenLine} from '@core/snapshot/tokenize';
import {syncTokenKeys, toKeyedTokens} from '@shikijs/magic-move/core';
import type {Cell, Scene, Step, StepBox, TokenTransition} from './model';

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

const advance = (col: number, char: string) =>
  char === '\t' ? col + TAB_SIZE - (col % TAB_SIZE) : col + 1;

const lineText = (line: TokenLine) => line.map(span => span.text).join('');

const lineColumns = (line: TokenLine) =>
  Array.from(lineText(line)).reduce(advance, 0);

// Whitespace only adds width, so it moves the cells and is never a token.
// Splitting at whitespace keeps `=>` and `===` whole for ligatures.
function codeTokens(lines: TokenLine[]): CodeToken[][] {
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
        col = Array.from(piece).reduce(advance, col);
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
        classes,
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
): TokenTransition[] {
  const keyed = (lines: TokenLine[], salt: string) => {
    const tokens = codeTokens(lines);
    // Distinct salts keep the keys of unmatched tokens apart.
    const info = toKeyedTokens(lines.map(lineText).join('\n'), tokens, salt);
    return {info, tokens: tokens.flat()};
  };
  const source = keyed(from, 'from');
  const target = keyed(to, 'to');
  const ownKeys = new Map(target.tokens.map(token => [token, token.key!]));
  syncTokenKeys(source.info, target.info, {enhanceMatching: true});
  const sourceTokens = new Map(source.tokens.map(token => [token.key!, token]));
  // A matched token that changes classes changes color, so it fades from one
  // color to the other instead of moving under one of them.
  const place = (token: CodeToken): Placed => {
    const match = sourceTokens.get(token.key!);
    const recolored = match !== undefined && match.classes !== token.classes;
    return {
      key: recolored ? ownKeys.get(token)! : token.key!,
      text: token.content,
      classes: token.classes,
      cell: token.cell,
    };
  };
  return pairPlaced(
    source.tokens.map(token => ({
      key: token.key!,
      text: token.content,
      classes: token.classes,
      cell: token.cell,
    })),
    target.tokens.map(place),
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

function stepBox(step: Step, lineNumbers: boolean): StepBox {
  const kinds = markKinds(step);
  const indent = [...kinds.values()].some(kind => kind !== 'highlight')
    ? 2
    : 0;
  return {
    rows: step.lines.length,
    columns: indent + Math.max(0, ...step.lines.map(lineColumns)),
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

export function pairScene(from: Step, to: Step, lineNumbers: boolean): Scene {
  const fromBox = stepBox(from, lineNumbers);
  const toBox = stepBox(to, lineNumbers);
  return {
    code: pairSteps(from.lines, to.lines),
    gutter: lineNumbers
      ? pairPlaced(gutterTokens(from, fromBox), gutterTokens(to, toBox))
      : null,
    marks: pairPlaced(markTokens(from), markTokens(to)),
    from: fromBox,
    to: toBox,
  };
}
