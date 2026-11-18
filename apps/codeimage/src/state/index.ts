import {createPathSetter} from '@codeimage/atomic-state';
import {Container, useContainer} from 'statebuilder';
import {
  createComponent,
  createContext,
  createRoot,
  getOwner,
  useContext,
} from 'solid-js';
import type {FlowProps, StoreSetter} from 'solid-js';

const container = createRoot(() => Container.create());
const AppStateScope = createContext<Container | null>(null);

export function getAppStateContainer() {
  return (getOwner() ? useContext(AppStateScope) : null) ?? container;
}

export function AppStateProvider(props: FlowProps) {
  return createComponent(AppStateScope, {
    value: useContainer(),
    get children() {
      return props.children;
    },
  });
}

export const provideAppState: typeof container.get = state =>
  getAppStateContainer().get(state);

export function exposeStorePaths<T, S extends object>(
  store: S & {(): T; set: StoreSetter<T>},
) {
  const {set, ...extensions} = store;
  return Object.assign(() => store(), extensions, {set: createPathSetter(set)});
}
