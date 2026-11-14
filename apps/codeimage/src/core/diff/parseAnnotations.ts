import type {CommentTokens} from '@codemirror/commands';
import type {LineMark, TabMarks} from '../../state/editor/model';

export interface AnnotatedCode {
  code: string;
  marks: TabMarks;
  count: number;
  sourceLines: number[];
}

const NOTATION = /\[!code (\+\+|--|highlight|focus)(?::([1-9]\d*))?\]/g;

/**
 * Returns the quote open at `end`. Only template literals continue across
 * lines, and a quote without a closing partner on the line (a Rust lifetime,
 * an apostrophe in prose) does not open a string.
 */
function quoteAt(line: string, open: string, end: number): string {
  let quote = open;
  for (let index = 0; index < end; index++) {
    const char = line[index];
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = '';
    } else if (
      char === '`' ||
      ((char === '"' || char === "'") && line.includes(char, index + 1))
    ) {
      quote = char;
    }
  }
  return quote;
}

/** Comment delimiters come from the active language's CodeMirror commentTokens. */
export function parseAnnotations(
  input: string,
  tokens: CommentTokens,
): AnnotatedCode {
  const source = input.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  const sourceLines: number[] = [];
  const pending: {
    line: number;
    kind: LineMark['kind'] | 'focus';
    count: number;
  }[] = [];
  const focusedLines = new Set<number>();
  let count = 0;
  let template = '';
  for (const [sourceIndex, line] of source.entries()) {
    const openAtStart = template;
    template = quoteAt(line, template, line.length) === '`' ? '`' : '';
    const annotations = [...line.matchAll(NOTATION)].filter(
      match => !match[2] || match[1] === 'highlight' || match[1] === 'focus',
    );
    if (!annotations.length) {
      output.push(line);
      sourceLines.push(sourceIndex + 1);
      continue;
    }
    const first = annotations[0].index;
    const last = annotations[annotations.length - 1];
    let commentStart = tokens.line ? line.lastIndexOf(tokens.line, first) : -1;
    let commentEnd = line.length;
    let delimiters = [tokens.line ?? ''];
    if (tokens.block) {
      const open = line.lastIndexOf(tokens.block.open, first);
      const close = line.indexOf(
        tokens.block.close,
        last.index + last[0].length,
      );
      if (open > commentStart && close >= 0) {
        commentStart = open;
        commentEnd = close + tokens.block.close.length;
        delimiters = [tokens.block.open, tokens.block.close];
      }
    }
    if (commentStart < 0 || quoteAt(line, openAtStart, commentStart)) {
      output.push(line);
      sourceLines.push(sourceIndex + 1);
      continue;
    }
    const comment = line.slice(commentStart, commentEnd);
    const withoutNotation = annotations.reduce(
      (text, match) => text.replace(match[0], ''),
      comment,
    );
    const remainder = delimiters.reduce(
      (text, delimiter) => text.replace(delimiter, ''),
      withoutNotation,
    );
    const cleaned = remainder.trim()
      ? line.slice(0, commentStart) + withoutNotation + line.slice(commentEnd)
      : (line.slice(0, commentStart) + line.slice(commentEnd)).trimEnd();
    const standalone = !cleaned.trim();
    const target = output.length + 1;
    for (const match of annotations) {
      const notation = match[1];
      pending.push({
        line: target,
        kind:
          notation === '++'
            ? 'added'
            : notation === '--'
              ? 'removed'
              : notation === 'focus'
                ? 'focus'
                : 'highlight',
        count: Math.min(Number(match[2] ?? 1), source.length),
      });
      count++;
    }
    if (!standalone) {
      output.push(cleaned);
      sourceLines.push(sourceIndex + 1);
    }
  }
  const lines = new Map<number, LineMark>();
  for (const mark of pending) {
    for (
      let line = mark.line;
      line < mark.line + mark.count && line <= output.length;
      line++
    ) {
      if (mark.kind === 'focus') focusedLines.add(line);
      else lines.set(line, {line, kind: mark.kind});
    }
  }
  return {
    code: output.join('\n'),
    marks: {
      lines: [...lines.values()].sort((a, b) => a.line - b.line),
      focusedLines: [...focusedLines].sort((a, b) => a - b),
    },
    count,
    sourceLines,
  };
}
