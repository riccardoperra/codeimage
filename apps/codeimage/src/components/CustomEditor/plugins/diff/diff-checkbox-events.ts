import {Line} from '@codemirror/state';
import {createEventBus} from '@solid-primitives/event-bus';
import {createRoot} from 'solid-js';
import {DiffCheckboxState} from './DiffCheckbox';

export const diffCheckboxEvents = createRoot(() =>
  createEventBus<{
    state: DiffCheckboxState | null;
    line: Line;
  }>(),
);
