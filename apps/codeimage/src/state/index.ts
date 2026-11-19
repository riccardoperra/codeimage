import {Container, useContainer} from 'statebuilder';
import {
  createComponent,
  createContext,
  createRoot,
  getOwner,
  useContext,
} from 'solid-js';
import type {FlowProps} from 'solid-js';

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
