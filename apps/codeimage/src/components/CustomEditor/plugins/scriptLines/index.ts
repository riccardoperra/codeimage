import type {EditorState, Range} from '@codemirror/state';
import {
  Decoration,
  EditorView,
  showTooltip,
  type Tooltip,
} from '@codemirror/view';
import {lineMarksField, readMarks} from '../lineMarks/state';
import * as styles from './scriptLines.css';

type ScriptLine = NonNullable<
  ReturnType<typeof readMarks>['script']
>['lines'][number];

const BADGE_HEIGHT = 16;

function scriptOf(state: EditorState) {
  return state.field(lineMarksField, false) ? readMarks(state).script : null;
}

function badgeText(value: ScriptLine) {
  return [
    value.leave !== undefined
      ? `${value.enter ?? 1}–${value.leave - 1}`
      : (value.enter ?? 1) > 1
        ? `${value.enter}→`
        : '',
    value.focus?.length ? `●${value.focus.join(',')}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function badge(pos: number, text: string): Tooltip {
  return {
    pos,
    above: false,
    strictSide: true,
    arrow: false,
    create: view => {
      const dom = document.createElement('div');
      dom.className = styles.badge;
      dom.textContent = text;
      dom.dataset.animateAid = 'badge';
      dom.setAttribute('aria-hidden', 'true');
      return {
        dom,
        overlap: true,
        offset: {x: 12, y: 0},
        getCoords: at => {
          const coords = view.coordsAtPos(at, 1);
          if (!coords) return {left: 0, right: 0, top: 0, bottom: 0};
          const top = (coords.top + coords.bottom) / 2 - BADGE_HEIGHT / 2;
          return {left: coords.right, right: coords.right, top, bottom: top};
        },
      };
    },
  };
}

function badges(state: EditorState): readonly Tooltip[] {
  const script = scriptOf(state);
  if (!script) return [];
  return script.lines.flatMap(value => {
    if (value.line < 1 || value.line > state.doc.lines) return [];
    const text = badgeText(value);
    return text ? [badge(state.doc.line(value.line).to, text)] : [];
  });
}

function lineDecorations(view: EditorView, step: number | null) {
  const script = scriptOf(view.state);
  if (!script || step === null) return Decoration.none;
  const {doc} = view.state;
  const byLine = new Map(script.lines.map(value => [value.line, value]));
  const visible = (value: ScriptLine | undefined) =>
    !value ||
    (step >= (value.enter ?? 1) &&
      (value.leave === undefined || step < value.leave));
  const focusing = script.lines.some(
    value => visible(value) && value.focus?.includes(step),
  );
  const ranges: Range<Decoration>[] = [];
  for (let number = 1; number <= doc.lines; number++) {
    const value = byLine.get(number);
    const classes: string[] = [];
    if (!visible(value)) classes.push(styles.ghost);
    else {
      if (step > 1 && value?.enter === step) classes.push(styles.entering);
      if (focusing && !value?.focus?.includes(step))
        classes.push(styles.dimmed);
    }
    if (classes.length)
      ranges.push(
        Decoration.line({
          class: classes.join(' '),
          attributes: {'data-animate-aid': 'line'},
        }).range(doc.line(number).from),
      );
  }
  return Decoration.set(ranges);
}

export function scriptLinesExtension(step: number | null) {
  return [
    EditorView.decorations.of(view => lineDecorations(view, step)),
    showTooltip.computeN([lineMarksField], badges),
  ];
}
