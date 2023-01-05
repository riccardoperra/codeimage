import {Container} from '@codeimage/atomic-state';
import {createRoot} from 'solid-js';

const container = createRoot(() => Container.create());
export const provideAppState: typeof container.get = state =>
  container.get(state);
