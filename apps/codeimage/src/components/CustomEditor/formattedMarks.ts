import type {TabMarks} from '@codeimage/store/editor/model';
import {mapLines} from '@core/diff/mapLines';

export function formattedMarks(
  marks: TabMarks,
  before: string,
  after: string,
): TabMarks {
  const lines = mapLines(before, after);
  return {
    ...(marks.script
      ? {
          script: {
            ...marks.script,
            lines: marks.script.lines.flatMap(rule => {
              const line = lines.get(rule.line);
              return line ? [{...rule, line}] : [];
            }),
          },
        }
      : {}),
    focusedLines: marks.focusedLines.flatMap(line => lines.get(line) ?? []),
    lines: marks.lines.flatMap(mark => {
      const line = lines.get(mark.line);
      return line ? [{...mark, line}] : [];
    }),
  };
}
