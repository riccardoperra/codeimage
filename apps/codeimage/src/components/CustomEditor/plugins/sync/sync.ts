import {Annotation, StateEffect, Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {customEffectAnnotation} from '../customEffectAnnotation';

export const syncAnnotation = Annotation.define<boolean>();

export function syncDispatch(
  transaction: Transaction,
  other: EditorView,
): boolean {
  if (transaction.annotation(syncAnnotation)) {
    return false;
  }
  const annotations: Annotation<unknown>[] = [syncAnnotation.of(true)];
  const effects: StateEffect<unknown>[] = [];
  let changed = false;
  if (!transaction.changes.empty) {
    changed = true;
    const userEvent = transaction.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
  }
  if (!!transaction.annotation(customEffectAnnotation)) {
    changed = true;
    effects.push(...transaction.effects);
  }
  if (changed) {
    other.dispatch({
      changes: transaction.changes,
      effects,
      annotations,
    });
  }
  return changed;
}
