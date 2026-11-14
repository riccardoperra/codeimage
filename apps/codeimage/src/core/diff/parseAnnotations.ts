import type {CommentTokens} from '@codemirror/commands';
import type {LineMark, TabMarks} from '../../state/editor/model';

export interface AnnotatedCode {
  code: string;
  marks: TabMarks;
  count: number;
}

/** Comment delimiters come from the active language's CodeMirror commentTokens. */
export function parseAnnotations(
  input: string,
  tokens: CommentTokens,
): AnnotatedCode {
  const source = input.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  const pending: {line: number; kind: LineMark['kind']; count: number}[] = [];
  let focus = false;
  let count = 0;
  let quote = '';
  for (const line of source) {
    let commentStart = -1;
    let commentEnd = line.length;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      if (quote) {
        if (char === '\\') index++;
        else if (char === quote) quote = '';
        continue;
      }
      if (tokens.line && line.startsWith(tokens.line, index)) {
        commentStart = index;
        break;
      }
      if (tokens.block && line.startsWith(tokens.block.open, index)) {
        const end = line.indexOf(
          tokens.block.close,
          index + tokens.block.open.length,
        );
        if (end >= 0) {
          commentStart = index;
          commentEnd = end + tokens.block.close.length;
          break;
        }
      }
      if (char === '"' || char === "'" || char === '`') quote = char;
    }
    if (commentStart < 0) {
      output.push(line);
      continue;
    }
    const comment = line.slice(commentStart, commentEnd);
    const annotations = [
      ...comment.matchAll(
        /\[!code (\+\+|--|highlight|focus)(?::([1-9]\d*))?\]/g,
      ),
    ].filter(
      match => !match[2] || match[1] === 'highlight' || match[1] === 'focus',
    );
    if (!annotations.length) {
      output.push(line);
      continue;
    }
    let remainder = comment;
    for (const match of annotations)
      remainder = remainder.replace(match[0], '');
    const delimiters =
      tokens.block && comment.startsWith(tokens.block.open)
        ? [tokens.block.open, tokens.block.close]
        : [tokens.line ?? ''];
    for (const delimiter of delimiters)
      remainder = remainder.replace(delimiter, '');
    const cleaned = remainder.trim()
      ? line.slice(0, commentStart) +
        annotations.reduce(
          (text, match) => text.replace(match[0], ''),
          comment,
        ) +
        line.slice(commentEnd)
      : (line.slice(0, commentStart) + line.slice(commentEnd)).trimEnd();
    const standalone = !cleaned.trim();
    const target = output.length + 1;
    for (const match of annotations) {
      const notation = match[1];
      focus ||= notation === 'focus';
      pending.push({
        line: target,
        kind:
          notation === '++'
            ? 'added'
            : notation === '--'
              ? 'removed'
              : 'highlight',
        count: Math.min(Number(match[2] ?? 1), source.length),
      });
      count++;
    }
    if (!standalone) output.push(cleaned);
  }
  const lines = new Map<number, LineMark>();
  for (const mark of pending) {
    for (
      let line = mark.line;
      line < mark.line + mark.count && line <= output.length;
      line++
    ) {
      lines.set(line, {line, kind: mark.kind});
    }
  }
  return {
    code: output.join('\n'),
    marks: {lines: [...lines.values()].sort((a, b) => a.line - b.line), focus},
    count,
  };
}
