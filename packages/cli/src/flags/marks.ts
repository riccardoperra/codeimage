import {inferLanguageFromPath} from '@codeimage/config';
import {annotateCode} from '@codeimage/render';
import {parseUnifiedDiff} from '../../../../apps/codeimage/src/core/diff/parseUnifiedDiff';
import {UsageError} from '../errors';
import type {Flag, FlagValues} from './index';

function highlights(values: FlagValues) {
  if (values.highlight === undefined) return [];
  if (
    typeof values.highlight !== 'string' ||
    !/^[1-9]\d*(?:-[1-9]\d*)?(?:,[1-9]\d*(?:-[1-9]\d*)?)*$/.test(
      values.highlight,
    )
  ) {
    throw new UsageError('--highlight: expected lines such as 3-5,9');
  }
  return values.highlight.split(',').map(range => {
    const [start, end = start] = range.split('-').map(Number);
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      end < start
    ) {
      throw new UsageError(
        '--highlight: expected ascending safe integer ranges',
      );
    }
    return {start, end};
  });
}

export const marks: Flag = {
  options: {
    diff: {type: 'boolean'},
    highlight: {type: 'string'},
    focus: {type: 'boolean'},
  },
  usage: `  --diff               Read a unified diff, one tab per changed file
  --highlight <lines>  Highlight lines such as 3-5,9
  --focus              Dim every line that is not highlighted
`,
  validate(values) {
    highlights(values);
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
        for (const mark of annotated.marks.lines) lines.set(mark.line, mark);
        return {
          ...input,
          code: annotated.code,
          marks: {
            lines: [...lines.values()],
            focus: annotated.marks.focus || input.marks?.focus === true,
          },
        };
      }),
    );
  },
  apply(snapshot, values) {
    const ranges = highlights(values);
    const editors = snapshot.editor.editors.map(tab => {
      const lines = new Map(
        (tab.marks?.lines ?? []).map(mark => [mark.line, mark]),
      );
      for (let line = 1; line <= tab.code.split('\n').length; line++) {
        const sourceLine = tab.lineNumberStart + line - 1;
        if (
          ranges.some(
            range => sourceLine >= range.start && sourceLine <= range.end,
          )
        ) {
          lines.set(line, {line, kind: 'highlight'});
        }
      }
      return {
        ...tab,
        marks: {
          lines: [...lines.values()].sort((a, b) => a.line - b.line),
          focus: values.focus === true || tab.marks?.focus === true,
        },
      };
    });
    if (
      values.focus &&
      !editors.some(tab => tab.marks.lines.some(m => m.kind === 'highlight'))
    ) {
      throw new UsageError(
        '--focus: no line is highlighted, so every line would be dimmed. Add --highlight or a [!code highlight] comment',
      );
    }
    return {...snapshot, editor: {...snapshot.editor, editors}};
  },
};
