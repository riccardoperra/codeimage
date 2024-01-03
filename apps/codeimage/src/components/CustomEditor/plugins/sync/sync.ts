import {Annotation, StateEffect, Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {editorRegisteredEffects} from '../../registered-effects';

const syncAnnotation = Annotation.define<boolean>();

export function syncDispatch(transaction: Transaction, other: EditorView) {
  if (transaction.annotation(syncAnnotation)) {
    return;
  }
  const annotations: Annotation<unknown>[] = [syncAnnotation.of(true)];
  const effects: StateEffect<unknown>[] = [];
  let changed = false;
  if (!transaction.changes.empty) {
    changed = true;
    const userEvent = transaction.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
  }
  const stateEffects = transaction.effects
    .filter(effect => !!effect)
    .filter(effect =>
      editorRegisteredEffects.some(registeredEffect =>
        effect.is(registeredEffect),
      ),
    );
  if (stateEffects.length) {
    changed = true;
    effects.push(...stateEffects);
  }
  if (changed) {
    other.dispatch({
      changes: transaction.changes,
      effects,
      annotations,
    });
  }
}
