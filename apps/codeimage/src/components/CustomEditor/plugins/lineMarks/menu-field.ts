import {StateField} from '@codemirror/state';
import {showTooltip, type Tooltip} from '@codemirror/view';
import type {LineMarkLabels} from './commands';
import type {LineMarkPlacement} from './placement';
import {gutterState} from './gutter-state';
import {createMenuView} from './menu-view';

export function createMenuField(
  labels: LineMarkLabels,
  placement: LineMarkPlacement,
) {
  const menuField = StateField.define<Tooltip | null>({
    create: () => null,
    update(value, tr) {
      const open = tr.state.field(gutterState).open;
      if (!open) return null;
      if (open === tr.startState.field(gutterState).open) return value;
      return {
        pos: tr.state.doc.line(open.line).from,
        clip: false,
        create: view => createMenuView({view, open, labels, placement}),
      };
    },
    provide: field => showTooltip.from(field),
  });
  return menuField;
}
