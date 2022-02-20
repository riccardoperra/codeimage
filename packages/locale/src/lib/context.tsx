import {Component, createContext} from 'solid-js';
import rosetta from 'rosetta';

export const i18n = rosetta({});

export const LocaleContext = createContext<typeof i18n>();

export const LocaleProvider: Component = props => {
  return (
    <LocaleContext.Provider value={i18n}>
      {props.children}
    </LocaleContext.Provider>
  );
};
