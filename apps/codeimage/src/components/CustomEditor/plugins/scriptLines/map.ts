import type {Text} from '@codemirror/state';
import {Decoration, type DecorationSet} from '@codemirror/view';
import type {ScriptLine} from '@codeimage/store/editor/model';

export function inheritScriptRanges(
  script: {steps: string[]; lines: DecorationSet},
  doc: Text,
) {
  const byLine = new Map<number, ScriptLine>();
  for (let cursor = script.lines.iter(); cursor.value; cursor.next())
    byLine.set(doc.lineAt(cursor.from).number, cursor.value.spec.script);
  const ranges = [];
  let previous: ScriptLine | undefined;
  for (let line = 1; line <= doc.lines; line++) {
    let rule = byLine.get(line);
    if (!rule) {
      const neighbour =
        previous ?? [...byLine].find(([number]) => number > line)?.[1];
      rule = {
        line,
        ...(neighbour?.enter === undefined ? {} : {enter: neighbour.enter}),
        ...(neighbour?.leave === undefined ? {} : {leave: neighbour.leave}),
      };
    }
    previous = rule;
    ranges.push(
      Decoration.line({script: {...rule, line}}).range(doc.line(line).from),
    );
  }
  return {...script, lines: Decoration.set(ranges)};
}
