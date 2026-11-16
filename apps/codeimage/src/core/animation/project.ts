import type {EditorState, TabMarks} from '@codeimage/store/editor/model';
import type {StepView} from './model';

export function projectStep<T extends Pick<EditorState, 'code' | 'marks'>>(
  tab: T,
  view: StepView = {kind: 'tab'},
): T & {rows: number[]} {
  const lines = tab.code.split('\n');
  const rows = lines.flatMap((_, index) => {
    const line = index + 1;
    if (view.kind === 'diff') {
      const excluded = view.side === 'before' ? 'added' : 'removed';
      if (
        tab.marks.lines.some(
          mark => mark.line === line && mark.kind === excluded,
        )
      )
        return [];
    }
    if (view.kind === 'script') {
      const range = tab.marks.script?.lines.find(value => value.line === line);
      if (
        view.step < (range?.enter ?? 1) ||
        (range?.leave !== undefined && view.step >= range.leave)
      )
        return [];
    }
    return [line];
  });
  const mapped = new Map(rows.map((line, index) => [line, index + 1]));
  const marks: TabMarks = {
    lines: tab.marks.lines.flatMap(mark => {
      const line = mapped.get(mark.line);
      return line && (view.kind === 'tab' || mark.kind === 'highlight')
        ? [{...mark, line}]
        : [];
    }),
    focusedLines:
      view.kind === 'script'
        ? (tab.marks.script?.lines ?? []).flatMap(range => {
            const line = mapped.get(range.line);
            return line && range.focus?.includes(view.step) ? [line] : [];
          })
        : tab.marks.focusedLines.flatMap(line => mapped.get(line) ?? []),
  };
  return {
    ...tab,
    code: rows.map(line => lines[line - 1]).join('\n'),
    marks,
    rows,
  };
}
