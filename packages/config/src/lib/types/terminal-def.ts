import {Component} from 'solid-js';

export interface TerminalDefinition<T, TComponent> {
  name: T;
  component: Component<TComponent>;
}

export type TerminalDefinitionMap<T extends string, TComponent> = {
  keys: readonly [...T[]];
  entries: Record<T, TerminalDefinition<string, TComponent>>;
};
