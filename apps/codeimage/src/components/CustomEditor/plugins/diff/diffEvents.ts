import {Line} from '@codemirror/state';
import {createGlobalEmitter} from '@solid-primitives/event-bus';
import {createRoot} from 'solid-js';
import {DiffCheckboxState} from './DiffCheckbox';

export const diffPluginEvents = createRoot(() =>
  createGlobalEmitter<{
    syncLine: {state: DiffCheckboxState | null; line: Line};
  }>(),
);
