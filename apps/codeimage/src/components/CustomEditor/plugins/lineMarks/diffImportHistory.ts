import {invertedEffects} from '@codemirror/commands';
import {StateEffect} from '@codemirror/state';
import type {Transaction} from '@codemirror/state';
import type {EditorState} from '../../../../state/editor/model';

export interface DiffImportSnapshot {
  editors: EditorState[];
  activeEditorId: string;
}

export const importDiff = StateEffect.define<{
  before: DiffImportSnapshot;
  after: DiffImportSnapshot;
}>();

export const diffImportHistory = invertedEffects.of(transaction =>
  transaction.effects.flatMap(effect =>
    effect.is(importDiff)
      ? [
          importDiff.of({
            before: effect.value.after,
            after: effect.value.before,
          }),
        ]
      : [],
  ),
);

export function restoreDiffImport(
  transaction: Transaction,
  restore: (snapshot: DiffImportSnapshot) => void,
) {
  for (const effect of transaction.effects) {
    if (effect.is(importDiff)) restore(effect.value.after);
  }
}
