import {createContext, JSXElement, PropsWithChildren} from 'solid-js';
import {AppStaticConfiguration} from '../types/configuration';

export const StaticConfigurationContext =
  createContext<AppStaticConfiguration>();

export function StaticConfigurationProvider<T extends AppStaticConfiguration>(
  props: PropsWithChildren<{config: T}>,
): JSXElement {
  return (
    <StaticConfigurationContext.Provider value={props.config}>
      {props.children}
    </StaticConfigurationContext.Provider>
  );
}
