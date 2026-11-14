import {inferLanguageFromPath} from '@codeimage/config';
import {annotateCode} from '@codeimage/render';
import {parseUnifiedDiff} from '../../../../apps/codeimage/src/core/diff/parseUnifiedDiff';
import {UsageError} from '../errors';
import type {Flag, FlagValues} from './index';

function lineRanges(values: FlagValues, flag: 'highlight' | 'focus') {
  const value = values[flag];
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  return entries.flatMap(entry => {
    if (
      typeof entry !== 'string' ||
      !/^[1-9]\d*(?:-[1-9]\d*)?(?:,[1-9]\d*(?:-[1-9]\d*)?)*$/.test(entry)
    ) {
      throw new UsageError(`--${flag}: expected lines such as 3-5,9`);
    }
    return entry.split(',').map(range => {
      const [start, end = start] = range.split('-').map(Number);
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        end < start
      ) {
        throw new UsageError(
          `--${flag}: expected ascending safe integer ranges`,
        );
      }
      return {start, end};
    });
  });
}

export const marks: Flag = {
  options: {
    diff: {type: 'boolean'},
    highlight: {type: 'string'},
    focus: {type: 'string', multiple: true},
  },
  usage: `  --diff               Read a unified diff, one tab per changed file
  --highlight <lines>  Highlight lines such as 3-5,9
  --focus <lines>      Focus lines such as 3-5,9; repeat to add ranges
`,
  validate(values) {
    lineRanges(values, 'highlight');
    lineRanges(values, 'focus');
  },
  async prepareInputs(inputs, values) {
    const files = values.diff
      ? inputs.flatMap(input => {
          const files = parseUnifiedDiff(input.code);
          if (!files.length)
            throw new UsageError(
              `--diff: ${input.name} contains no text hunks or is malformed`,
            );
          return files.map(file => ({
            name: file.path,
            code: file.code,
            marks: file.marks,
          }));
        })
      : inputs;
    return Promise.all(
      files.map(async input => {
        const languageId =
          typeof values.lang === 'string'
            ? values.lang
            : (inferLanguageFromPath(input.name) ?? 'plain-text');
        const annotated = await annotateCode(
          input.code,
          languageId,
          input.name,
        );
        const lines = new Map(
          (input.marks?.lines ?? []).flatMap(mark => {
            const line = annotated.sourceLines.indexOf(mark.line) + 1;
            return line ? [[line, {...mark, line}] as const] : [];
          }),
        );
        const focusedLines = new Set(
          (input.marks?.focusedLines ?? []).flatMap(sourceLine => {
            const line = annotated.sourceLines.indexOf(sourceLine) + 1;
            return line ? [line] : [];
          }),
        );
        for (const line of annotated.marks.focusedLines) focusedLines.add(line);
        for (const mark of annotated.marks.lines) lines.set(mark.line, mark);
        return {
          ...input,
          code: annotated.code,
          marks: {
            lines: [...lines.values()],
            focusedLines: [...focusedLines].sort((a, b) => a - b),
          },
        };
      }),
    );
  },
  apply(snapshot, values) {
    const ranges = lineRanges(values, 'highlight');
    const focusRanges = lineRanges(values, 'focus');
    const editors = snapshot.editor.editors.map(tab => {
      const lines = new Map(
        (tab.marks?.lines ?? []).map(mark => [mark.line, mark]),
      );
      const focusedLines = new Set(tab.marks?.focusedLines ?? []);
      for (let line = 1; line <= tab.code.split('\n').length; line++) {
        const sourceLine = tab.lineNumberStart + line - 1;
        if (
          ranges.some(
            range => sourceLine >= range.start && sourceLine <= range.end,
          )
        ) {
          lines.set(line, {line, kind: 'highlight'});
        }
        if (
          focusRanges.some(
            range => sourceLine >= range.start && sourceLine <= range.end,
          )
        ) {
          focusedLines.add(line);
        }
      }
      return {
        ...tab,
        marks: {
          lines: [...lines.values()].sort((a, b) => a.line - b.line),
          focusedLines: [...focusedLines].sort((a, b) => a - b),
        },
      };
    });
    return {...snapshot, editor: {...snapshot.editor, editors}};
  },
};
