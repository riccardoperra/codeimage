import type {Range} from '@codemirror/state';
import {Decoration, EditorView, WidgetType} from '@codemirror/view';
import {lineMarksField, readMarks} from '../lineMarks/state';
import * as styles from './scriptLines.css';

class Badge extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: Badge) {
    return other.text === this.text;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = styles.badge;
    span.textContent = this.text;
    span.dataset.animateAid = 'badge';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
}

export function scriptLinesExtension(step: number | null) {
  return EditorView.decorations.of(view => {
    if (!view.state.field(lineMarksField, false)) return Decoration.none;
    const script = readMarks(view.state).script;
    if (!script) return Decoration.none;
    const ranges: Range<Decoration>[] = [];
    for (const value of script.lines) {
      if (value.line < 1 || value.line > view.state.doc.lines) continue;
      const line = view.state.doc.line(value.line);
      const classes: string[] = [];
      if (step !== null) {
        if (
          step < (value.enter ?? 1) ||
          (value.leave !== undefined && step >= value.leave)
        )
          classes.push(styles.ghost);
        else if (step > 1 && value.enter === step)
          classes.push(styles.entering);
        if (value.focus?.includes(step)) classes.push(styles.focused);
      }
      if (classes.length)
        ranges.push(
          Decoration.line({
            class: classes.join(' '),
            attributes: {
              'data-animate-aid': 'line',
              'data-animate-aid-classes': classes.join(' '),
            },
          }).range(line.from),
        );
      const text = [
        value.leave !== undefined
          ? `${value.enter ?? 1}–${value.leave - 1}`
          : (value.enter ?? 1) > 1
            ? `${value.enter}→`
            : '',
        value.focus?.length ? `●${value.focus.join(',')}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (text)
        ranges.push(
          Decoration.widget({widget: new Badge(text), side: 1}).range(line.to),
        );
    }
    return Decoration.set(ranges, true);
  });
}
