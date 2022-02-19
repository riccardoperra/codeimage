import {Component, createContext, useContext} from 'solid-js';
import {AppStaticConfiguration} from './configuration';

const StaticConfigurationContext = createContext<AppStaticConfiguration>();

export const StaticConfigurationProvider: Component<{
  value: AppStaticConfiguration;
}> = props => {
  return (
    <StaticConfigurationContext.Provider value={props.value}>
      {props.children}
    </StaticConfigurationContext.Provider>
  );
};

export function useStaticConfiguration(): AppStaticConfiguration {
  const context = useContext(StaticConfigurationContext);

  if (!context) {
    throw new Error('Static configuration missing');
  }

  return context;
}
