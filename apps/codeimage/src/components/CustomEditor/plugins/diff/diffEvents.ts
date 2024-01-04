import {Line} from '@codemirror/state';
import {
  createEmitter,
  createEventStack,
  createGlobalEmitter,
} from '@solid-primitives/event-bus';
import {DiffCheckboxState} from './DiffCheckbox';
import {createRoot} from 'solid-js';

export const diffPluginEvents = createRoot(() =>
  createGlobalEmitter<{
    syncLine: {state: DiffCheckboxState | null; line: Line};
  }>(),
);
